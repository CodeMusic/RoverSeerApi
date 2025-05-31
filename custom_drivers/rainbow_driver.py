# rainbow_driver.py

import sys, time, signal, logging
from gpiozero import Button, PWMLED, TonalBuzzer
from gpiozero.tones import Tone
import board, busio
import adafruit_bmp280
import fourletterphat as flp

# Add APA102 path if not installed via pip
sys.path.insert(0, "/home/codemusic/APA102_Pi")
from apa102_pi.driver.apa102 import APA102

# ------- LOGGER CONFIG -------
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    handlers=[logging.StreamHandler(sys.stdout)]
)

# ------- DRIVER CLASS -------
class RainbowDriver:
    def __init__(self, num_leds=7, brightness=2):
        self.NUM_LEDS = num_leds
        self.BRIGHTNESS = brightness
        self.led_states = [(0, 0, 0)] * self.NUM_LEDS
        self.ROYG_colors = [
            (255, 0, 0), (255, 127, 0), (255, 255, 0),
            (0, 255, 0), (0, 0, 255), (75, 0, 130), (148, 0, 211)
        ]
        self.color_names = ['Red', 'Orange', 'Yellow', 'Green', 'Blue', 'Indigo', 'Violet']

        # Setup BMP280
        i2c = busio.I2C(board.SCL, board.SDA)
        self.bmp280 = adafruit_bmp280.Adafruit_BMP280_I2C(i2c, address=0x77)

        # Buttons, LEDs, Buzzer
        self.button_leds = {
            'A': PWMLED(6),
            'B': PWMLED(19),
            'C': PWMLED(26),
        }
        self.buttons = {
            'A': Button(21),
            'B': Button(20),
            'C': Button(16),
        }
        self.buzzer = TonalBuzzer(13)
        self.tones = {'A': Tone("C5"), 'B': Tone("E5"), 'C': Tone("G5")}

        # APA102 Strip
        self.strip = APA102(num_led=self.NUM_LEDS, global_brightness=self.BRIGHTNESS)
        self.strip.spi.max_speed_hz = 1000000
        self.strip.clear_strip()
        self.strip.show()

        for name, btn in self.buttons.items():
            btn.when_pressed = self._make_button_handler(name)

        signal.signal(signal.SIGINT, self.shutdown)

        logging.warning("[EXPERIMENTAL] APA102 LED strip features are unstable on Pi 5. LED behavior may be unpredictable.")

    def _make_button_handler(self, name):
        def handler():
            logging.info(f"Button {name} pressed")
            self.button_leds[name].pulse(fade_in_time=0.1, fade_out_time=0.1, n=1)
            self.buzzer.play(self.tones[name])
            time.sleep(0.2)
            self.buzzer.stop()
        return handler

    def set_led(self, index, r, g, b):
        if not (0 <= index < self.NUM_LEDS):
            logging.error(f"Invalid LED index: {index}")
            return
        logging.info(f"[EXPERIMENTAL] Setting LED {index} to RGB({r},{g},{b})")
        self.led_states[index] = (r, g, b)
        self._apply_leds()

    def _apply_leds(self):
        for i in range(self.NUM_LEDS):
            r, g, b = self.led_states[i]
            self.strip.set_pixel(i, r, g, b)
        self.strip.show()

    def display_number(self, num):
        flp.clear()
        flp.print_number_str(str(num).rjust(4)[-4:])
        flp.show()

    def print_sensor_data(self):
        temp = self.bmp280.temperature
        pressure = self.bmp280.pressure
        logging.info(f"🌡️ Temp: {temp:.1f}°C | Pressure: {pressure:.1f} hPa")

    def shutdown(self, sig=None, frame=None):
        logging.info("🛑 Shutdown: Clearing displays and turning off LEDs.")
        self.strip.clear_strip()
        self.strip.show()
        flp.clear()
        flp.show()
        sys.exit(0)

    def run_demo_loop(self, sleep_time=0.2):
        counter = 0
        while True:
            led_pos = 6 - (counter % self.NUM_LEDS)
            color_idx = (counter // self.NUM_LEDS) % len(self.ROYG_colors)
            r, g, b = self.ROYG_colors[color_idx]

            self.set_led(led_pos, r, g, b)
            self.display_number(counter)
            self.print_sensor_data()
            logging.info(f"🟢 LED {led_pos} → {self.color_names[color_idx]} ({r},{g},{b})")
            counter += 1
            time.sleep(sleep_time)
