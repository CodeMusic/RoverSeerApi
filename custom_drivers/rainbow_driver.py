# rainbow_driver.py

import sys, time, signal, logging
import threading
import queue
from gpiozero import Button, PWMLED, TonalBuzzer
from gpiozero.tones import Tone
import board, busio
import adafruit_bmp280
import fourletterphat as flp
import re

# Add APA102 path if not installed via pip
sys.path.insert(0, "/home/codemusic/APA102_Pi")
from apa102_pi.driver.apa102 import APA102

# ------- LOGGER CONFIG -------
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    handlers=[logging.StreamHandler(sys.stdout)]
)


# ------- APA102 PIXEL INTERFACE -------
class APA102PixelInterface:
    """Provides a pixel-like interface for APA102 strip to support ActivityLEDManager"""
    
    def __init__(self, strip):
        self.strip = strip
        self._pixel_data = [(0, 0, 0)] * strip.num_led
    
    def __setitem__(self, index, color):
        """Set a pixel color"""
        if 0 <= index < len(self._pixel_data):
            self._pixel_data[index] = color
            r, g, b = color
            self.strip.set_pixel(index, r, g, b)
    
    def __getitem__(self, index):
        """Get a pixel color"""
        if 0 <= index < len(self._pixel_data):
            return self._pixel_data[index]
        return (0, 0, 0)
    
    def show(self):
        """Update the strip display"""
        self.strip.show()
    
    def fill(self, color):
        """Fill all pixels with a color"""
        for i in range(len(self._pixel_data)):
            self[i] = color


# ------- BUZZER MANAGER CLASS -------
class BuzzerManager:
    """
    Thread-safe buzzer management with automatic recovery
    """
    _instance = None
    _lock = threading.Lock()
    
    def __new__(cls):
        if cls._instance is None:
            with cls._lock:
                if cls._instance is None:
                    cls._instance = super().__new__(cls)
        return cls._instance
    
    def __init__(self):
        if hasattr(self, '_initialized'):
            return
        self._initialized = True
        
        self.buzzer = None
        self.buzzer_lock = threading.Lock()
        self.sound_queue = queue.Queue()
        self.worker_thread = None
        self.running = False
        self.current_task_interrupt = threading.Event()  # For interrupting current task
        
        # Initialize buzzer
        self._init_buzzer()
        
        # Start worker thread
        self._start_worker()
    
    def _init_buzzer(self):
        """Initialize or reinitialize the buzzer"""
        try:
            with self.buzzer_lock:
                if self.buzzer:
                    try:
                        self.buzzer.stop()
                    except:
                        pass
                
                self.buzzer = TonalBuzzer(13)
                logging.info("Buzzer initialized successfully")
                return True
        except Exception as e:
            logging.error(f"Failed to initialize buzzer: {e}")
            self.buzzer = None
            return False
    
    def _start_worker(self):
        """Start the sound queue worker thread"""
        if not self.running:
            self.running = True
            self.worker_thread = threading.Thread(target=self._worker, daemon=True)
            self.worker_thread.start()
            logging.debug("Buzzer worker thread started")
    
    def _worker(self):
        """Worker thread for sequential sound playback"""
        while self.running:
            try:
                task = self.sound_queue.get(timeout=0.5)
                if task is None:  # Shutdown signal
                    break
                
                func, args, kwargs = task
                try:
                    # Clear interrupt flag for new task
                    self.current_task_interrupt.clear()
                    func(*args, **kwargs)
                except Exception as e:
                    logging.error(f"Error in sound playback: {e}")
                finally:
                    self.sound_queue.task_done()
                    
            except queue.Empty:
                continue
    
    def interrupt_current_task(self):
        """Interrupt any currently playing sound task"""
        self.current_task_interrupt.set()
        self.stop()
    
    def clear_queue_and_interrupt(self):
        """Clear all queued sounds and interrupt current playback - for new process flows"""
        # Only interrupt if there's actually something playing
        if self.current_task_interrupt.is_set():
            return  # Already interrupted
            
        # Interrupt current task
        self.interrupt_current_task()
        
        # Clear the queue
        cleared = 0
        while not self.sound_queue.empty():
            try:
                self.sound_queue.get_nowait()
                cleared += 1
            except queue.Empty:
                break
        
        # Only force stop if we actually cleared something or interrupted
        if cleared > 0:
            self.force_stop()
            logging.info(f"Buzzer queue cleared ({cleared} items) and current task interrupted")
        else:
            logging.debug("Buzzer queue was already empty")
    
    def play_tone_immediate(self, tone, duration=0.1):
        """Play a tone immediately (blocks) - for button feedback"""
        with self.buzzer_lock:
            if not self.buzzer:
                if not self._init_buzzer():
                    return False
            
            try:
                # Check for interrupt before starting
                if self.current_task_interrupt.is_set():
                    return False
                
                self.buzzer.play(tone)
                
                # Sleep in small chunks to allow interruption
                sleep_chunks = max(1, int(duration / 0.05))
                chunk_duration = duration / sleep_chunks
                
                for _ in range(sleep_chunks):
                    if self.current_task_interrupt.is_set():
                        break
                    time.sleep(chunk_duration)
                
                self.buzzer.stop()
                return True
            except Exception as e:
                logging.error(f"Error playing tone: {e}")
                self._init_buzzer()  # Try to recover
                return False
    
    def play_sequence_async(self, notes, durations, gaps=0.02):
        """Queue a sequence of notes to play asynchronously"""
        def _play():
            for note, duration in zip(notes, durations):
                if self.current_task_interrupt.is_set():
                    break
                if not self.play_tone_immediate(note, duration):
                    break
                if gaps > 0 and not self.current_task_interrupt.is_set():
                    time.sleep(gaps)
        
        self.sound_queue.put((_play, (), {}))
    
    def queue_function(self, func, *args, **kwargs):
        """Queue a custom function for the sound thread"""
        self.sound_queue.put((func, args, kwargs))
    
    def stop(self):
        """Stop any currently playing sound"""
        with self.buzzer_lock:
            if self.buzzer:
                try:
                    self.buzzer.stop()
                except:
                    pass
    
    def force_stop(self):
        """Force stop buzzer - more aggressive than normal stop"""
        with self.buzzer_lock:
            if self.buzzer:
                try:
                    self.buzzer.stop()
                    # Re-initialize to ensure clean state
                    self._init_buzzer()
                except Exception as e:
                    logging.error(f"Error in force_stop: {e}")
                    # Last resort - recreate buzzer
                    try:
                        self.buzzer = TonalBuzzer(13)
                    except:
                        self.buzzer = None
    
    def shutdown(self):
        """Shutdown the buzzer manager"""
        logging.info("Shutting down buzzer manager")
        self.running = False
        self.interrupt_current_task()
        self.sound_queue.put(None)  # Shutdown signal
        
        if self.worker_thread:
            self.worker_thread.join(timeout=2)
        
        self.force_stop()


