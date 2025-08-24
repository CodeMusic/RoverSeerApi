// ===== M5 ATOM Echo: PTT → n8n → stream reply (stack-safe + stronger chirp, no i2s_wait_tx_done) =====

#include <WiFi.h>
#include <WiFiClientSecure.h>
#include <HTTPClient.h>
#include <driver/i2s.h>
#include <M5Atom.h>
#include <FS.h>
#include <SPIFFS.h>
#include <math.h>
#include <string.h>
#include <memory>

// ---------------- Pins ----------------
#define BTN_PIN          39
#define I2S_PORT         I2S_NUM_0
#define I2S_BCK_PIN      19
#define I2S_LRCK_PIN     33
#define I2S_DATA_OUT_PIN 22
#define I2S_DATA_IN_PIN  23

// ---------------- Modes ----------------
#define MODE_MIC  0
#define MODE_SPK  1

// ---------------- Audio config ----------------
static const uint32_t REC_SAMPLE_RATE  = 16000;  // record 16 kHz mono PCM16
static const uint16_t PCM_BITS         = 16;
static const uint32_t MAX_RECORD_MS    = 8000;
static const uint32_t BYTES_PER_SEC    = REC_SAMPLE_RATE * (PCM_BITS / 8);
static const uint32_t MAX_RECORD_BYTES = (MAX_RECORD_MS * BYTES_PER_SEC) / 1000;

#define WAV_FILE   "/record.wav"
// #define RESP_FILE  "/response.wav"  // uncomment to mirror streamed reply

// ---------------- Wi-Fi ----------------
const char* ssid1 = "CodeMusicai";
const char* pass1 = "cnatural";
const char* ssid2 = "RevivalNetwork ";
const char* pass2 = "xunjmq84";

// Webhook that returns audio/wav
const char* webhook = "https://n8n.codemusic.ca/webhook/audio-assistant/S3CR3TK3Y";

// ---------------- HTTP tuning ----------------
static const uint32_t HTTP_TIMEOUT_MS = 600000; // 10m

// ---------------- Playback tuning ----------------
static float PLAY_ATTEN = 0.40f;      // lower to avoid crackle (0.35–0.55 good)
static const uint16_t FADE_MS = 12;   // tiny fade to remove clicks
static const int PREBUFFER_BYTES = 32 * 1024;   // larger prebuffer

// ---------------- Stream buffers (file-scope to avoid stack spikes) ----
static const int RAW_MAX = 2048;              // 2KB chunks = safe
static uint8_t RAW_WORK[RAW_MAX + 1];         // odd-byte carry workspace
static uint8_t RAW_IN[RAW_MAX];               // read buffer

// ---------------- State ----------------
bool isRecording = false;
int  currentMode = -1;
bool i2sInstalled = false;

// 128-bit random hex session id
char SESSION_ID[33] = {0};

// ---------------- LED helper ----------------
inline void ledColor(uint8_t r, uint8_t g, uint8_t b) { M5.dis.drawpix(0, CRGB(r, g, b)); }

inline void ensureSpk(uint32_t sr = 16000) {
  if (currentMode != MODE_SPK) {
    initI2S(MODE_SPK, sr);
    i2s_zero_dma_buffer(I2S_PORT);
    delay(5);
  }
}

// ---------------- Session ID ----------------
static void genSessionIdOnce() {
  uint8_t b[16];
  for (int i = 0; i < 16; ) {
    uint32_t r = esp_random();
    b[i++] = (r >> 24) & 0xFF;
    b[i++] = (r >> 16) & 0xFF;
    b[i++] = (r >>  8) & 0xFF;
    b[i++] = (r >>  0) & 0xFF;
  }
  static const char* hex = "0123456789abcdef";
  for (int i = 0; i < 16; ++i) {
    SESSION_ID[2*i+0] = hex[(b[i] >> 4) & 0xF];
    SESSION_ID[2*i+1] = hex[(b[i] >> 0) & 0xF];
  }
  SESSION_ID[32] = '\0';
}

