"""
Narrative Speech Manager

Manages speech synthesis and audio control for emergent narrative characters.
Integrates with the cognitive expression layer for authentic character vocalization.
"""

import time
import threading
from typing import Dict, List, Optional, Set
from datetime import datetime
import queue
from pathlib import Path

from expression.text_to_speech import speak_text, generate_tts_audio
from expression.sound_orchestration import play_sound_async
from helpers.logging_helper import LoggingHelper
from .models.narrative_models import Character, EmergentNarrative


class NarrativeSpeechManager:
    """
    Manages speech synthesis for emergent narrative characters.
    Provides conscious control over character vocalization.
    """
    
    def __init__(self):
        self.is_narrative_muted = False
        self.muted_characters: Set[str] = set()
        self.speaking_queue = queue.Queue()
        self.current_speaker: Optional[str] = None
        self.speech_thread: Optional[threading.Thread] = None
        self.stop_speech_event = threading.Event()
        self.speech_history: List[Dict] = []
        self.max_history_entries = 100
        
        # Initialize speech processing thread
        self._start_speech_processor()
    
    def _start_speech_processor(self) -> None:
        """Initialize the speech processing thread for queued utterances"""
        if self.speech_thread is None or not self.speech_thread.is_alive():
            self.speech_thread = threading.Thread(
                target=self._process_speech_queue,
                daemon=True,
                name="NarrativeSpeechProcessor"
            )
            self.speech_thread.start()
            LoggingHelper.log_info("🎭 Narrative speech processor awakened")
    
    def _process_speech_queue(self) -> None:
        """Process queued speech requests in order"""
        while not self.stop_speech_event.is_set():
            try:
                # Get speech request with timeout
                speech_request = self.speaking_queue.get(timeout=1.0)
                
                character_id = speech_request['character_id']
                text = speech_request['text']
                voice = speech_request['voice']
                metadata = speech_request.get('metadata', {})
                
                # Check if speaking is allowed
                if self._can_character_speak(character_id):
                    self.current_speaker = character_id
                    
                    try:
                        # Log speech attempt
                        LoggingHelper.log_info(
                            f"🎭 CHARACTER SPEECH | {speech_request.get('character_name', 'Unknown')} speaking"
                        )
                        
                        # Generate and play speech
                        speak_text(text, voice)
                        
                        # Record in speech history
                        self._record_speech_event(character_id, text, voice, metadata)
                        
                        LoggingHelper.log_info(
                            f"✅ CHARACTER SPEECH COMPLETE | {speech_request.get('character_name', 'Unknown')}"
                        )
                        
                    except Exception as e:
                        LoggingHelper.log_error(f"❌ Speech synthesis failed for character {character_id}: {e}")
                    
                    finally:
                        self.current_speaker = None
                else:
                    LoggingHelper.log_info(
                        f"🔇 CHARACTER MUTED | {speech_request.get('character_name', 'Unknown')} cannot speak"
                    )
                
                # Mark task as done
                self.speaking_queue.task_done()
                
            except queue.Empty:
                # Normal timeout, continue checking for stop event
                continue
            except Exception as e:
                LoggingHelper.log_error(f"Error in speech processing thread: {e}")
    
    def speak_character_dialogue(self, character: Character, text: str, 
                               priority: bool = False, metadata: Dict = None) -> bool:
        """
        Queue character dialogue for speech synthesis.
        
        Args:
            character: Character object with voice settings
            text: Text content to speak
            priority: Whether to prioritize this speech
            metadata: Additional context about the speech
            
        Returns:
            True if speech was queued, False if blocked
        """
        if not text or not text.strip():
            return False
        
        # Check global and character-specific muting
        if self.is_narrative_muted or character.id in self.muted_characters:
            LoggingHelper.log_info(f"🔇 Speech blocked for muted character: {character.name}")
            return False
        
        # Prepare speech request
        speech_request = {
            'character_id': character.id,
            'character_name': character.name,
            'text': text,
            'voice': character.voice or 'amy',  # Fallback to default voice
            'timestamp': datetime.now().isoformat(),
            'metadata': metadata or {}
        }
        
        # Queue or prioritize speech
        if priority:
            # For priority speech, we could implement a priority queue
            # For now, just add to front of regular queue
            temp_queue = queue.Queue()
            temp_queue.put(speech_request)
            
            # Move existing items to temp queue
            while not self.speaking_queue.empty():
                try:
                    item = self.speaking_queue.get_nowait()
                    temp_queue.put(item)
                except queue.Empty:
                    break
            
            # Replace speaking queue
            self.speaking_queue = temp_queue
        else:
            self.speaking_queue.put(speech_request)
        
        LoggingHelper.log_info(f"🎭 Speech queued for {character.name}: \"{text[:50]}{'...' if len(text) > 50 else ''}\"")
        return True
    
    def speak_narrator_text(self, text: str, voice: str = "narrator", 
                          metadata: Dict = None) -> bool:
        """
        Speak narrator text (scene descriptions, stage directions, etc.)
        
        Args:
            text: Narrator text to speak
            voice: Voice to use for narrator (defaults to "narrator")
            metadata: Additional context
            
        Returns:
            True if speech was queued, False if blocked
        """
        if self.is_narrative_muted:
            return False
        
        narrator_request = {
            'character_id': 'NARRATOR',
            'character_name': 'Narrator',
            'text': text,
            'voice': voice,
            'timestamp': datetime.now().isoformat(),
            'metadata': metadata or {}
        }
        
        self.speaking_queue.put(narrator_request)
        LoggingHelper.log_info(f"📖 Narrator speech queued: \"{text[:50]}{'...' if len(text) > 50 else ''}\"")
        return True
    
    def hush_all(self) -> None:
        """
        Silence all narrative speech (global mute).
        Stops current speech and prevents new speech.
        """
        self.is_narrative_muted = True
        self._interrupt_current_speech()
        self._clear_speech_queue()
        LoggingHelper.log_info("🔇 NARRATIVE HUSHED | All speech silenced")
    
    def hush_character(self, character_id: str) -> None:
        """
        Mute a specific character while allowing others to speak.
        
        Args:
            character_id: ID of character to mute
        """
        self.muted_characters.add(character_id)
        
        # If this character is currently speaking, interrupt them
        if self.current_speaker == character_id:
            self._interrupt_current_speech()
        
        LoggingHelper.log_info(f"🔇 Character muted: {character_id}")
    
    def unhush_all(self) -> None:
        """
        Restore speech for all characters (global unmute).
        """
        self.is_narrative_muted = False
        LoggingHelper.log_info("🔊 NARRATIVE SPEECH RESTORED | All characters can speak")
    
    def unhush_character(self, character_id: str) -> None:
        """
        Restore speech for a specific character.
        
        Args:
            character_id: ID of character to unmute
        """
        self.muted_characters.discard(character_id)
        LoggingHelper.log_info(f"🔊 Character speech restored: {character_id}")
    
    def toggle_character_speech(self, character_id: str) -> bool:
        """
        Toggle speech state for a character.
        
        Args:
            character_id: ID of character to toggle
            
        Returns:
            True if character is now able to speak, False if muted
        """
        if character_id in self.muted_characters:
            self.unhush_character(character_id)
            return True
        else:
            self.hush_character(character_id)
            return False
    
    def _can_character_speak(self, character_id: str) -> bool:
        """Check if a character is allowed to speak"""
        return not self.is_narrative_muted and character_id not in self.muted_characters
    
    def _interrupt_current_speech(self) -> None:
        """Interrupt any currently playing speech"""
        # This is a simplified implementation
        # In a more sophisticated system, we'd have direct control over audio playback
        LoggingHelper.log_info("⏹️ Interrupting current speech")
        
        # Clear current speaker
        self.current_speaker = None
    
    def _clear_speech_queue(self) -> None:
        """Clear all pending speech requests"""
        cleared_count = 0
        while not self.speaking_queue.empty():
            try:
                self.speaking_queue.get_nowait()
                cleared_count += 1
            except queue.Empty:
                break
        
        if cleared_count > 0:
            LoggingHelper.log_info(f"🗑️ Cleared {cleared_count} pending speech requests")
    
    def _record_speech_event(self, character_id: str, text: str, 
                           voice: str, metadata: Dict) -> None:
        """Record speech event in history"""
        speech_event = {
            'timestamp': datetime.now().isoformat(),
            'character_id': character_id,
            'text': text,
            'voice': voice,
            'metadata': metadata
        }
        
        self.speech_history.append(speech_event)
        
        # Trim history if too long
        if len(self.speech_history) > self.max_history_entries:
            self.speech_history = self.speech_history[-self.max_history_entries:]
    
    def get_speech_status(self) -> Dict:
        """
        Get current speech system status.
        
        Returns:
            Dictionary with speech system state
        """
        return {
            'narrative_muted': self.is_narrative_muted,
            'muted_characters': list(self.muted_characters),
            'current_speaker': self.current_speaker,
            'queue_size': self.speaking_queue.qsize(),
            'speech_thread_alive': self.speech_thread.is_alive() if self.speech_thread else False,
            'total_speech_events': len(self.speech_history)
        }
    
    def get_character_speech_history(self, character_id: str, limit: int = 10) -> List[Dict]:
        """
        Get recent speech history for a specific character.
        
        Args:
            character_id: ID of character
            limit: Maximum number of entries to return
            
        Returns:
            List of speech events for the character
        """
        character_events = [
            event for event in self.speech_history 
            if event['character_id'] == character_id
        ]
        return character_events[-limit:] if character_events else []
    
    def shutdown(self) -> None:
        """Gracefully shutdown the speech manager"""
        LoggingHelper.log_info("🛑 Shutting down narrative speech manager")
        
        # Stop the speech processing thread
        self.stop_speech_event.set()
        
        # Clear any pending speech
        self._clear_speech_queue()
        
        # Wait for thread to finish
        if self.speech_thread and self.speech_thread.is_alive():
            self.speech_thread.join(timeout=5.0)
        
        LoggingHelper.log_info("✅ Narrative speech manager shutdown complete")