# ------- DISPLAY MANAGER CLASS -------
class DisplayManager:
    """Manages the 4-digit display operations and state"""
    
    def __init__(self, rainbow_driver):
        self.rainbow_driver = rainbow_driver
        self.current_value = None
        self.is_scrolling = False
        self.scroll_interrupt = False
        self.current_scroll_thread = None
        self._lock = threading.Lock()
    
    def scroll_text(self, text, scroll_speed=0.3):
        """Scroll text across the 4-digit display"""
        with self._lock:
            # If there's already a scroll thread, interrupt it
            if self.current_scroll_thread and self.current_scroll_thread.is_alive():
                print(f"Stopping current scroll thread to start '{text}'")
                self.scroll_interrupt = True
                self.current_scroll_thread.join(timeout=0.5)
            
            def do_scroll():
                try:
                    import fourletterphat as flp
                    self.scroll_interrupt = False
                    padded_text = "    " + text.upper() + "    "  # 4 spaces on each side - text starts off screen
                    self.is_scrolling = True
                    print(f"Starting scroll: '{text}'")
                    
                    for i in range(len(padded_text) - 4 + 1):  # 4 chars display window
                        if self.scroll_interrupt:
                            print(f"Scrolling '{text}' interrupted")
                            break
                            
                        flp.clear()
                        display_text = padded_text[i:i+4]
                        flp.print_str(display_text)
                        flp.show()
                        self.current_value = display_text
                        
                        sleep_chunks = max(1, int(scroll_speed / 0.02))
                        for _ in range(sleep_chunks):
                            if self.scroll_interrupt:
                                break
                            time.sleep(min(0.02, scroll_speed / sleep_chunks))
                        
                        if self.scroll_interrupt:
                            break
                    
                    if not self.scroll_interrupt:
                        # Show the first 4 characters of the actual text content
                        # This is what would naturally appear after the scroll animation
                        clean_text = text.strip().upper()  # Remove any leading/trailing spaces first
                        
                        # Handle emoji characters - extract only ASCII letters/numbers for final display
                        ascii_only = re.sub(r'[^\w\s]', '', clean_text)  # Remove non-alphanumeric except spaces
                        ascii_only = re.sub(r'\s+', ' ', ascii_only)  # Normalize spaces
                        ascii_only = ascii_only.strip()  # Remove leading/trailing spaces
                        
                        final_text = ascii_only[:4].ljust(4, ' ')  # Take first 4 chars, pad to 4 if shorter
                        
                        # Debug output
                        print(f"Original text: '{text}', Clean text: '{clean_text}', ASCII only: '{ascii_only}', Final display: '{final_text}'")
                        
                        flp.clear()
                        flp.print_str(final_text)
                        flp.show()
                        self.current_value = final_text
                        print(f"Scrolling '{text}' completed normally, showing: '{final_text}'")
                    
                except Exception as e:
                    print(f"Error scrolling text '{text}': {e}")
                finally:
                    self.is_scrolling = False
                    self.scroll_interrupt = False
            
            self.current_scroll_thread = threading.Thread(target=do_scroll)
            self.current_scroll_thread.daemon = True
            self.current_scroll_thread.start()
    
    def display_timer(self, start_time, stop_event, sound_fx=False, tick_type="clock"):
        """Display incrementing timer on the display
        
        Args:
            start_time: Time when timer started
            stop_event: Threading event to stop the timer
            sound_fx: Whether to play sound effects
            tick_type: Type of sound effect - "clock" or "music"
        """
        last_elapsed = -1
        tick_state = True
        music_note_index = 0
        
        # Define musical scale for music mode (pentatonic scale for pleasant sound)
        music_scale = [
            Tone("C4"), Tone("D4"), Tone("F4"), Tone("G4"), Tone("A4"),
            Tone("C5"), Tone("D5"), Tone("F5"), Tone("G5"), Tone("A5")
        ]
        
        try:
            while not stop_event.is_set():
                elapsed = int(time.time() - start_time)
                
                if elapsed != last_elapsed:
                    if not self.is_scrolling:
                        self.rainbow_driver.display_number(elapsed)
                    
                    if sound_fx and hasattr(self.rainbow_driver, 'buzzer_manager'):
                        try:
                            if tick_type == "clock":
                                if tick_state:
                                    self.rainbow_driver.buzzer_manager.play_tone_immediate(Tone("E5"), 0.05)
                                else:
                                    self.rainbow_driver.buzzer_manager.play_tone_immediate(Tone("C4"), 0.05)
                                tick_state = not tick_state
                                
                            elif tick_type == "music":
                                # Music mode: play notes from scale
                                note = music_scale[music_note_index % len(music_scale)]
                                self.rainbow_driver.buzzer_manager.play_tone_immediate(note, 0.04)
                                
                                # Progress through the scale
                                music_note_index += 1
                                
                                # Add some musical variation - occasionally jump
                                if elapsed % 4 == 0:
                                    music_note_index += 2  # Jump ahead for variety
                                    
                        except Exception as e:
                            print(f"Error playing tick sound: {e}")
                    
                    last_elapsed = elapsed
                
                time.sleep(0.1)
                
        except Exception as e:
            print(f"Error in display timer: {e}")
        finally:
            if not self.is_scrolling:
                self.rainbow_driver.display_number(0)
    
    def display_number(self, number):
        """Display a number on the 4-digit display"""
        with self._lock:
            try:
                import fourletterphat as flp
                flp.clear()
                # Format number to fit display
                if isinstance(number, int):
                    # For integers, right-justify and show up to 4 digits
                    flp.print_number_str(str(number).rjust(4)[-4:])
                else:
                    # For floats or other types, use print_number
                    flp.print_number(number)
                flp.show()
                self.current_value = number
            except Exception as e:
                print(f"Error displaying number: {e}")
    
    def display_text(self, text):
        """Display text on the 4-digit display (up to 4 characters)"""
        with self._lock:
            try:
                import fourletterphat as flp
                flp.clear()
                flp.print_str(text[:4].upper())
                flp.show()
                self.current_value = text[:4].upper()
            except Exception as e:
                print(f"Error displaying text: {e}")
    
    def clear(self):
        """Clear the display"""
        with self._lock:
            try:
                import fourletterphat as flp
                flp.clear()
                flp.show()
                self.current_value = None
            except Exception as e:
                print(f"Error clearing display: {e}")
    
    def blink_number(self, number, duration=4, blink_speed=0.3):
        """Blink a number on the display for specified duration"""
        try:
            end_time = time.time() + duration
            while time.time() < end_time:
                if not self.is_scrolling:
                    self.display_number(number)
                    time.sleep(blink_speed)
                    if not self.is_scrolling:
                        self.clear()
                    time.sleep(blink_speed)
                else:
                    # Wait if scrolling is active
                    time.sleep(0.1)
            # Leave the number on display after blinking
            if not self.is_scrolling:
                self.display_number(number)
        except Exception as e:
            print(f"Error blinking number: {e}")
    
    def get_current_value(self):
        """Get what's currently displayed"""
        return self.current_value
    
    def is_scrolling_active(self):
        """Check if text is currently scrolling"""
        return self.is_scrolling


