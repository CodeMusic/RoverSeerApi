#include <Arduino.h>
#include <LilyGoLib.h>
#include <lvgl.h>

LilyGoLib watch;
lv_obj_t* clock_label;

void setup() {
  Serial.begin(115200);
  Serial.println("T-Watch S3 (PlatformIO) boot");

  if (!watch.begin()) {
    Serial.println("watch.begin() failed");
    while (true) delay(100);
  }

  if (psramFound()) Serial.println("PSRAM OK");
  if (watch.motor) watch.motor->onec(30);

  lv_obj_clean(lv_scr_act());
  clock_label = lv_label_create(lv_scr_act());
  lv_obj_set_style_text_font(clock_label, &lv_font_montserrat_28, 0); // LVGL v8 font
  lv_obj_center(clock_label);
  lv_label_set_text(clock_label, "Starting…");
}

void loop() {
  RTC_Date now = watch.rtc->getDateTime();

  static char buf[16];
  snprintf(buf, sizeof(buf), "%02d:%02d:%02d", now.hour, now.minute, now.second);
  lv_label_set_text(clock_label, buf);

  lv_timer_handler();
  delay(1000);
}
