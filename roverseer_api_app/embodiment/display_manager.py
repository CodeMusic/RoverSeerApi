import time
import threading
from gpiozero.tones import Tone

from config import TICK_TYPE
from embodiment.rainbow_interface import get_rainbow_driver


def interrupt_scrolling():
    """Signal to interrupt any current scrolling"""
    rainbow = get_rainbow_driver()
    if rainbow and rainbow.display_manager:
        rainbow.display_manager.scroll_interrupt = True


def scroll_text_on_display(text, scroll_speed=0.3):
    """Scroll text across the 4-digit display"""
    rainbow = get_rainbow_driver()
    if rainbow:
        rainbow.scroll_text(text, scroll_speed)


def display_timer(start_time, stop_event, sound_fx=False):
    """
    Display incrementing timer on the display with advanced temporal pattern
    
    Uses the TemporalPerspective class for advanced timing patterns
    """
    rainbow = get_rainbow_driver()
    if not rainbow:
        return
        
    try:
        # Import here to avoid circular imports
        from perception.temporal_perspective import get_temporal_perspective
        
        # Get temporal perspective instance
        temporal = get_temporal_perspective()
        
        # Configure for standard timer pattern with 7-cycle patterns
        temporal.configure_oscillation(
            interval=1.0,  # 1 second interval for timer
            marker_positions=[0],  # Mark start of each cycle
            skip_positions=[],  # Don't skip any positions
            double_beat_positions=[3],  # Double beat at middle of cycle
            flicker_positions=[6]  # Flicker at end of cycle
        )
        
        # Define display update function - updates the digits
        def update_display(position):
            if stop_event.is_set():
                temporal.stop_oscillation()
                return
                
            # Calculate elapsed time
            elapsed = int(time.time() - start_time)
            
            # Update display
            rainbow.display_number(elapsed)
        
        # Register callback for both tick and tock (every beat)
        temporal.register_callback('on_tick', update_display)
        temporal.register_callback('on_tock', update_display)
        
        # If sound effects enabled, use default sounds
        if not sound_fx:
            # Register silent sound handlers
            temporal.register_sound('tick', lambda: None)
            temporal.register_sound('tock', lambda: None)
            temporal.register_sound('marker', lambda: None)
            
        # Start the oscillation pattern
        temporal.start_oscillation(start_time)
        
        # Wait for stop event
        while not stop_event.is_set():
            time.sleep(0.1)
            
        # Stop oscillation when done
        temporal.stop_oscillation()
        
    except ImportError:
        # Fallback to old method if temporal_perspective not available
        rainbow.display_timer(start_time, stop_event, sound_fx, TICK_TYPE)


def blink_number(number, duration=4, blink_speed=0.3):
    """Blink a number on the display for specified duration"""
    rainbow = get_rainbow_driver()
    if rainbow:
        rainbow.blink_number(number, duration, blink_speed)


def clear_display():
    """Clear the display"""
    rainbow = get_rainbow_driver()
    if rainbow:
        rainbow.clear_display()


def force_clear_display():
    """Force clear the display with error handling"""
    try:
        rainbow = get_rainbow_driver()
        if rainbow:
            # Stop any ongoing scrolling first
            interrupt_scrolling()
            # Clear the display
            rainbow.clear_display()
            # Also clear any display value tracking
            if hasattr(rainbow, 'display_manager'):
                rainbow.display_manager.current_value = None
                rainbow.display_manager.is_scrolling = False
                rainbow.display_manager.scroll_interrupt = True
        print("✅ Display force cleared")
    except Exception as e:
        print(f"⚠️ Error force clearing display: {e}")
        # Try direct hardware clear as fallback
        try:
            import fourletterphat as flp
            flp.clear()
            flp.show()
        except:
            pass


def display_number(number):
    """Display a number on the 4-digit display"""
    rainbow = get_rainbow_driver()
    if rainbow:
        rainbow.display_number(number)


def display_text(text):
    """Display text on the 4-digit display (up to 4 characters)"""
    rainbow = get_rainbow_driver()
    if rainbow:
        rainbow.display_text(text)


def get_current_display_value():
    """Get what's currently displayed"""
    rainbow = get_rainbow_driver()
    if rainbow and rainbow.display_manager:
        return rainbow.display_manager.get_current_value()
    return None


def is_scrolling():
    """Check if text is currently scrolling"""
    rainbow = get_rainbow_driver()
    if rainbow and rainbow.display_manager:
        return rainbow.display_manager.is_scrolling_active()
    return False


# Backward compatibility - rainbow_interface checks these directly
# Create a class that acts like a boolean but calls the function
class ScrollingState:
    def __bool__(self):
        return is_scrolling()
    
    def __nonzero__(self):  # Python 2 compatibility
        return is_scrolling()


# These variables are accessed directly by rainbow_interface.py
isScrolling = ScrollingState()
current_display_value = None  # Not really used anymore
scroll_interrupt = None  # Not used anymore
current_scroll_thread = None  # Not used anymore 