# ------- LED MANAGER CLASS -------
class LEDManager:
    """Manages button LED patterns and states"""
    
    def __init__(self, rainbow_driver):
        self.rainbow_driver = rainbow_driver
        self.blink_threads = {}
        self.blink_events = {}
        self._lock = threading.Lock()
    
    def blink_led(self, led_name, on_time=0.3, off_time=0.3):
        """Start blinking a specific LED"""
        with self._lock:
            # Stop any existing blink
            self.stop_led(led_name)
            
            # Create new blink event and thread
            self.blink_events[led_name] = threading.Event()
            
            def _blink():
                while not self.blink_events[led_name].is_set():
                    self.rainbow_driver.button_leds[led_name].on()
                    time.sleep(on_time)
                    if not self.blink_events[led_name].is_set():
                        self.rainbow_driver.button_leds[led_name].off()
                    time.sleep(off_time)
            
            self.blink_threads[led_name] = threading.Thread(target=_blink, daemon=True)
            self.blink_threads[led_name].start()
    
    def blink_all_leds(self, on_time=0.2, off_time=0.2):
        """Blink all LEDs together"""
        with self._lock:
            # Stop any individual LED blinking
            for led in ['A', 'B', 'C']:
                self.stop_led(led)
            
            self.blink_events['all'] = threading.Event()
            
            def _blink_all():
                while not self.blink_events['all'].is_set():
                    for led in ['A', 'B', 'C']:
                        self.rainbow_driver.button_leds[led].on()
                    time.sleep(on_time)
                    if not self.blink_events['all'].is_set():
                        for led in ['A', 'B', 'C']:
                            self.rainbow_driver.button_leds[led].off()
                    time.sleep(off_time)
            
            self.blink_threads['all'] = threading.Thread(target=_blink_all, daemon=True)
            self.blink_threads['all'].start()
    
    def stop_led(self, led_name):
        """Stop blinking a specific LED"""
        if led_name in self.blink_events and self.blink_events[led_name] is not None:
            event = self.blink_events[led_name]
            event.set()
            if led_name in self.blink_threads and self.blink_threads[led_name] is not None:
                self.blink_threads[led_name].join(timeout=0.5)
            self.blink_events[led_name] = None
            self.blink_threads[led_name] = None
    
    def stop_all_leds(self):
        """Stop all LED animations"""
        with self._lock:
            # Stop individual LEDs
            for led in ['A', 'B', 'C']:
                self.stop_led(led)
            # Stop all-LED animations
            self.stop_led('all')
            # Turn off all LEDs
            for led in ['A', 'B', 'C']:
                self.rainbow_driver.button_leds[led].off()
    
    def set_led(self, led_name, state):
        """Set LED to on/off state"""
        with self._lock:
            self.stop_led(led_name)  # Stop any blinking
            if state:
                self.rainbow_driver.button_leds[led_name].on()
            else:
                self.rainbow_driver.button_leds[led_name].off()
    
    def pulse_led(self, led_name, fade_in=0.1, fade_out=0.1, n=1):
        """Pulse an LED"""
        self.rainbow_driver.button_leds[led_name].pulse(
            fade_in_time=fade_in, 
            fade_out_time=fade_out, 
            n=n
        )
    
    def show_progress(self, stage):
        """Show progress through pipeline stages
        
        NOTE: This is application-specific for the RoverSeer voice assistant pipeline.
        The stages represent: Recording -> ASR -> LLM -> TTS -> Audio Playback
        
        Args:
            stage: One of 'recording', 'asr', 'asr_complete', 'llm', 'llm_complete',
                   'tts', 'tts_complete', 'playing', 'idle'
        """
        stages = {
            # Voice assistant pipeline stages
            'recording': {'A': 'off', 'B': 'blink', 'C': 'off'},     # Green blink during recording/listening
            'asr': {'A': 'blink', 'B': 'off', 'C': 'off'},          # Red blink during ASR
            'asr_complete': {'A': 'on', 'B': 'off', 'C': 'off'},    # Red solid when ASR done
            'llm': {'A': 'on', 'B': 'blink', 'C': 'off'},           # Red solid + Green blink during LLM
            'llm_complete': {'A': 'on', 'B': 'on', 'C': 'off'},     # Red+Green solid when LLM done
            'tts': {'A': 'on', 'B': 'on', 'C': 'blink'},            # Red+Green solid + Blue blink during TTS
            'tts_complete': {'A': 'on', 'B': 'on', 'C': 'on'},      # All solid when TTS done
            'playing': {'A': 'blink', 'B': 'blink', 'C': 'blink'},  # All blink during aplay
            'idle': {'A': 'off', 'B': 'off', 'C': 'off'}            # All off when idle
        }
        
        if stage not in stages:
            return
        
        config = stages[stage]
        
        # Special case: if all LEDs should blink (playing stage), use blink_all_leds for synchronization
        if config == {'A': 'blink', 'B': 'blink', 'C': 'blink'}:
            self.blink_all_leds()
        else:
            # Update button LEDs individually
            for led, state in config.items():
                if state == 'blink':
                    self.blink_led(led)
                elif state == 'on':
                    self.set_led(led, True)
                elif state == 'off':
                    self.set_led(led, False)