# Global narrative speech manager instance
_narrative_speech_manager = None


def get_narrative_speech_manager() -> NarrativeSpeechManager:
    """Get or create the global narrative speech manager instance"""
    global _narrative_speech_manager
    if _narrative_speech_manager is None:
        _narrative_speech_manager = NarrativeSpeechManager()
    return _narrative_speech_manager


# Convenience functions for direct use
def speak_character_line(character: Character, text: str, priority: bool = False) -> bool:
    """
    Convenience function to make a character speak.
    
    Args:
        character: Character object
        text: What the character should say
        priority: Whether to prioritize this speech
        
    Returns:
        True if speech was queued successfully
    """
    manager = get_narrative_speech_manager()
    return manager.speak_character_dialogue(character, text, priority)


def hush_narrative() -> None:
    """Convenience function to silence all narrative speech"""
    manager = get_narrative_speech_manager()
    manager.hush_all()


def unhush_narrative() -> None:
    """Convenience function to restore all narrative speech"""
    manager = get_narrative_speech_manager()
    manager.unhush_all()


def hush_character_by_id(character_id: str) -> None:
    """Convenience function to mute a specific character"""
    manager = get_narrative_speech_manager()
    manager.hush_character(character_id)


def unhush_character_by_id(character_id: str) -> None:
    """Convenience function to unmute a specific character"""
    manager = get_narrative_speech_manager()
    manager.unhush_character(character_id) 