// ---------------- I2S init/swap (single port) ----------------
bool initI2S(int mode, uint32_t sampleRate) {
  if (i2sInstalled) i2s_driver_uninstall(I2S_PORT);

  // Use APLL for 11025/22050/44100/... families (improves 22.05k accuracy)
  bool needApll = (sampleRate % 11025) == 0;

  i2s_config_t cfg = {
    .mode = (i2s_mode_t)(I2S_MODE_MASTER),
    .sample_rate = sampleRate,
    .bits_per_sample = I2S_BITS_PER_SAMPLE_16BIT,
    .channel_format = I2S_CHANNEL_FMT_ONLY_RIGHT,   // mono on right
#if ESP_IDF_VERSION > ESP_IDF_VERSION_VAL(4, 1, 0)
    .communication_format = I2S_COMM_FORMAT_STAND_I2S,
#else
    .communication_format = I2S_COMM_FORMAT_I2S,
#endif
    .intr_alloc_flags = ESP_INTR_FLAG_LEVEL1,
    .dma_buf_count = 12,     // bigger DMA to resist jitter
    .dma_buf_len   = 1024,
    .use_apll = needApll,
    .tx_desc_auto_clear = true,
    .fixed_mclk = 0
  };

  if (mode == MODE_MIC)
    cfg.mode = (i2s_mode_t)(I2S_MODE_MASTER | I2S_MODE_RX | I2S_MODE_PDM);
  else
    cfg.mode = (i2s_mode_t)(I2S_MODE_MASTER | I2S_MODE_TX);

  if (i2s_driver_install(I2S_PORT, &cfg, 0, NULL) != ESP_OK) { Serial.println("i2s_driver_install failed"); return false; }

  i2s_pin_config_t pins;
#if (ESP_IDF_VERSION > ESP_IDF_VERSION_VAL(4, 3, 0))
  pins.mck_io_num = I2S_PIN_NO_CHANGE;
#endif
  pins.bck_io_num   = I2S_BCK_PIN;
  pins.ws_io_num    = I2S_LRCK_PIN;
  pins.data_out_num = I2S_DATA_OUT_PIN;
  pins.data_in_num  = I2S_DATA_IN_PIN;

  if (i2s_set_pin(I2S_PORT, &pins) != ESP_OK) { Serial.println("i2s_set_pin failed"); return false; }
  if (i2s_set_clk(I2S_PORT, sampleRate, I2S_BITS_PER_SAMPLE_16BIT, I2S_CHANNEL_MONO) != ESP_OK) {
    Serial.println("i2s_set_clk failed"); return false;
  }
  i2s_set_sample_rates(I2S_PORT, sampleRate); // double-set helps on some builds

  currentMode = mode;
  i2sInstalled = true;
  return true;
}

// ---------------- WAV header writer ----------------
void writeWavHeader(File &f, uint32_t dataBytes, uint32_t rate) {
  const uint16_t audioFormat = 1, numChannels = 1, bits = 16;
  const uint32_t byteRate = rate * numChannels * (bits/8);
  const uint16_t blockAlign = numChannels * (bits/8);

  f.seek(0);
  f.write((const uint8_t*)"RIFF", 4);
  uint32_t chunkSize = 36 + dataBytes;  f.write((uint8_t*)&chunkSize, 4);
  f.write((const uint8_t*)"WAVE", 4);
  f.write((const uint8_t*)"fmt ", 4);
  uint32_t subchunk1Size = 16;          f.write((uint8_t*)&subchunk1Size, 4);
  f.write((uint8_t*)&audioFormat, 2);
  f.write((uint8_t*)&numChannels, 2);
  f.write((uint8_t*)&rate, 4);
  f.write((uint8_t*)&byteRate, 4);
  f.write((uint8_t*)&blockAlign, 2);
  f.write((uint8_t*)&bits, 2);
  f.write((const uint8_t*)"data", 4);
  f.write((uint8_t*)&dataBytes, 4);
}