# ------- RAINBOW STRIP MANAGER -------
class RainbowStripManager:
    """Manages the APA102 LED strip patterns"""
    
    def __init__(self, rainbow_driver):
        self.rainbow_driver = rainbow_driver
        self.animation_thread = None
        self.animation_event = None
        self._lock = threading.Lock()
    
    def show_progress_bar(self, progress, color=(0, 255, 0)):
        """Show a progress bar on the LED strip (0.0 to 1.0)"""
        with self._lock:
            self.stop_animation()
            num_leds_on = int(self.rainbow_driver.NUM_LEDS * progress)
            for i in range(self.rainbow_driver.NUM_LEDS):
                # Since physical LED 6 is leftmost and LED 0 is rightmost,
                # we want to light up from left to right as progress increases
                if i < num_leds_on:
                    self.rainbow_driver.set_led(i, *color)
                else:
                    self.rainbow_driver.set_led(i, 0, 0, 0)
    
    def rainbow_cycle(self, speed=0.1):
        """Animate a rainbow pattern"""
        with self._lock:
            self.stop_animation()
            self.animation_event = threading.Event()
            
            def _animate():
                offset = 0
                while not self.animation_event.is_set():
                    for i in range(self.rainbow_driver.NUM_LEDS):
                        color_idx = (i + offset) % len(self.rainbow_driver.ROYG_colors)
                        r, g, b = self.rainbow_driver.ROYG_colors[color_idx]
                        self.rainbow_driver.set_led(i, r, g, b)
                    offset = (offset + 1) % len(self.rainbow_driver.ROYG_colors)
                    time.sleep(speed)
            
            self.animation_thread = threading.Thread(target=_animate, daemon=True)
            self.animation_thread.start()
    
    def pulse_color(self, color, speed=0.05):
        """Pulse all LEDs with a color"""
        with self._lock:
            self.stop_animation()
            self.animation_event = threading.Event()
            
            def _pulse():
                while not self.animation_event.is_set():
                    # Fade in
                    for brightness in range(0, 101, 5):
                        if self.animation_event.is_set():
                            break
                        r, g, b = [int(c * brightness / 100) for c in color]
                        for i in range(self.rainbow_driver.NUM_LEDS):
                            self.rainbow_driver.set_led(i, r, g, b)
                        time.sleep(speed)
                    # Fade out
                    for brightness in range(100, -1, -5):
                        if self.animation_event.is_set():
                            break
                        r, g, b = [int(c * brightness / 100) for c in color]
                        for i in range(self.rainbow_driver.NUM_LEDS):
                            self.rainbow_driver.set_led(i, r, g, b)
                        time.sleep(speed)
            
            self.animation_thread = threading.Thread(target=_pulse, daemon=True)
            self.animation_thread.start()
    
    def stop_animation(self):
        """Stop any running animation"""
        if self.animation_event:
            self.animation_event.set()
        if self.animation_thread and self.animation_thread.is_alive():
            self.animation_thread.join(timeout=1)
        self.animation_event = None
        self.animation_thread = None
    
    def clear(self):
        """Clear all LEDs"""
        with self._lock:
            self.stop_animation()
            for i in range(self.rainbow_driver.NUM_LEDS):
                self.rainbow_driver.set_led(i, 0, 0, 0)


