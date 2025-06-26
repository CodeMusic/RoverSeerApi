import threading
import time
from expression.sound_orchestration import play_sound_async

class TemporalPerspective:
    """
    Manages temporal patterns and rhythmic oscillations with psychological significance.
    Implements a 7-cycle oscillation pattern that can trigger different cognitive responses
    based on position within the cycle.
    
    Psychology terminology used:
    - Entrainment: The process of synchronizing to external rhythms
    - Salience: The prominence of a particular moment
    - Temporal markers: Distinct moments that help track time
    - Oscillation: Rhythmic alternation between states
    """
    
    def __init__(self):
        self.active_thread = None
        self.stop_event = threading.Event()
        self.cycle_position = 0  # Position within the 7-cycle pattern
        self.callback_registry = {
            # Default registry with empty callbacks
            'on_tick': None,
            'on_tock': None,
            'on_cycle_complete': None,
            'on_special_position': {}  # Keys will be positions 0-6
        }
        self.sound_registry = {
            'tick': self._default_tick,
            'tock': self._default_tock,
            'marker': self._default_marker
        }
        self.oscillation_interval = 1.0  # Default 1 second interval
        self.marker_positions = [0]  # Default marker on first position
        self.skip_positions = []  # Positions to skip sound
        self.double_beat_positions = []  # Positions for double beat
        self.flicker_positions = []  # Positions to flicker LED
        
    def _default_tick(self):
        """Default tick sound implementation"""
        from expression.sound_orchestration import play_toggle_left_sound
        play_sound_async(play_toggle_left_sound)
        
    def _default_tock(self):
        """Default tock sound implementation"""
        from expression.sound_orchestration import play_toggle_right_sound
        play_sound_async(play_toggle_right_sound)
        
    def _default_marker(self):
        """Default cycle marker sound implementation"""
        from expression.sound_orchestration import play_confirmation_sound
        play_sound_async(play_confirmation_sound)
    
    def register_callback(self, event_type, callback, position=None):
        """
        Register callbacks for different temporal events
        
        Args:
            event_type: Type of event ('on_tick', 'on_tock', 'on_cycle_complete', 'on_special_position')
            callback: Function to call when event occurs
            position: For 'on_special_position', which position (0-6) to trigger on
        """
        if event_type == 'on_special_position' and position is not None:
            if 0 <= position <= 6:
                self.callback_registry['on_special_position'][position] = callback
        else:
            self.callback_registry[event_type] = callback
    
    def register_sound(self, sound_type, sound_function):
        """Register custom sound functions"""
        if sound_type in self.sound_registry:
            self.sound_registry[sound_type] = sound_function
    
    def configure_oscillation(self, interval=1.0, marker_positions=None, 
                             skip_positions=None, double_beat_positions=None,
                             flicker_positions=None):
        """
        Configure the oscillation pattern
        
        Args:
            interval: Time between beats in seconds
            marker_positions: List of positions (0-6) where marker sound plays
            skip_positions: List of positions to skip sound
            double_beat_positions: List of positions for double beat
            flicker_positions: List of positions to trigger LED flicker
        """
        self.oscillation_interval = interval
        
        if marker_positions is not None:
            self.marker_positions = [p for p in marker_positions if 0 <= p <= 6]
            
        if skip_positions is not None:
            self.skip_positions = [p for p in skip_positions if 0 <= p <= 6]
            
        if double_beat_positions is not None:
            self.double_beat_positions = [p for p in double_beat_positions if 0 <= p <= 6]
            
        if flicker_positions is not None:
            self.flicker_positions = [p for p in flicker_positions if 0 <= p <= 6]
    
    def start_oscillation(self, start_time=None, custom_interval=None):
        """
        Start the temporal oscillation pattern
        
        Args:
            start_time: Optional reference start time
            custom_interval: Optional custom interval for this session only
        """
        # Stop any existing oscillation
        self.stop_oscillation()
        
        # Reset stop event
        self.stop_event = threading.Event()
        
        # Create and start thread
        self.active_thread = threading.Thread(
            target=self._oscillation_thread,
            args=(start_time, custom_interval)
        )
        self.active_thread.daemon = True
        self.active_thread.start()
        
    def stop_oscillation(self):
        """Stop the current oscillation pattern"""
        if self.active_thread and self.active_thread.is_alive():
            self.stop_event.set()
            self.active_thread.join(timeout=1.0)
            self.active_thread = None
    
    def _oscillation_thread(self, start_time=None, custom_interval=None):
        """
        Internal thread function for oscillation pattern
        
        Args:
            start_time: Reference time for synchronization
            custom_interval: Optional override for oscillation interval
        """
        interval = custom_interval or self.oscillation_interval
        
        # If no start time provided, use current time
        if start_time is None:
            start_time = time.time()
        
        while not self.stop_event.is_set():
            # Calculate elapsed time and normalized position
            elapsed_time = time.time() - start_time
            
            # Determine position in 7-cycle pattern
            self.cycle_position = int(elapsed_time / interval) % 7
            
            # Determine if this is a tick or tock moment
            is_tick = int(elapsed_time / interval) % 2 == 0
            
            # Skip sound if in skip positions
            if self.cycle_position in self.skip_positions:
                pass  # Skip sound
            else:
                # Play tick or tock
                if is_tick:
                    self.sound_registry['tick']()
                    if self.callback_registry['on_tick']:
                        self.callback_registry['on_tick'](self.cycle_position)
                else:
                    self.sound_registry['tock']()
                    if self.callback_registry['on_tock']:
                        self.callback_registry['on_tock'](self.cycle_position)
            
            # Double beat for special positions
            if self.cycle_position in self.double_beat_positions:
                time.sleep(interval / 4)  # Quick double beat
                if is_tick:
                    self.sound_registry['tick']()
                else:
                    self.sound_registry['tock']()
            
            # Marker sound for cycle positions
            if self.cycle_position in self.marker_positions:
                self.sound_registry['marker']()
            
            # Flicker LED on special positions
            if self.cycle_position in self.flicker_positions:
                self._handle_flicker()
            
            # Call special position callbacks
            if self.cycle_position in self.callback_registry['on_special_position']:
                self.callback_registry['on_special_position'][self.cycle_position]()
            
            # Call cycle complete callback when returning to position 0
            if self.cycle_position == 0 and self.callback_registry['on_cycle_complete']:
                self.callback_registry['on_cycle_complete']()
            
            # Calculate time to sleep - ensures consistent timing
            current_time = time.time()
            elapsed = current_time - start_time
            next_beat = ((int(elapsed / interval) + 1) * interval) + start_time
            sleep_time = max(0.01, next_beat - current_time)
            
            # Sleep until next beat
            time.sleep(sleep_time)
    
    def _handle_flicker(self):
        """Handle LED flickering on special positions"""
        try:
            from embodiment.rainbow_interface import get_rainbow_driver
            rainbow_driver = get_rainbow_driver()
            if rainbow_driver:
                # Get button LED manager
                led_manager = rainbow_driver.button_led_manager
                # Quick flicker of all LEDs
                led_manager.blink_all_leds(on_time=0.05, off_time=0.05)
        except Exception as e:
            print(f"Flicker error: {e}")

# Singleton instance
_temporal_perspective_instance = None

def get_temporal_perspective():
    """Get the singleton TemporalPerspective instance"""
    global _temporal_perspective_instance
    
    if _temporal_perspective_instance is None:
        _temporal_perspective_instance = TemporalPerspective()
        
    return _temporal_perspective_instance 