// ---------------- helpers: fade + soft clip ----------------
static inline int16_t softClipInt16(int v) {
  if (v > 32767)  return 32767;
  if (v < -32768) return -32768;
  return (int16_t)v;
}
static void applyFadeAndGain(int16_t* samples, int count, uint32_t sr, bool startBlock, bool lastBlock) {
  int fadeCount = (FADE_MS * sr) / 1000;
  if (fadeCount < 8) fadeCount = 8;
  if (fadeCount > count/2) fadeCount = count/2;

  float gain = PLAY_ATTEN;

  if (startBlock) {
    for (int i = 0; i < fadeCount && i < count; ++i) {
      float t = (float)i / (float)fadeCount;     // 0..1
      float a = t * gain;
      samples[i] = softClipInt16((int)(samples[i] * a));
    }
    for (int i = fadeCount; i < count; ++i)
      samples[i] = softClipInt16((int)(samples[i] * gain));
  } else if (lastBlock) {
    for (int i = 0; i < count - fadeCount; ++i)
      samples[i] = softClipInt16((int)(samples[i] * gain));
    for (int i = max(0, count - fadeCount); i < count; ++i) {
      float t = (float)(count - 1 - i) / (float)fadeCount; // 1..0
      float a = t * gain;
      samples[i] = softClipInt16((int)(samples[i] * a));
    }
  } else {
    for (int i = 0; i < count; ++i)
      samples[i] = softClipInt16((int)(samples[i] * gain));
  }
}

