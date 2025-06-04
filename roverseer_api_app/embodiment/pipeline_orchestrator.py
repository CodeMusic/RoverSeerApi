"""
Pipeline Orchestrator - Centralized coordination for RoverSeer system pipeline

This orchestrator coordinates the existing flow management systems in rainbow_driver,
providing centralized control over system state transitions and cleanup.

Key Principles:
- Builds on existing rainbow_driver managers
- Single source of truth for system state
- Graceful interruption and cleanup
- Psychology-focused naming for states
- Defensive state management for overlapping processes
"""

import threading
import time
import logging
from enum import Enum
from typing import Optional, Dict, Any
from dataclasses import dataclass, field

# Import config for pipeline state access
import config


class SystemState(Enum):
    """
    System states representing the rover's processing pipeline
    Using psychology-focused naming conventions while avoiding "cognitive"
    """
    IDLE = "idle"                          # System at rest
    LISTENING = "listening"                # Recording/receiving input
    PROCESSING_SPEECH = "processing_speech" # ASR processing
    CONTEMPLATING = "contemplating"        # LLM thinking (cognitive part)
    SYNTHESIZING = "synthesizing"          # TTS generation
    EXPRESSING = "expressing"              # Audio playback
    INTERRUPTED = "interrupted"            # Process interrupted


@dataclass
class PipelineState:
    """
    Comprehensive state tracking for the system pipeline
    """
    current_state: SystemState = SystemState.IDLE
    previous_state: Optional[SystemState] = None
    state_start_time: float = field(default_factory=time.time)
    interrupt_requested: bool = False
    force_cleanup_needed: bool = False
    active_processes: Dict[str, Any] = field(default_factory=dict)