# ------- ACTIVITY LED MANAGER CLASS -------
class ActivityLEDManager:
    """Manages activity-based LED colors for pipeline stages using rainbow strip pixels
    
    ARCHITECTURE NOTE: This manager provides semantic pipeline visualization using the first 3 LEDs
    of the rainbow strip (pixels 0, 1, 2) as dedicated activity indicators:
    
    - Red LED (pixel 0): ASR/Whisper activity (blink when active, solid when finished, off when no cycle)
    - Green LED (pixel 1): LLM activity (blink when active, solid when finished, off when no cycle)  
    - Blue LED (pixel 2): TTS/Speech activity (blink when active, solid when finished, off when no cycle)
    
    Special behavior: When a full cycle completes, all active LEDs blink together then turn off.
    
    HARDWARE REQUIREMENTS: Only functions when experimental_features_enabled=True. When disabled,
    methods run but have no visual effect, allowing the system to remain functional.
    
    INTEGRATION: Works alongside LEDManager which handles button LEDs for user interaction feedback.
    This creates a clean separation between user interface (buttons) and system status (pipeline).
    """
    
    def __init__(self, rainbow_driver, experimental_features_enabled=False):
        self.rainbow_driver = rainbow_driver
        self.experimental_features_enabled = experimental_features_enabled
        self.activity_states = {
            'red': {'active': False, 'finished': False, 'blink_thread': None, 'blink_event': None},  # ASR
            'green': {'active': False, 'finished': False, 'blink_thread': None, 'blink_event': None},  # LLM  
            'blue': {'active': False, 'finished': False, 'blink_thread': None, 'blink_event': None}   # TTS
        }
        self.cycle_complete_event = None
        self.cycle_complete_thread = None
        
        # Initialize all LEDs to off state
        self.set_all_leds_off()
    
    def set_all_leds_off(self):
        """Turn off all activity LEDs and stop any blinking"""
        for color in ['red', 'green', 'blue']:
            self._stop_led_activity(color)
            self._set_led_direct(color, False)
        self.activity_states = {
            'red': {'active': False, 'finished': False, 'blink_thread': None, 'blink_event': None},
            'green': {'active': False, 'finished': False, 'blink_thread': None, 'blink_event': None},
            'blue': {'active': False, 'finished': False, 'blink_thread': None, 'blink_event': None}
        }
    
    def _set_led_direct(self, color, state):
        """Directly set LED state without affecting activity tracking"""
        # Only use rainbow strip if experimental features are enabled
        if not self.experimental_features_enabled:
            return
            
        try:
            # Map colors to rainbow driver pixel indices
            color_map = {'red': 0, 'green': 1, 'blue': 2}
            if color in color_map and hasattr(self.rainbow_driver, 'pixels'):
                pixel_index = color_map[color]
                if state:
                    if color == 'red':
                        self.rainbow_driver.pixels[pixel_index] = (255, 0, 0)
                    elif color == 'green':
                        self.rainbow_driver.pixels[pixel_index] = (0, 255, 0)
                    elif color == 'blue':
                        self.rainbow_driver.pixels[pixel_index] = (0, 0, 255)
                else:
                    self.rainbow_driver.pixels[pixel_index] = (0, 0, 0)
                self.rainbow_driver.pixels.show()
        except Exception as e:
            print(f"Error setting {color} LED: {e}")
    
    def _stop_led_activity(self, color):
        """Stop any blinking activity for a specific LED"""
        state = self.activity_states[color]
        if state['blink_event']:
            state['blink_event'].set()
        if state['blink_thread'] and state['blink_thread'].is_alive():
            state['blink_thread'].join(timeout=0.5)
        state['blink_event'] = None
        state['blink_thread'] = None
    
    def _start_led_blink(self, color, blink_rate=0.3):
        """Start blinking a specific LED"""
        self._stop_led_activity(color)
        
        state = self.activity_states[color]
        state['blink_event'] = threading.Event()
        
        def _blink():
            while not state['blink_event'].is_set():
                self._set_led_direct(color, True)
                time.sleep(blink_rate)
                if not state['blink_event'].is_set():
                    self._set_led_direct(color, False)
                    time.sleep(blink_rate)
        
        state['blink_thread'] = threading.Thread(target=_blink, daemon=True)
        state['blink_thread'].start()
    
    def set_asr_active(self, is_text_input=False):
        """Set ASR (red LED) as active - blinks during activity
        If is_text_input=True, ASR is not used so LED stays off"""
        if is_text_input:
            # Text input - no ASR needed, turn off red LED
            self._stop_led_activity('red')
            self._set_led_direct('red', False)
            self.activity_states['red'] = {'active': False, 'finished': False, 'blink_thread': None, 'blink_event': None}
        else:
            # Voice input - ASR is active
            self.activity_states['red']['active'] = True
            self.activity_states['red']['finished'] = False
            self._start_led_blink('red')
    
    def set_asr_finished(self):
        """Set ASR as finished - solid red LED"""
        state = self.activity_states['red']
        if state['active']:  # Only if it was active
            self._stop_led_activity('red')
            self._set_led_direct('red', True)  # Solid on
            state['active'] = False
            state['finished'] = True
    
    def set_llm_active(self):
        """Set LLM (green LED) as active - blinks during thinking"""
        self.activity_states['green']['active'] = True
        self.activity_states['green']['finished'] = False
        self._start_led_blink('green')
    
    def set_llm_finished(self):
        """Set LLM as finished - solid green LED"""
        state = self.activity_states['green']
        if state['active']:  # Only if it was active
            self._stop_led_activity('green')
            self._set_led_direct('green', True)  # Solid on
            state['active'] = False
            state['finished'] = True
    
    def set_tts_active(self, has_voice_output=True):
        """Set TTS (blue LED) as active - blinks during speech generation
        If has_voice_output=False, TTS is not used so LED stays off"""
        if not has_voice_output:
            # No voice output - no TTS needed, turn off blue LED
            self._stop_led_activity('blue')
            self._set_led_direct('blue', False)
            self.activity_states['blue'] = {'active': False, 'finished': False, 'blink_thread': None, 'blink_event': None}
        else:
            # Voice output - TTS is active
            self.activity_states['blue']['active'] = True
            self.activity_states['blue']['finished'] = False
            self._start_led_blink('blue')
    
    def set_tts_finished(self):
        """Set TTS as finished - solid blue LED"""
        state = self.activity_states['blue']
        if state['active']:  # Only if it was active
            self._stop_led_activity('blue')
            self._set_led_direct('blue', True)  # Solid on
            state['active'] = False
            state['finished'] = True
    
    def cycle_complete(self):
        """Called when a full interaction cycle completes
        All active/finished LEDs blink once then turn off"""
        # Get all LEDs that were part of this cycle
        active_colors = []
        for color, state in self.activity_states.items():
            if state['active'] or state['finished']:
                active_colors.append(color)
        
        if not active_colors:
            return  # No LEDs were active in this cycle
        
        # Stop any existing completion animation
        if self.cycle_complete_event:
            self.cycle_complete_event.set()
        if self.cycle_complete_thread and self.cycle_complete_thread.is_alive():
            self.cycle_complete_thread.join(timeout=0.5)
        
        # Start completion animation
        self.cycle_complete_event = threading.Event()
        
        def _completion_blink():
            try:
                # Stop all current activities
                for color in active_colors:
                    self._stop_led_activity(color)
                
                # Blink all active LEDs together 3 times
                for _ in range(3):
                    if self.cycle_complete_event.is_set():
                        break
                    
                    # Turn on all active LEDs
                    for color in active_colors:
                        self._set_led_direct(color, True)
                    time.sleep(0.2)
                    
                    if self.cycle_complete_event.is_set():
                        break
                    
                    # Turn off all LEDs
                    for color in active_colors:
                        self._set_led_direct(color, False)
                    time.sleep(0.2)
                
                # Final cleanup - turn off all LEDs
                if not self.cycle_complete_event.is_set():
                    self.set_all_leds_off()
                    
            except Exception as e:
                print(f"Error in completion blink: {e}")
        
        self.cycle_complete_thread = threading.Thread(target=_completion_blink, daemon=True)
        self.cycle_complete_thread.start()
    
    def update_from_pipeline_status(self, pipeline_status, is_text_input=False, has_voice_output=True):
        """Update LED states based on pipeline status
        
        Args:
            pipeline_status: Status dict with 'activity' field
            is_text_input: True if input was text (no ASR)
            has_voice_output: True if output will be voice (TTS needed)
        """
        try:
            activity = pipeline_status.get('activity', 'idle')
            
            # Handle different activity states
            if 'listening' in activity:
                self.set_asr_active(is_text_input)
            elif 'thinking' in activity:
                # ASR finished (if it was used), LLM active
                if not is_text_input:
                    self.set_asr_finished()
                self.set_llm_active()
            elif 'speaking' in activity or 'playing' in activity:
                # LLM finished, TTS active
                self.set_llm_finished()
                self.set_tts_active(has_voice_output)
            elif activity == 'idle':
                # Full cycle complete
                if any(state['active'] or state['finished'] for state in self.activity_states.values()):
                    self.cycle_complete()
                
        except Exception as e:
            print(f"Error updating activity LEDs: {e}")