// ---------------- Stream WAV (parse header + prebuffer, odd-byte safe) ----------------
bool streamWavReply(HTTPClient &http, const char* mirrorPath /*= nullptr*/) {
  WiFiClient* stream = http.getStreamPtr();

  // Optional mirror file
  File mirror;
  if (mirrorPath) {
    if (SPIFFS.exists(mirrorPath)) SPIFFS.remove(mirrorPath);
    mirror = SPIFFS.open(mirrorPath, FILE_WRITE);
  }
  auto mirrorWrite = [&](const void* p, size_t n){ if (mirror) mirror.write((const uint8_t*)p, n); };

  // ---- Parse minimal WAV header (RIFF/WAVE + fmt + data) ----
  auto readU32LE = [](WiFiClient* s)->uint32_t {
    uint8_t b[4]; if (s->readBytes(b,4)<4) return 0;
    return (uint32_t)b[0]|((uint32_t)b[1]<<8)|((uint32_t)b[2]<<16)|((uint32_t)b[3]<<24);
  };
  auto readExact = [](WiFiClient* s, uint8_t* buf, int want)->bool {
    int got=0; while (got<want) { int n=s->readBytes(buf+got, want-got); if (n<=0) return false; got+=n; } return true;
  };

  char tag[4];
  if (!readExact(stream,(uint8_t*)tag,4)) return false;
  mirrorWrite(tag,4);
  if (memcmp(tag,"RIFF",4)!=0) return false;
  uint32_t riffSize = readU32LE(stream); mirrorWrite(&riffSize,4);
  if (!readExact(stream,(uint8_t*)tag,4)) return false;
  mirrorWrite(tag,4);
  if (memcmp(tag,"WAVE",4)!=0) return false;

  uint16_t audioFmt=0, numCh=0, bitsPerSample=0;
  uint32_t sampleRate=16000, dataBytes=0; bool haveFmt=false;

  while (true) {
    if (!readExact(stream,(uint8_t*)tag,4)) return false;
    mirrorWrite(tag,4);
    uint32_t chunkSize = readU32LE(stream); mirrorWrite(&chunkSize,4);

    if (memcmp(tag,"fmt ",4)==0) {
      uint8_t h[16]; if (chunkSize<16 || !readExact(stream,h,16)) return false; mirrorWrite(h,16);
      audioFmt      = (uint16_t)h[0] | ((uint16_t)h[1]<<8);
      numCh         = (uint16_t)h[2] | ((uint16_t)h[3]<<8);
      sampleRate    = (uint32_t)h[4] | ((uint32_t)h[5]<<8) | ((uint32_t)h[6]<<16) | ((uint32_t)h[7]<<24);
      bitsPerSample = (uint16_t)h[14] | ((uint16_t)h[15]<<8);

      // init I2S here once (match the file's real sample rate)
      if (!initI2S(MODE_SPK, sampleRate)) return false;
      i2s_zero_dma_buffer(I2S_PORT);

      // skip any fmt extras
      uint32_t remain = chunkSize - 16;
      while (remain) {
        uint8_t tmp[64];
        int take = remain>sizeof(tmp)?sizeof(tmp):remain;
        if (!readExact(stream,tmp,take)) return false;
        mirrorWrite(tmp,take);
        remain -= take;
      }
      haveFmt = true;
    }
    else if (memcmp(tag,"data",4) == 0) {
      if (!haveFmt) return false;
      dataBytes = chunkSize; // may be 0 for unknown/streamed
      break;
    } else {
      // Skip unknown chunk
      uint32_t remain = chunkSize;
      while (remain) {
        uint8_t tmp[64];
        int take = remain>sizeof(tmp)?sizeof(tmp):remain;
        if (!readExact(stream,tmp,take)) return false;
        mirrorWrite(tmp,take);
        remain -= take;
      }
    }
  }

  if (audioFmt != 1 || bitsPerSample != 16) return false; // need PCM16

  // ---- Prebuffer into RAM (don’t discard) ----
  std::unique_ptr<uint8_t[]> pre(new (std::nothrow) uint8_t[PREBUFFER_BYTES]);
  int preLen = 0;

  while (pre && preLen < PREBUFFER_BYTES && http.connected()) {
    size_t avail = stream->available();
    if (!avail) { delay(1); continue; }
    int take = (int)min((size_t)(PREBUFFER_BYTES - preLen), min(avail,(size_t)RAW_MAX));
    int n = stream->readBytes(pre.get() + preLen, take);
    if (n <= 0) break;
    mirrorWrite(pre.get() + preLen, n);
    preLen += n;
    if (dataBytes) { if ((uint32_t)n > dataBytes) dataBytes = 0; else dataBytes -= n; }
  }

  // ---- Playback (odd-byte safe + optional stereo downmix) ----
  auto processBlock = [&](uint8_t* buf, int len, bool& firstBlock){
    static bool haveCarry=false; static uint8_t carry=0;

    while (len > 0) {
      int chunk = min(len, RAW_MAX);
      if (haveCarry) { RAW_WORK[0]=carry; memcpy(RAW_WORK+1, buf, chunk); chunk += 1; buf += (chunk-1); len -= (chunk-1); haveCarry=false; }
      else { memcpy(RAW_WORK, buf, chunk); buf += chunk; len -= chunk; }
      if (chunk & 1) { carry = RAW_WORK[chunk-1]; haveCarry = true; --chunk; }
      if (!chunk) continue;

      int16_t* s16 = (int16_t*)RAW_WORK;
      int samples = chunk/2;
      if (numCh==2) { // downmix L/R to mono
        int out=0; for (int i=0;i+1<samples;i+=2) s16[out++] = (int16_t)(((int)s16[i]+(int)s16[i+1])/2);
        samples = out;
      }
      applyFadeAndGain(s16, samples, sampleRate, firstBlock, false);
      firstBlock = false;
      size_t bw=0; i2s_write(I2S_PORT, (const char*)s16, samples*sizeof(int16_t), &bw, portMAX_DELAY);
    }
  };

  bool first = true;
  if (pre && preLen > 0) processBlock(pre.get(), preLen, first);

  // ---- Continue live streaming ----
  while (http.connected()) {
    size_t avail = stream->available();
    if (!avail && dataBytes==0) { delay(1); continue; }
    int toRead;
    if (dataBytes==0) toRead = (avail>RAW_MAX)?RAW_MAX:(int)avail;
    else {
      if (dataBytes==0) break;
      toRead = (dataBytes>RAW_MAX)?RAW_MAX:(int)dataBytes;
      if (toRead==0) break;
    }
    int n = stream->readBytes(RAW_IN, toRead);
    if (n <= 0) break;
    mirrorWrite(RAW_IN, n);
    processBlock(RAW_IN, n, first);
    if (dataBytes) {
      if ((uint32_t)n > dataBytes) dataBytes = 0; else dataBytes -= n;
      if (dataBytes==0) break;
    }
  }

  // small silence tail
  int16_t tail[256] = {0}; size_t bw;
  i2s_write(I2S_PORT, (const char*)tail, sizeof(tail), &bw, portMAX_DELAY);

  if (mirror) mirror.close();
  return true;
}

// ---------------- Chirps (Star Trek style, reliable) ----------------
static void writeSilenceMs(uint32_t ms, uint32_t sr = 16000) {
  if (ms == 0) return;
  const uint32_t samples = (sr * ms) / 1000;
  const uint16_t N = 256;
  static int16_t z[N] = {0};
  uint32_t left = samples;
  size_t bw;
  while (left) {
    uint32_t batch = (left > N) ? N : left;
    i2s_write(I2S_PORT, (const char*)z, batch * sizeof(int16_t), &bw, portMAX_DELAY);
    left -= batch;
  }
}

inline void drainTx(uint16_t ms = 120) {
  // Write silence for ~ms; i2s_write blocks until DMA pushes it out.
  writeSilenceMs(ms);
}