class PipelineOrchestrator:
    """
    Centralized orchestrator for system pipeline flow
    
    This orchestrator coordinates the existing rainbow_driver managers:
    - BuzzerManager for sound coordination
    - LEDManager for button LEDs
    - ActivityLEDManager for pipeline visualization
    - DisplayManager for screen feedback
    
    Provides the "force stop" logic for overlapping processes
    """
    
    _instance = None
    _lock = threading.RLock()
    
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
        
        self.state = PipelineState()
        self.state_lock = threading.RLock()
        self.rainbow_driver = None
        self.logger = logging.getLogger(__name__)
        
        # State transition callbacks
        self.state_callbacks = {}
        
        # Load timeout settings from configuration
        self._load_timeout_settings()
        
        # Start automatic cleanup thread
        self._start_cleanup_thread()
        
        # Initialize with hardware reference
        self._initialize_hardware_reference()
    
    def _load_timeout_settings(self):
        """Load pipeline timeout settings from configuration"""
        # REMOVED: Complex timeout system that was breaking hardware init
        # Keep it simple - no automatic timeouts
        self.state_timeouts = {}
        
    def _start_cleanup_thread(self):
        """Start a background thread to monitor and cleanup stuck states"""
        def cleanup_monitor():
            while True:
                try:
                    time.sleep(5)  # Check every 5 seconds
                    self._check_for_stuck_state()
                except Exception as e:
                    self.logger.error(f"Error in cleanup monitor: {e}")
        
        cleanup_thread = threading.Thread(target=cleanup_monitor, daemon=True)
        cleanup_thread.start()
    
    def _check_for_stuck_state(self):
        """Check if current state has been active too long and force reset if needed"""
        with self.state_lock:
            current_state = self.state.current_state
            
            # Skip timeout check for IDLE and INTERRUPTED states
            if current_state in [SystemState.IDLE, SystemState.INTERRUPTED]:
                return
            
            # Check if state has been active too long
            if current_state in self.state_timeouts:
                state_duration = time.time() - self.state.state_start_time
                timeout = self.state_timeouts[current_state]
                
                if state_duration > timeout:
                    self.logger.warning(f"State {current_state.value} has been active for {state_duration:.1f}s (timeout: {timeout}s). Force resetting...")
                    
                    # Force cleanup and reset to idle
                    self.state.force_cleanup_needed = True
                    self.transition_to_state(SystemState.IDLE, force=True)
                    
                    # Also reset external flags
                    import config
                    config.recording_in_progress = False
                    for key in config.pipeline_stages:
                        config.pipeline_stages[key] = False
    
    def _initialize_hardware_reference(self):
        """Initialize reference to hardware drivers"""
        try:
            from embodiment.rainbow_interface import get_rainbow_driver
            self.rainbow_driver = get_rainbow_driver()
        except ImportError:
            self.logger.warning("Could not import rainbow interface")
    
    def register_state_callback(self, state: SystemState, callback):
        """Register a callback for state transitions"""
        if state not in self.state_callbacks:
            self.state_callbacks[state] = []
        self.state_callbacks[state].append(callback)
    
    def transition_to_state(self, new_state: SystemState, force: bool = False):
        """
        Transition to a new system state with proper cleanup
        
        Args:
            new_state: The target system state
            force: Whether to force transition even if already in that state
        """
        with self.state_lock:
            if not force and self.state.current_state == new_state:
                return
            
            # Handle force cleanup if needed
            if self.state.force_cleanup_needed:
                self._perform_force_cleanup()
            
            # Store previous state
            old_state = self.state.current_state
            self.state.previous_state = old_state
            
            # Cleanup old state
            self._cleanup_state(old_state)
            
            # Transition to new state
            self.state.current_state = new_state
            self.state.state_start_time = time.time()
            self.state.interrupt_requested = False
            
            # Update config pipeline stages for compatibility
            self._sync_pipeline_stages()
            
            # Update hardware using existing rainbow_driver managers
            self._update_hardware_for_state(new_state)
            
            # Execute callbacks
            if new_state in self.state_callbacks:
                for callback in self.state_callbacks[new_state]:
                    try:
                        callback(old_state, new_state)
                    except Exception as e:
                        self.logger.error(f"Error in state callback: {e}")
            
            self.logger.info(f"System state: {old_state.value} → {new_state.value}")
    
    def _sync_pipeline_stages(self):
        """Sync config pipeline stages with current system state"""
        # Reset all stages
        for key in config.pipeline_stages:
            config.pipeline_stages[key] = False
        
        # Set active stage based on system state
        state_mappings = {
            SystemState.LISTENING: 'asr_active',
            SystemState.PROCESSING_SPEECH: 'asr_active', 
            SystemState.CONTEMPLATING: 'llm_active',
            SystemState.SYNTHESIZING: 'tts_active',
            SystemState.EXPRESSING: 'aplay_active'
        }
        
        if self.state.current_state in state_mappings:
            stage_key = state_mappings[self.state.current_state]
            config.pipeline_stages[stage_key] = True
    
    def _update_hardware_for_state(self, state: SystemState):
        """Update hardware using existing rainbow_driver managers"""
        if not self.rainbow_driver:
            return
        
        # Map system states to existing show_progress stages
        progress_stage_mappings = {
            SystemState.IDLE: 'idle',
            SystemState.LISTENING: 'recording',
            SystemState.PROCESSING_SPEECH: 'asr',
            SystemState.CONTEMPLATING: 'llm',
            SystemState.SYNTHESIZING: 'tts',
            SystemState.EXPRESSING: 'playing',
            SystemState.INTERRUPTED: 'idle'
        }
        
        # Use existing LEDManager show_progress method
        if (state in progress_stage_mappings and 
            hasattr(self.rainbow_driver, 'button_led_manager')):
            stage = progress_stage_mappings[state]
            print(f"🔥 DEBUG: Calling show_progress('{stage}') for state {state}")
            self.rainbow_driver.button_led_manager.show_progress(stage)
        else:
            print(f"🔥 DEBUG: No LED update - state {state} not in mappings or no button_led_manager")
        
        # Use existing ActivityLEDManager for RGB strip visualization
        if hasattr(self.rainbow_driver, 'rgb_led_manager'):
            if state == SystemState.LISTENING:
                self.rainbow_driver.rgb_led_manager.set_asr_active()
            elif state == SystemState.PROCESSING_SPEECH:
                self.rainbow_driver.rgb_led_manager.set_asr_finished()
            elif state == SystemState.CONTEMPLATING:
                self.rainbow_driver.rgb_led_manager.set_llm_active()
            elif state == SystemState.SYNTHESIZING:
                self.rainbow_driver.rgb_led_manager.set_tts_active()
            elif state == SystemState.EXPRESSING:
                self.rainbow_driver.rgb_led_manager.set_tts_finished()
            elif state in [SystemState.IDLE, SystemState.INTERRUPTED]:
                self.rainbow_driver.rgb_led_manager.set_all_leds_off()
    
    def _cleanup_state(self, state: SystemState):
        """Cleanup operations when leaving a state"""
        try:
            # Use existing BuzzerManager clear_queue_and_interrupt
            if self.rainbow_driver and hasattr(self.rainbow_driver, 'buzzer_manager'):
                self.rainbow_driver.buzzer_manager.clear_queue_and_interrupt()
            
            # Clean up any state-specific processes
            if 'audio_process' in self.state.active_processes:
                process = self.state.active_processes['audio_process']
                if process and process.poll() is None:
                    try:
                        process.terminate()
                        process.wait(timeout=1)
                    except:
                        try:
                            process.kill()
                        except:
                            pass
                del self.state.active_processes['audio_process']
            
            # Special cleanup for EXPRESSING state (audio playback)
            if state == SystemState.EXPRESSING:
                # Ensure all LEDs are turned off after audio playback
                if self.rainbow_driver:
                    if hasattr(self.rainbow_driver, 'button_led_manager'):
                        self.rainbow_driver.button_led_manager.stop_all_leds()
                    if hasattr(self.rainbow_driver, 'rgb_led_manager'):
                        self.rainbow_driver.rgb_led_manager.set_all_leds_off()
            
        except Exception as e:
            self.logger.error(f"Error during state cleanup: {e}")
    
    def _perform_force_cleanup(self):
        """
        Perform aggressive cleanup when system gets stuck
        This implements the "force stop" logic for overlapping processes
        """
        self.logger.warning("Performing force cleanup of stuck processes")
        
        try:
            # Use existing BuzzerManager force_stop
            if self.rainbow_driver and hasattr(self.rainbow_driver, 'buzzer_manager'):
                self.rainbow_driver.buzzer_manager.force_stop()
            
            # Kill any lingering audio processes
            import subprocess
            try:
                subprocess.run(['pkill', '-f', 'aplay'], timeout=2)
                subprocess.run(['pkill', '-f', 'arecord'], timeout=2)
            except:
                pass
            
            # Use existing LEDManager stop_all_leds
            if self.rainbow_driver and hasattr(self.rainbow_driver, 'button_led_manager'):
                self.rainbow_driver.button_led_manager.stop_all_leds()
            
            # Use existing ActivityLEDManager set_all_leds_off
            if self.rainbow_driver and hasattr(self.rainbow_driver, 'rgb_led_manager'):
                self.rainbow_driver.rgb_led_manager.set_all_leds_off()
            
            # Clear active processes
            self.state.active_processes.clear()
            
            # Reset recording flag
            config.recording_in_progress = False
            
            # Reset all pipeline stages
            for key in config.pipeline_stages:
                config.pipeline_stages[key] = False
            
            self.state.force_cleanup_needed = False
            
        except Exception as e:
            self.logger.error(f"Error during force cleanup: {e}")
    
    def request_interruption(self):
        """Request interruption of current system process"""
        with self.state_lock:
            if self.state.current_state not in [SystemState.IDLE, SystemState.INTERRUPTED]:
                self.state.interrupt_requested = True
                self.logger.info(f"Interruption requested during {self.state.current_state.value}")
                
                # Immediate cleanup for responsive interruption
                self._cleanup_state(self.state.current_state)
                self.transition_to_state(SystemState.INTERRUPTED)
    
    def start_pipeline_flow(self, input_type: str = "voice"):
        """
        Start a new pipeline flow cycle
        Implements the force stop logic for overlapping processes
        """
        with self.state_lock:
            # Force cleanup any stuck processes from previous cycles
            if self.state.current_state != SystemState.IDLE:
                self.logger.info("Force stopping previous pipeline flow")
                self.state.force_cleanup_needed = True
                self.transition_to_state(SystemState.INTERRUPTED, force=True)
                time.sleep(0.1)  # Brief pause for cleanup
            
            # Start fresh pipeline cycle
            if input_type == "voice":
                self.transition_to_state(SystemState.LISTENING)
            else:
                self.transition_to_state(SystemState.CONTEMPLATING)
    
    def advance_pipeline_flow(self):
        """Advance to the next stage in the pipeline flow"""
        with self.state_lock:
            current_state = self.state.current_state
            self.logger.info(f"🔄 advance_pipeline_flow called - current state: {current_state.value}")
            
            if self.state.interrupt_requested:
                self.logger.info("⚠️  Interrupt was requested, transitioning to INTERRUPTED")
                self.transition_to_state(SystemState.INTERRUPTED)
                return
            
            # State progression logic
            progressions = {
                SystemState.LISTENING: SystemState.PROCESSING_SPEECH,
                SystemState.PROCESSING_SPEECH: SystemState.CONTEMPLATING,
                SystemState.CONTEMPLATING: SystemState.SYNTHESIZING,
                SystemState.SYNTHESIZING: SystemState.EXPRESSING,
                SystemState.EXPRESSING: SystemState.IDLE
            }
            
            if current_state in progressions:
                next_state = progressions[current_state]
                self.logger.info(f"📈 Advancing from {current_state.value} to {next_state.value}")
                self.transition_to_state(next_state)
            else:
                self.logger.warning(f"⚠️  No progression defined for state: {current_state.value}")
            
            # Log final state
            final_state = self.state.current_state
            self.logger.info(f"✅ advance_pipeline_flow complete - final state: {final_state.value}")
    
    def complete_pipeline_flow(self):
        """Complete the pipeline flow and return to idle state"""
        with self.state_lock:
            self.transition_to_state(SystemState.IDLE)
    
    def is_system_busy(self) -> bool:
        """Check if the system is currently busy (general purpose)"""
        with self.state_lock:
            return self.state.current_state not in [SystemState.IDLE, SystemState.INTERRUPTED]
    
    def should_block_button_actions(self) -> bool:
        """Check if button actions should be blocked
        
        Button actions are allowed when:
        - System is idle
        - System is interrupted  
        - System is listening (waiting for recording to start)
        
        Button actions are blocked during:
        - Speech processing (ASR)
        - Contemplating (LLM)
        - Synthesizing (TTS)
        - Expressing (audio playback)
        """
        with self.state_lock:
            allowed_states = [SystemState.IDLE, SystemState.INTERRUPTED, SystemState.LISTENING]
            return self.state.current_state not in allowed_states
    
    def should_block_recording(self) -> bool:
        """Check if recording should be blocked
        
        Recording is allowed when:
        - System is idle
        - System is interrupted
        - System is listening (expected state for recording)
        
        Recording is blocked during:
        - Speech processing (ASR)
        - Contemplating (LLM) 
        - Synthesizing (TTS)
        - Expressing (audio playback)
        """
        with self.state_lock:
            blocked_states = [SystemState.PROCESSING_SPEECH, SystemState.CONTEMPLATING, 
                             SystemState.SYNTHESIZING, SystemState.EXPRESSING]
            return self.state.current_state in blocked_states
    
    def get_current_state(self) -> SystemState:
        """Get the current system state"""
        return self.state.current_state
    
    def register_audio_process(self, process):
        """Register an audio process for cleanup tracking"""
        with self.state_lock:
            self.state.active_processes['audio_process'] = process
    
    def play_system_sound(self, sound_function, *args, **kwargs):
        """Play a sound using the existing BuzzerManager"""
        if self.rainbow_driver and hasattr(self.rainbow_driver, 'buzzer_manager'):
            self.rainbow_driver.buzzer_manager.queue_function(sound_function, *args, **kwargs)
    
    def force_reset_to_idle(self):
        """Public method to force reset the orchestrator to idle state"""
        with self.state_lock:
            current_state = self.state.current_state
            self.logger.warning(f"Force resetting from {current_state.value} to IDLE")
            
            # Force cleanup
            self.state.force_cleanup_needed = True
            self.transition_to_state(SystemState.IDLE, force=True)
            
            # Reset external flags
            import config
            config.recording_in_progress = False
            config.active_request_count = 0
            for key in config.pipeline_stages:
                config.pipeline_stages[key] = False
            
            return current_state


# Global instance
_pipeline_orchestrator = None

def get_pipeline_orchestrator() -> PipelineOrchestrator:
    """Get the global pipeline orchestrator instance"""
    global _pipeline_orchestrator
    if _pipeline_orchestrator is None:
        _pipeline_orchestrator = PipelineOrchestrator()
    return _pipeline_orchestrator 