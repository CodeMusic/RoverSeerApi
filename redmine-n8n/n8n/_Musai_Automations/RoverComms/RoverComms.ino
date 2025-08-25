// ===== M5 ATOM Echo: PTT → n8n → play reply (Star Trek communicator, stable beeps) =====
// Device: M5 ATOM Echo (ESP32, not S3)
// Pins per M5 official sample (single I2S port, switch modes):
//   BCK  = 19
//   LRCK = 33   (also PDM clock when MIC mode)
//   DOUT = 22   (speaker data out)
//   DIN  = 23   (mic data in)
// Button: GPIO 39
//
// Flow:
//  - Press: SPK mode → quick chirp → MIC mode → record until release (or duration cap)
//  - Release: MIC stop → SPK mode → close chirp → POST WAV → save/parse reply → set rate → play
//
// Webhook must return raw audio/wav (PCM16 mono). Any common sample rate is OK.
//
// Notes:
//  - We use ONE I2S port (I2S_NUM_0) and switch modes (TX vs PDM RX) like M5’s sample.
//  - This avoids pin contention and the “empty WAV / static” issues.
//  - Chirps are quick and guaranteed (we zero TX DMA before each).
//  - Session id is a 128-bit random hex sent as X-Session-Id.

#include <WiFi.h>
#include <WiFiClientSecure.h>
#include <HTTPClient.h>
#include <driver/i2s.h>
#include <M5Atom.h>
#include <FS.h>
#include <SPIFFS.h>
#include <math.h>
#include <string.h>

// ---------------- Pins (official mapping) ----------------
#define BTN_PIN                39

#define I2S_PORT               I2S_NUM_0
#define I2S_BCK_PIN            19
#define I2S_LRCK_PIN           33   // speaker LRCK AND mic PDM clock when RX
#define I2S_DATA_OUT_PIN       22   // to amp
#define I2S_DATA_IN_PIN        23   // from mic

// ---------------- Modes ----------------
#define MODE_MIC  0
#define MODE_SPK  1

// ---------------- Audio config ----------------
static const uint32_t REC_SAMPLE_RATE      = 16000;  // record at 16 kHz
static const uint16_t PCM_BITS             = 16;     // PCM16
static const uint32_t MAX_RECORD_MS        = 8000;   // cap recording (8s)
static const uint32_t BYTES_PER_SEC        = REC_SAMPLE_RATE * (PCM_BITS / 8);
static const uint32_t MAX_RECORD_BYTES     = (MAX_RECORD_MS * BYTES_PER_SEC) / 1000;

#define WAV_FILE   "/record.wav"
#define RESP_FILE  "/response.wav"

// ---------------- Wi-Fi ----------------
const char* ssid1 = "CodeMusicai";
const char* pass1 = "cnatural";
const char* ssid2 = "RevivalNetwork ";
const char* pass2 = "xunjmq84";

// Webhook (must accept audio/wav body, return audio/wav)
const char* webhook = "https://n8n.codemusic.ca/webhook/audio-assistant/S3CR3TK3Y";

// ---------------- HTTP tuning ----------------
static const uint32_t HTTP_TIMEOUT_MS = 120000; // 120s

// ---------------- State ----------------
bool isRecording = false;
int  currentMode = -1;

// 128-bit random hex session id
char SESSION_ID[33] = {0};

