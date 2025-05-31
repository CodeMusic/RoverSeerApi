import time
import threading
from gpiozero.tones import Tone

from config import TICK_TYPE
from embodiment.rainbow_interface import get_rainbow_driver

# Global state for display coordination
current_display_value = None  # Track what's currently on display
isScrolling = False


def scroll_text_on_display(text, scroll_speed=0.3):
    """Scroll text across the 4-digit display"""
    global current_display_value, isScrolling
    rainbow = get_rainbow_driver()
    
    if rainbow:
        try:
            import fourletterphat as flp
            # Add spaces for smooth scrolling
            padded_text = "    " + text.upper() + "    "
            isScrolling = True
            for i in range(len(padded_text) - 3):
                flp.clear()
                display_text = padded_text[i:i+4]
                flp.print_str(display_text)
                flp.show()
                current_display_value = display_text  # Track what's on display
                time.sleep(scroll_speed)
            
            # Leave the last 4 characters on display
            final_text = padded_text[-8:-4] if len(padded_text) > 8 else padded_text[:4]
            flp.clear()
            flp.print_str(final_text)
            flp.show()
            current_display_value = final_text
        except Exception as e:
            print(f"Error scrolling text: {e}")
        finally:
            isScrolling = False


def display_timer(start_time, stop_event, sound_fx=False):
    """Display incrementing timer on the display until stop_event is set
    
    Args:
        start_time: The start time for the timer
        stop_event: Threading event to stop the timer
        sound_fx: If True, play ticking sounds based on TICK_TYPE
    """
    global current_display_value, isScrolling
    rainbow = get_rainbow_driver()
    
    if rainbow:
        # Check if we're currently scrolling and wait
        while isScrolling:
            time.sleep(0.1)
            if stop_event.is_set():
                return
        
        try:
            import fourletterphat as flp
            last_elapsed = -1
            tick_state = False  # For alternating tick/tock in clock mode
            music_note_index = 0  # For music mode progression
            
            # Define musical scale for music mode (pentatonic scale for pleasant sound)
            music_scale = [
                Tone("C4"), Tone("D4"), Tone("F4"), Tone("G4"), Tone("A4"),
                Tone("C5"), Tone("D5"), Tone("F5"), Tone("G5"), Tone("A5")
            ]
            
            while not stop_event.is_set():
                elapsed = int(time.time() - start_time)
                
                # Only update display and play sound if the number changed
                if elapsed != last_elapsed:
                    # Only update display if not scrolling
                    if not isScrolling:
                        rainbow.display_number(elapsed)
                        current_display_value = elapsed
                    
                    # Play tick sound based on mode (only if sound_fx is enabled)
                    if sound_fx and rainbow and hasattr(rainbow, 'buzzer'):
                        try:
                            if TICK_TYPE == "clock":
                                # Clock mode: alternating tick/tock sounds
                                if tick_state:
                                    # Tick (higher pitch)
                                    rainbow.buzzer.play(Tone("E5"))
                                else:
                                    # Tock (lower pitch)
                                    rainbow.buzzer.play(Tone("C4"))
                                tick_state = not tick_state
                                
                                # Play for slightly longer to make it more audible
                                time.sleep(0.05)  # Increased from 0.02
                                rainbow.buzzer.stop()
                                
                            elif TICK_TYPE == "music":
                                # Music mode: play notes from scale
                                note = music_scale[music_note_index % len(music_scale)]
                                rainbow.buzzer.play(note)
                                
                                # Play for slightly longer to make it more audible
                                time.sleep(0.04)  # Increased from 0.015
                                rainbow.buzzer.stop()
                                
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
            print(f"Error displaying timer: {e}")


def blink_number(number, duration=4, blink_speed=0.3):
    """Blink a number on the display for specified duration"""
    global current_display_value, isScrolling
    rainbow = get_rainbow_driver()
    
    if rainbow:
        # Wait for any scrolling to finish
        while isScrolling:
            time.sleep(0.1)
        
        try:
            import fourletterphat as flp
            end_time = time.time() + duration
            while time.time() < end_time:
                # Only blink if not scrolling
                if not isScrolling:
                    rainbow.display_number(number)
                    time.sleep(blink_speed)
                    if not isScrolling:
                        flp.clear()
                        flp.show()
                    time.sleep(blink_speed)
                else:
                    # If scrolling, just wait
                    time.sleep(0.1)
            # Leave the number on display after blinking (only if not scrolling)
            if not isScrolling:
                rainbow.display_number(number)
                current_display_value = number
        except Exception as e:
            print(f"Error blinking number: {e}")


def clear_display():
    """Clear the display"""
    global current_display_value
    rainbow = get_rainbow_driver()
    
    if rainbow:
        try:
            import fourletterphat as flp
            flp.clear()
            flp.show()
            current_display_value = None
        except Exception as e:
            print(f"Error clearing display: {e}")


def display_number(number):
    """Display a number on the 4-digit display"""
    global current_display_value
    rainbow = get_rainbow_driver()
    
    if rainbow:
        try:
            rainbow.display_number(number)
            current_display_value = number
        except Exception as e:
            print(f"Error displaying number: {e}")


def display_text(text):
    """Display text on the 4-digit display (up to 4 characters)"""
    global current_display_value
    rainbow = get_rainbow_driver()
    
    if rainbow:
        try:
            import fourletterphat as flp
            flp.clear()
            flp.print_str(text[:4].upper())  # Limit to 4 characters and uppercase
            flp.show()
            current_display_value = text[:4].upper()
        except Exception as e:
            print(f"Error displaying text: {e}")


def get_current_display_value():
    """Get what's currently displayed"""
    return current_display_value


def is_scrolling():
    """Check if text is currently scrolling"""
    return isScrolling 