# ------- DRIVER CLASS -------
class RainbowDriver:
    def __init__(self, num_leds=7, brightness=2, use_experimental_strip=False):
        self.NUM_LEDS = num_leds
        self.BRIGHTNESS = brightness
        self.use_experimental_strip = use_experimental_strip
        self.led_states = [(0, 0, 0)] * self.NUM_LEDS
        self.ROYG_colors = [
            (255, 0, 0), (255, 127, 0), (255, 255, 0),
            (0, 255, 0), (0, 0, 255), (75, 0, 130), (148, 0, 211)
        ]
        self.color_names = ['Red', 'Orange', 'Yellow', 'Green', 'Blue', 'Indigo', 'Violet']

        # Setup BMP280
        i2c = busio.I2C(board.SCL, board.SDA)
        self.bmp280 = adafruit_bmp280.Adafruit_BMP280_I2C(i2c, address=0x77)

        # Buttons, LEDs
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
        
        # Get buzzer manager instance
        self.buzzer_manager = BuzzerManager()
        self.tones = {'A': Tone("C5"), 'B': Tone("E5"), 'C': Tone("G5")}

        # APA102 Strip
        self.strip = APA102(num_led=self.NUM_LEDS, global_brightness=self.BRIGHTNESS)
        self.strip.spi.max_speed_hz = 1000000
        self.strip.clear_strip()
        self.strip.show()
        
        # Create pixels interface for ActivityLEDManager compatibility
        self.pixels = APA102PixelInterface(self.strip)

        # Initialize display manager
        self.display_manager = DisplayManager(self)

        # Initialize LED manager for button LEDs
        self.button_led_manager = LEDManager(self)
        
        # Initialize Activity LED manager for RGB strip
        self.rgb_led_manager = ActivityLEDManager(self, experimental_features_enabled=use_experimental_strip)

        # Initialize Rainbow Strip manager
        self.rainbow_strip_manager = RainbowStripManager(self)

        for name, btn in self.buttons.items():
            btn.when_pressed = self._make_button_handler(name)

        signal.signal(signal.SIGINT, self.shutdown)

        if self.use_experimental_strip:
            logging.warning("[EXPERIMENTAL] APA102 LED strip features are enabled. LED behavior may be unpredictable on Pi 5.")
        else:
            logging.info("APA102 LED strip features are disabled.")

    def _make_button_handler(self, name):
        def handler():
            logging.info(f"Button {name} pressed")
            # Use LED manager for button feedback
            self.button_led_manager.pulse_led(name, fade_in=0.1, fade_out=0.1, n=1)
            # Use buzzer manager for immediate button feedback
            self.buzzer_manager.play_tone_immediate(self.tones[name], 0.2)
        return handler

    def set_led(self, index, r, g, b):
        """Set LED color on the APA102 strip (experimental feature)"""
        if not self.use_experimental_strip:
            return  # Silently ignore if experimental features disabled
            
        if not (0 <= index < self.NUM_LEDS):
            logging.error(f"Invalid LED index: {index}")
            return
            
        # Reverse the index since LED 6 is on the far left and LED 0 is on the far right
        reversed_index = (self.NUM_LEDS - 1) - index
        
        logging.info(f"[EXPERIMENTAL] Setting LED {index} (physical {reversed_index}) to RGB({r},{g},{b})")
        self.led_states[reversed_index] = (r, g, b)
        self._apply_leds()

    def _apply_leds(self):
        for i in range(self.NUM_LEDS):
            r, g, b = self.led_states[i]
            self.strip.set_pixel(i, r, g, b)
        self.strip.show()

    def display_number(self, number):
        """Display a number on the 4-digit display"""
        self.display_manager.display_number(number)

    def display_text(self, text):
        """Display text on the 4-digit display"""
        self.display_manager.display_text(text)

    def clear_display(self):
        """Clear the display"""
        self.display_manager.clear()

    def scroll_text(self, text, scroll_speed=0.3):
        """Scroll text across the display"""
        self.display_manager.scroll_text(text, scroll_speed)

    def display_timer(self, start_time, stop_event, sound_fx=False, tick_type="clock"):
        """Display incrementing timer"""
        self.display_manager.display_timer(start_time, stop_event, sound_fx, tick_type)

    def blink_number(self, number, duration=4, blink_speed=0.3):
        """Blink a number on the display"""
        self.display_manager.blink_number(number, duration, blink_speed)

    def print_sensor_data(self):
        temp = self.bmp280.temperature
        pressure = self.bmp280.pressure
        logging.info(f"🌡️ Temp: {temp:.1f}°C | Pressure: {pressure:.1f} hPa")

    def shutdown(self, sig=None, frame=None):
        logging.info("🛑 Shutdown: Clearing displays and turning off LEDs.")
        # Stop all LED animations
        self.button_led_manager.stop_all_leds()
        self.rainbow_strip_manager.clear()
        # Clear displays
        self.strip.clear_strip()
        self.strip.show()
        self.clear_display()
        # Shutdown buzzer manager
        self.buzzer_manager.shutdown()
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

    def show_error(self, message, duration=2):
        """Show an error message on display with optional red LED pulse"""
        self.clear_display()
        self.scroll_text(message, scroll_speed=0.3)
        
        # Add red pulse effect if experimental features enabled
        if self.use_experimental_strip:
            self.rainbow_strip_manager.pulse_color((255, 0, 0), speed=0.1)
        
        time.sleep(duration)
        self.clear_display()
        
        # Clear rainbow strip if used
        if self.use_experimental_strip:
            self.rainbow_strip_manager.clear()
    
    def show_countdown(self, seconds):
        """Show countdown on display with optional progress bar"""
        for i in range(seconds, 0, -1):
            self.display_number(i)
            
            # Add progress bar if experimental features enabled
            if self.use_experimental_strip:
                progress = (seconds - i) / seconds
                self.rainbow_strip_manager.show_progress_bar(progress, color=(255, 165, 0))
            
            time.sleep(1)
        
        self.clear_display()
        
        # Clear rainbow strip if used
        if self.use_experimental_strip:
            self.rainbow_strip_manager.clear()
    
    def celebrate(self):
        """Play a celebration pattern if experimental features enabled"""
        if self.use_experimental_strip:
            self.rainbow_strip_manager.rainbow_cycle(speed=0.05)
            time.sleep(2)
            self.rainbow_strip_manager.clear()
        else:
            # Alternative celebration without rainbow strip - just blink all button LEDs
            for _ in range(3):
                self.button_led_manager.blink_all_leds(on_time=0.1, off_time=0.1)
                time.sleep(0.3)
            self.button_led_manager.stop_all_leds()
    
    def clear_rainbow_strip(self):
        """Clear all rainbow strip LEDs (turn them off)"""
        if self.use_experimental_strip:
            self.rainbow_strip_manager.clear()

    def update_activity_leds(self, pipeline_status, is_text_input=False, has_voice_output=True):
        """Update LED states based on pipeline status"""
        self.rgb_led_manager.update_from_pipeline_status(pipeline_status, is_text_input, has_voice_output)


# Global getter for buzzer manager (for use by higher-level code)
def get_buzzer_manager():
    """Get the singleton buzzer manager instance"""
    return BuzzerManager()