// ---------------- LED helper ----------------
inline void ledColor(uint8_t r, uint8_t g, uint8_t b) { M5.dis.drawpix(0, CRGB(r, g, b)); }

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
  if (currentMode == mode) {
    // just adjust clock (safe for both RX/TX after driver installed)
    i2s_set_clk(I2S_PORT, sampleRate, I2S_BITS_PER_SAMPLE_16BIT,
                (mode == MODE_SPK) ? I2S_CHANNEL_MONO : I2S_CHANNEL_MONO);
    return true;
  }

  i2s_driver_uninstall(I2S_PORT);

  i2s_config_t cfg = {
    .mode = (i2s_mode_t)(I2S_MODE_MASTER),
    .sample_rate = sampleRate,
    .bits_per_sample = I2S_BITS_PER_SAMPLE_16BIT,
    .channel_format = I2S_CHANNEL_FMT_ALL_RIGHT,      // mono on right channel
#if ESP_IDF_VERSION > ESP_IDF_VERSION_VAL(4, 1, 0)
    .communication_format = I2S_COMM_FORMAT_STAND_I2S,
#else
    .communication_format = I2S_COMM_FORMAT_I2S,
#endif
    .intr_alloc_flags = ESP_INTR_FLAG_LEVEL1,
    .dma_buf_count = 8,
    .dma_buf_len = 256,
    .use_apll = false,
    .tx_desc_auto_clear = true,
    .fixed_mclk = 0
  };

  if (mode == MODE_MIC) {
    cfg.mode = (i2s_mode_t)(I2S_MODE_MASTER | I2S_MODE_RX | I2S_MODE_PDM);
  } else {
    cfg.mode = (i2s_mode_t)(I2S_MODE_MASTER | I2S_MODE_TX);
  }

  if (i2s_driver_install(I2S_PORT, &cfg, 0, NULL) != ESP_OK) {
    Serial.println("i2s_driver_install failed");
    return false;
  }

  i2s_pin_config_t pins;
#if (ESP_IDF_VERSION > ESP_IDF_VERSION_VAL(4, 3, 0))
  pins.mck_io_num = I2S_PIN_NO_CHANGE;
#endif
  pins.bck_io_num   = I2S_BCK_PIN;     // 19
  pins.ws_io_num    = I2S_LRCK_PIN;    // 33
  pins.data_out_num = I2S_DATA_OUT_PIN;// 22
  pins.data_in_num  = I2S_DATA_IN_PIN; // 23

  if (i2s_set_pin(I2S_PORT, &pins) != ESP_OK) {
    Serial.println("i2s_set_pin failed");
    return false;
  }
  if (i2s_set_clk(I2S_PORT, sampleRate, I2S_BITS_PER_SAMPLE_16BIT, I2S_CHANNEL_MONO) != ESP_OK) {
    Serial.println("i2s_set_clk failed");
    return false;
  }

  currentMode = mode;
  return true;
}

