"""
RoverSeer Controller - Main controller integrating all subsystems

This module provides the main controller that coordinates between the state machine,
animation controller, and sound orchestrator to manage the complete RoverSeer system.
"""

import logging
from typing import Optional
from .state_management import PipelineState, PipelineStateMachine
from .animation_controller import AnimationController
from expression.sound_orchestration import play_sound_async, play_startup_tune, play_confirmation_sound, play_recording_complete_sound

class RoverController:
    """Main controller integrating all subsystems"""
    
    def __init__(self, led_manager=None):
        self.pipeline = PipelineStateMachine()
        self.animation = AnimationController(led_manager) if led_manager else None
        
        # Register as observer for pipeline state changes
        self.pipeline.add_observer(self)
        
    def on_state_change(self, old_state: PipelineState, new_state: PipelineState):
        """Handle pipeline state changes"""
        try:
            # Update LED animations
            if self.animation:
                self.animation.set_animation(new_state)
            
            # Play appropriate sound effects
            self._handle_state_sound_effects(old_state, new_state)
            
            logging.info(f"Pipeline state changed: {old_state.name} -> {new_state.name}")
            
        except Exception as e:
            logging.error(f"Error handling state change: {e}")
            
    def _handle_state_sound_effects(self, old_state: PipelineState, new_state: PipelineState):
        """Play appropriate sound effects for state transitions"""
        # Map states to sound effects using available functions
        if new_state == PipelineState.LISTENING:
            play_sound_async(play_confirmation_sound)
        elif new_state == PipelineState.ERROR:
            # Use neural training error tune as error sound
            from expression.sound_orchestration import play_neural_training_error_tune
            play_sound_async(play_neural_training_error_tune)
        elif new_state == PipelineState.IDLE and old_state == PipelineState.LISTENING:
            play_sound_async(play_recording_complete_sound)
            
    def start_listening(self):
        """Start listening for input"""
        self.pipeline.transition_to(PipelineState.LISTENING)
        
    def stop_listening(self):
        """Stop listening and return to idle"""
        self.pipeline.transition_to(PipelineState.IDLE)
            
    def start_thinking(self):
        """Start LLM processing"""
        self.pipeline.transition_to(PipelineState.THINKING)
            
    def start_generating(self):
        """Start TTS generation"""
        self.pipeline.transition_to(PipelineState.GENERATING)
            
    def start_speaking(self, audio_file: str):
        """Start audio playback"""
        self.pipeline.transition_to(PipelineState.SPEAKING)
            
    def handle_error(self, error_msg: str):
        """Handle error condition"""
        logging.error(f"RoverSeer error: {error_msg}")
        self.pipeline.transition_to(PipelineState.ERROR)
            
    def reset(self):
        """Reset to idle state and cleanup all subsystems"""
        # Stop animations
        if self.animation:
            self.animation.stop_all()
            
        # Reset pipeline state last (this may trigger state change handlers)
        self.pipeline.transition_to(PipelineState.IDLE)
            
    def shutdown(self):
        """Clean shutdown of all subsystems"""
        try:
            self.reset()  # This will stop animations
            if self.animation:
                self.animation.stop_all()
            logging.info("RoverSeer controller shutdown complete")
        except Exception as e:
            logging.error(f"Error during shutdown: {e}")
        
    def is_busy(self) -> bool:
        """Check if system is currently busy"""
        return self.pipeline.is_busy() 