static void beepSine(uint16_t freq_hz, uint16_t dur_ms, float vol = 0.85f) {
  ensureSpk(16000);            // make sure we're in SPK mode, but don't reinstall if already there
  writeSilenceMs(3);           // prime so first cycle isn’t clipped

  const uint32_t SR = 16000;
  const uint16_t N  = 256;
  static int16_t buf[N];
  const float twoPi = 6.28318530718f;
  const float amp   = 32767.0f * vol;
  const float step  = twoPi * freq_hz / (float)SR;

  const uint32_t total = (SR * dur_ms) / 1000;
  const uint16_t fade  = (uint16_t)max<uint32_t>(8, (SR * 4) / 1000); // ~4 ms fade

  float phase = 0.0f;
  uint32_t done = 0;
  while (done < total) {
    uint32_t batch = min<uint32_t>(N, total - done);
    for (uint32_t i = 0; i < batch; ++i) {
      uint32_t gpos = done + i;
      float g = 1.0f;
      if (gpos < fade)            g = (float)gpos / (float)fade;            // fade in
      else if (gpos > total-fade) g = (float)(total - gpos) / (float)fade;  // fade out
      buf[i] = (int16_t)(sinf(phase) * amp * g);
      phase += step; if (phase > twoPi) phase -= twoPi;
    }
    size_t bw;
    i2s_write(I2S_PORT, (const char*)buf, batch * sizeof(int16_t), &bw, portMAX_DELAY);
    done += batch;
  }
  drainTx(30);                 // ensure the tail fully plays
  writeSilenceMs(2);
}

// Ascending communicator open: three quick beeps (classic vibe)
static inline void chirp_open() {
  ledColor(255,215,0);
  ensureSpk(16000);
  beepSine(1000, 55);
  delay(8);
  beepSine(1400, 55);
  delay(8);
  beepSine(1900, 70);
  drainTx(80);
  writeSilenceMs(3);
}

// Descending communicator close: two quick beeps
static inline void chirp_close() {
  ledColor(255,140,0);
  ensureSpk(16000);
  beepSine(1200, 60);
  delay(8);
  beepSine(800,  80);
  drainTx(80);
  writeSilenceMs(3);
}

// ---------------- Wi-Fi ----------------
bool connectWiFi() {
  Serial.println("Connecting WiFi…");
  WiFi.mode(WIFI_STA);
  WiFi.setSleep(false);
  auto try_one = [](const char* s, const char* p) {
    WiFi.begin(s, p);
    for (int i = 0; i < 40 && WiFi.status() != WL_CONNECTED; ++i) { delay(250); Serial.print("."); }
    Serial.println();
    return WiFi.status() == WL_CONNECTED;
  };
  if (try_one(ssid1, pass1) || try_one(ssid2, pass2)) {
    Serial.printf("✅ WiFi: %s  IP: %s\n", WiFi.SSID().c_str(), WiFi.localIP().toString().c_str());
    return true;
  }
  Serial.println("❌ WiFi failed");
  return false;
}

// ---------------- Upload & STREAM reply ----------------
bool streamFromWebhook(const char* pathIn) {
  if (WiFi.status() != WL_CONNECTED) { Serial.println("No WiFi"); return false; }

  File fin = SPIFFS.open(pathIn, "r");
  if (!fin || fin.size() <= 44) { Serial.println("Input WAV open failed or empty"); return false; }

  WiFiClientSecure client;
  client.setInsecure();
  client.setNoDelay(true);
  client.setTimeout(HTTP_TIMEOUT_MS / 1000);

  HTTPClient http;
  if (!http.begin(client, webhook)) {
    Serial.println("HTTP begin failed");
    fin.close();
    return false;
  }

  http.addHeader("X-Session-Id", SESSION_ID);
  http.addHeader("Content-Type", "audio/wav");
  http.setTimeout(HTTP_TIMEOUT_MS);

  Serial.printf("📤 POST %s (%u bytes)\n", pathIn, (unsigned)fin.size());
  int code = http.sendRequest("POST", &fin, fin.size());
  fin.close();

  Serial.printf("HTTP status: %d\n", code);
  if (code <= 0) { Serial.printf("❌ HTTP %d: %s\n", code, http.errorToString(code).c_str()); http.end(); return false; }
  if (code != 200) {
    Serial.printf("❌ HTTP %d\n", code);
    String err = http.getString(); if (err.length()) Serial.printf("Body: %s\n", err.c_str());
    http.end(); return false;
  }

  ledColor(0, 255, 255); // cyan while streaming
  bool ok = streamWavReply(http, nullptr);  // no mirror file for max speed
  http.end();
  return ok;
}