// ---------------- WAV header writer ----------------
void writeWavHeader(File &f, uint32_t dataBytes, uint32_t rate) {
  const uint16_t audioFormat = 1; // PCM
  const uint16_t numChannels = 1;
  const uint16_t bits = 16;
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

// ---------------- WAV playback (parse header, set real rate) ----------------
void playWavFile(const char* path) {
  File f = SPIFFS.open(path, "r");
  if (!f) { Serial.printf("playWavFile: cannot open %s\n", path); return; }
  if (f.size() <= 44) { Serial.println("playWavFile: file too small"); f.close(); return; }

  struct WAVHeader {
    char riff[4]; uint32_t size; char wave[4];
    char fmt_[4]; uint32_t fmtLen; uint16_t audioFmt;
    uint16_t numCh; uint32_t sampleRate; uint32_t byteRate;
    uint16_t blockAlign; uint16_t bitsPerSample;
    char dataId[4]; uint32_t dataSize;
  } hdr;

  f.read((uint8_t*)&hdr, sizeof(hdr));

  if (strncmp(hdr.riff,"RIFF",4)!=0 || strncmp(hdr.wave,"WAVE",4)!=0 ||
      hdr.audioFmt != 1 || hdr.bitsPerSample != 16 || hdr.numCh < 1) {
    Serial.println("Unsupported WAV (expect PCM16)");
    f.close(); return;
  }

  // Switch to SPK at file rate
  if (!initI2S(MODE_SPK, hdr.sampleRate)) { f.close(); return; }
  i2s_zero_dma_buffer(I2S_PORT);

  Serial.printf("🔊 %s @ %u Hz, %u-bit, %u ch, data %u bytes\n",
                path, hdr.sampleRate, hdr.bitsPerSample, hdr.numCh, hdr.dataSize);

  // Start right after header
  size_t bytesWritten, bytesRead;
  uint8_t buf[1024];
  while ((bytesRead = f.read(buf, sizeof(buf))) > 0) {
    // File is mono PCM16; write as-is (mono)
    i2s_write(I2S_PORT, (const char*)buf, bytesRead, &bytesWritten, portMAX_DELAY);
    delay(1);
  }
  f.close();
  Serial.println("✅ Playback finished");
}

// ---------------- Chirps (quick; always in SPK mode) ----------------
static void toneMono(float freq_hz, uint32_t dur_ms, float vol = 0.5f) {
  if (!initI2S(MODE_SPK, 16000)) return;
  i2s_zero_dma_buffer(I2S_PORT);

  const uint32_t SR = 16000;
  const uint16_t N  = 256;
  static int16_t buf[N];

  const float twoPi = 6.28318530718f;
  const float amp   = 32767.0f * vol;
  const float step  = twoPi * freq_hz / (float)SR;

  uint32_t samplesTotal = (uint32_t)((dur_ms / 1000.0f) * SR);
  uint32_t written = 0;
  float phase = 0.0f;

  while (written < samplesTotal) {
    uint32_t batch = min<uint32_t>(N, samplesTotal - written);
    for (uint32_t i = 0; i < batch; ++i) {
      buf[i] = (int16_t)(sinf(phase) * amp);
      phase += step;
      if (phase > twoPi) phase -= twoPi;
    }
    size_t bytesWritten = 0;
    i2s_write(I2S_PORT, (const char*)buf, batch * sizeof(int16_t), &bytesWritten, portMAX_DELAY);
    written += batch;
  }
}

static inline void chirp_open() {
  ledColor(255, 215, 0);
  toneMono(900, 60);  delay(8);
  toneMono(1350,60);  delay(8);
  toneMono(1800,80);
}

static inline void chirp_close() {
  ledColor(255, 140, 0);
  toneMono(1200,60);  delay(8);
  toneMono(800, 80);
}

// ---------------- Wi-Fi ----------------
bool connectWiFi() {
  Serial.println("Connecting WiFi…");
  WiFi.mode(WIFI_STA);

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

// ---------------- Upload & save reply ----------------
bool postWavAndSaveReply(const char* pathIn, const char* pathOut) {
  if (WiFi.status() != WL_CONNECTED) { Serial.println("No WiFi"); return false; }

  File fin = SPIFFS.open(pathIn, "r");
  if (!fin || fin.size() <= 44) { Serial.println("Input WAV open failed or empty"); return false; }

  WiFiClientSecure client;
  client.setInsecure();
  client.setTimeout(HTTP_TIMEOUT_MS / 1000);

  HTTPClient http;
  if (!http.begin(client, webhook)) {
    Serial.println("HTTP begin failed");
    fin.close();
    return false;
  }

  // Pass session id both as header (preferred) and let server pick it up from there
  http.addHeader("X-Session-Id", SESSION_ID);
  http.addHeader("Content-Type", "audio/wav");
  http.setTimeout(HTTP_TIMEOUT_MS);

  Serial.printf("📤 POST %s (%u bytes)\n", pathIn, (unsigned)fin.size());
  int code = http.sendRequest("POST", &fin, fin.size());
  fin.close();

  Serial.printf("HTTP status: %d\n", code);
  String ctype = http.header("Content-Type");
  String clen  = http.header("Content-Length");
  String xte   = http.header("Transfer-Encoding");
  Serial.printf("Resp headers: Content-Type=%s  Content-Length=%s  Transfer-Encoding=%s\n",
                ctype.c_str(), clen.c_str(), xte.c_str());

  if (code <= 0) {
    Serial.printf("❌ HTTP %d: %s\n", code, http.errorToString(code).c_str());
    http.end();
    return false;
  }
  if (code != 200) {
    Serial.printf("❌ HTTP %d\n", code);
    String err = http.getString();
    if (err.length()) Serial.printf("Body: %s\n", err.c_str());
    http.end();
    return false;
  }

  // Save reply body to SPIFFS (chunked or content-length)
  int len = http.getSize();  // -1 if chunked
  File fout = SPIFFS.open(pathOut, FILE_WRITE);
  if (!fout) { Serial.println("resp open failed"); http.end(); return false; }

  WiFiClient* stream = http.getStreamPtr();
  uint8_t buf[1024];
  int total = 0;
  uint32_t lastDataMs = millis();
  const uint32_t MAX_IDLE_MS = 10000;

  while (true) {
    if (len > 0 && total >= len) break;
    size_t avail = stream->available();
    if (avail) {
      int n = stream->readBytes(buf, avail > sizeof(buf) ? sizeof(buf) : avail);
      if (n > 0) {
        fout.write(buf, n);
        total += n;
        lastDataMs = millis();
        continue;
      }
    }
    if (!http.connected()) break;
    if (millis() - lastDataMs > MAX_IDLE_MS) {
      Serial.println("❌ Read idle timeout");
      break;
    }
    delay(5);
  }

  fout.close();
  http.end();

  Serial.printf("📥 Saved reply (%d bytes) → %s\n", total, pathOut);
  return total > 44;
}

// ---------------- Setup ----------------
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

  // Start in speaker mode for startup chirp
  initI2S(MODE_SPK, 16000);
  ledColor(255, 215, 0);
  chirp_open();

  // Wi-Fi
  if (connectWiFi()) { ledColor(0, 255, 0); } else { ledColor(255, 0, 0); }
  Serial.println("Ready.");
}

// ---------------- Loop ----------------
void loop() {
  M5.update();
  bool pressed = (digitalRead(BTN_PIN) == LOW);

  if (pressed && !isRecording) {
    isRecording = true;
    Serial.println("=== RECORD START ===");

    // Fresh files
    if (SPIFFS.exists(WAV_FILE))  SPIFFS.remove(WAV_FILE);
    if (SPIFFS.exists(RESP_FILE)) SPIFFS.remove(RESP_FILE);

    // READY chirp (speaker), then switch to MIC and capture
    initI2S(MODE_SPK, 16000);
    i2s_zero_dma_buffer(I2S_PORT);
    ledColor(0, 180, 255);
    chirp_open();

    // Open file & reserve header
    File f = SPIFFS.open(WAV_FILE, FILE_WRITE);
    if (!f) { Serial.println("record file open failed"); ledColor(255,0,0); isRecording = false; return; }
    f.seek(44, SeekSet);

    // MIC mode; tiny settle
    initI2S(MODE_MIC, REC_SAMPLE_RATE);
    i2s_zero_dma_buffer(I2S_PORT);
    delay(5);

    // Record while pressed (or until cap)
    uint8_t  buf[512];
    size_t   total = 0;
    uint32_t started = millis();
    int dbg = 0;

    while (digitalRead(BTN_PIN) == LOW) {
      size_t bytesRead = 0;
      esp_err_t er = i2s_read(I2S_PORT, (void*)buf, sizeof(buf), &bytesRead, 50);
      if (er == ESP_OK && bytesRead > 0) {
        size_t w = f.write(buf, bytesRead);
        if (w != bytesRead) { Serial.println("SPIFFS write error"); break; }
        total += w;
        if (dbg < 5) { Serial.printf("read %u bytes\n", (unsigned)bytesRead); dbg++; }
        if (total >= MAX_RECORD_BYTES) { Serial.println("Hit duration cap"); break; }
      } else if (er != ESP_OK) {
        if (dbg < 5) Serial.printf("i2s_read err: %d\n", er);
        break;
      }
      if (millis() - started >= MAX_RECORD_MS) { Serial.println("Time cap reached"); break; }
      delay(1);
    }

    f.close();

    // Close chirp (switch back to SPK so RX is fully stopped first)
    initI2S(MODE_SPK, 16000);
    i2s_zero_dma_buffer(I2S_PORT);
    ledColor(0, 255, 0);
    chirp_close();

    // Finalize header
    File fh = SPIFFS.open(WAV_FILE, "r+");
    if (!fh) { Serial.println("header reopen failed"); ledColor(255,0,0); isRecording = false; return; }
    writeWavHeader(fh, total, REC_SAMPLE_RATE);
    fh.flush();
    size_t sz = fh.size();
    fh.close();
    Serial.printf("✅ WAV written. Size: %u bytes\n", (unsigned)sz);

    // Upload & get reply, then play
    ledColor(255, 165, 0);
    bool ok = postWavAndSaveReply(WAV_FILE, RESP_FILE);
    if (ok) {
      ledColor(0, 255, 255);
      playWavFile(RESP_FILE);
    } else {
      ledColor(255, 0, 0);
    }

    ledColor(0, 0, 64);
    Serial.println("=== RECORD END ===");
    isRecording = false;
  }

  delay(10);
}