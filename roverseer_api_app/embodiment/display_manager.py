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
    """Display incrementing timer on the display"""
    rainbow = get_rainbow_driver()
    if rainbow:
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