// ---------------- Arduino entrypoints ----------------
void setup() {
  Serial.begin(115200);
  genSessionIdOnce();
  Serial.printf("🧵 sessionId=%s\n", SESSION_ID);

  M5.begin(true, false, true);
  ledColor(0, 64, 64);

  Serial.println("\n=== ATOM Echo Communicator Boot ===");
  if (!SPIFFS.begin(true)) {
    Serial.println("SPIFFS failed");
    while (1) { ledColor(255, 0, 0); delay(150); ledColor(0,0,0); delay(150); }
  }

  pinMode(BTN_PIN, INPUT_PULLUP);

  // Startup chirp — noticeable and let I2S settle
  initI2S(MODE_SPK, 16000);
  i2s_zero_dma_buffer(I2S_PORT);
  delay(20);
  chirp_open();
  delay(20);
  drainTx(120);
  writeSilenceMs(4);

  // Wi-Fi
  if (connectWiFi()) ledColor(0, 255, 0); else ledColor(255, 0, 0);
  Serial.println("Ready.");
}

void loop() {
  M5.update();
  bool pressed = (digitalRead(BTN_PIN) == LOW);

  if (pressed && !isRecording) {
    isRecording = true;
    Serial.println("=== RECORD START ===");

    if (SPIFFS.exists(WAV_FILE))  SPIFFS.remove(WAV_FILE);
#ifdef RESP_FILE
    if (SPIFFS.exists(RESP_FILE)) SPIFFS.remove(RESP_FILE);
#endif

    // READY chirp (speaker), then MIC and capture
    ensureSpk(16000);
    i2s_zero_dma_buffer(I2S_PORT);
    ledColor(0, 180, 255);
    chirp_open();

    // Let the beeps finish before tearing down TX for MIC
    drainTx(120);
    writeSilenceMs(4);

    File f = SPIFFS.open(WAV_FILE, FILE_WRITE);
    if (!f) { Serial.println("record file open failed"); ledColor(255,0,0); isRecording = false; return; }
    f.seek(44, SeekSet);

    initI2S(MODE_MIC, REC_SAMPLE_RATE);
    i2s_zero_dma_buffer(I2S_PORT);
    delay(4);

    uint8_t  buf[512];
    size_t   total = 0;
    uint32_t started = millis();
    while (digitalRead(BTN_PIN) == LOW) {
      size_t bytesRead = 0;
      esp_err_t er = i2s_read(I2S_PORT, (void*)buf, sizeof(buf), &bytesRead, 50);
      if (er == ESP_OK && bytesRead > 0) {
        size_t w = f.write(buf, bytesRead);
        if (w != bytesRead) { Serial.println("SPIFFS write error"); break; }
        total += w;
        if (total >= MAX_RECORD_BYTES) { Serial.println("Hit duration cap"); break; }
      } else if (er != ESP_OK) {
        Serial.printf("i2s_read err: %d\n", er);
        break;
      }
      if (millis() - started >= MAX_RECORD_MS) { Serial.println("Time cap reached"); break; }
      delay(1);
    }
    f.close();

    // Close chirp (switch back to SPK)
    initI2S(MODE_SPK, 16000);
    i2s_zero_dma_buffer(I2S_PORT);
    ledColor(0, 255, 0);
    chirp_close();

    // Finalize header
    File fh = SPIFFS.open(WAV_FILE, "r+");
    if (!fh) { Serial.println("header reopen failed"); ledColor(255,0,0); isRecording = false; return; }
    writeWavHeader(fh, total, REC_SAMPLE_RATE);
    fh.flush();
    fh.close();
    Serial.printf("✅ WAV written. Size: %u bytes\n", (unsigned)(44 + total));

    // Upload & stream reply
    ledColor(255, 165, 0);
    bool ok = streamFromWebhook(WAV_FILE);
    if (!ok) ledColor(255, 0, 0);

    ledColor(0, 0, 64);
    Serial.println("=== RECORD END ===");
    isRecording = false;
  }
  delay(10);
}