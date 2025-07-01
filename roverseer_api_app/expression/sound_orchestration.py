import time
import random
import hashlib
import threading
from gpiozero.tones import Tone

from config import TICK_TYPE, BUZZER_SOUND_EFFECTS

# Threading event to track when tunes are playing
tune_playing = threading.Event()


def is_buzzer_enabled():
    """Check if buzzer sound effects are enabled"""
    try:
        from config import get_config_value
        return get_config_value("buzzer_sound_effects", True)
    except:
        return True  # Default to enabled if config can't be read


# -------- ECHOMATRIX TONE FEEDBACK -------- #
def play_echomatrix_tone(note, value):
    """Play chromatic tone for personality trait adjustment feedback"""
    if not is_buzzer_enabled():
        return
        
    from embodiment.rainbow_interface import get_rainbow_driver
    rainbow = get_rainbow_driver()
    
    if rainbow and hasattr(rainbow, 'buzzer_manager'):
        try:
            # Chromatic note frequency mapping (Octave 4 base)
            note_frequencies = {
                'C': 261.63, 'C#': 277.18, 'D': 293.66, 'D#': 311.13,
                'E': 329.63, 'F': 349.23, 'F#': 369.99, 'G': 392.00,
                'G#': 415.30, 'A': 440.00, 'A#': 466.16, 'B': 493.88
            }
            
            if note not in note_frequencies:
                print(f"Unknown note: {note}")
                return
            
            # Map value (0-10) to octave range (2-6)
            base_octave = 2
            semitone_offset = max(0, min(5, int(value / 2)))  # Clamp to 0-5
            target_octave = base_octave + semitone_offset
            
            # Calculate frequency for target octave
            base_frequency = note_frequencies[note]
            target_frequency = base_frequency * pow(2, target_octave - 4)  # Octave 4 is reference
            
            # Create tone object with calculated frequency
            tone_obj = Tone(target_frequency)
            
            # Play tone with duration based on value (higher values = longer tones)
            duration = 0.2 + (value * 0.02)  # 0.2s to 0.4s duration
            
            # Single tone feedback
            rainbow.buzzer_manager.play_sequence_async([tone_obj], [duration], gaps=0.01)
            
            print(f"🎵 ECHOMATRIX: {note}{target_octave} ({target_frequency:.1f}Hz) - Value {value}")
                
        except Exception as e:
            print(f"Error playing ECHOMATRIX tone: {e}")


# -------- TUNE FUNCTIONS -------- #
def play_neural_training_start_tune(voice_name=None):
    """Play an ascending neural network activation tune when starting voice training"""
    if not is_buzzer_enabled():
        return
        
    from embodiment.rainbow_interface import get_rainbow_driver
    rainbow = get_rainbow_driver()
    
    if rainbow and hasattr(rainbow, 'buzzer_manager'):
        try:
            # Neural activation sequence - ascending pattern mimicking neural pathways
            base_notes = [
                Tone("C4"), Tone("D4"), Tone("F4"), Tone("G4"),
                Tone("A4"), Tone("C5"), Tone("D5"), Tone("F5")
            ]
            
            if voice_name:
                # Create voice-specific neural pattern
                voice_hash = hashlib.md5(voice_name.encode()).hexdigest()
                
                # Neural pathway activation sequence
                notes = []
                durations = []
                
                # Start with base neural activation
                notes.extend([Tone("C4"), Tone("E4"), Tone("G4")])
                durations.extend([0.12, 0.12, 0.15])
                
                # Voice-specific neural pattern (3-4 notes)
                for i in range(3):
                    char_val = ord(voice_hash[i % len(voice_hash)])
                    note_idx = char_val % len(base_notes)
                    notes.append(base_notes[note_idx])
                    # Accelerating pattern for neural excitement
                    duration = 0.15 - (i * 0.02)
                    durations.append(duration)
                
                # Final neural synthesis burst - ascending
                notes.extend([Tone("A4"), Tone("C5"), Tone("E5"), Tone("G5")])
                durations.extend([0.1, 0.12, 0.15, 0.4])
                
            else:
                # Default neural activation sequence
                notes = [
                    Tone("C4"), Tone("E4"), Tone("G4"), Tone("C5"),
                    Tone("E5"), Tone("G5"), Tone("C6")
                ]
                durations = [0.12, 0.12, 0.15, 0.15, 0.18, 0.2, 0.5]
            
            # Play the neural activation sequence
            rainbow.buzzer_manager.play_sequence_async(notes, durations, gaps=0.02)
                
        except Exception as e:
            print(f"Error playing neural training start tune: {e}")


def play_neural_training_status_tune():
    """Play a brief neural processing tune for training status checks"""
    if not is_buzzer_enabled():
        return
        
    from embodiment.rainbow_interface import get_rainbow_driver
    rainbow = get_rainbow_driver()
    
    if rainbow and hasattr(rainbow, 'buzzer_manager'):
        try:
            # Brief neural processing pulse - quick status check sound
            notes = [
                Tone("G4"), Tone("C5"), Tone("G4")  # Quick neural ping
            ]
            durations = [0.08, 0.12, 0.08]
            
            # Play the brief status check tune
            rainbow.buzzer_manager.play_sequence_async(notes, durations, gaps=0.02)
                
        except Exception as e:
            print(f"Error playing neural status tune: {e}")


def play_neural_training_complete_tune():
    """Play a triumphant neural synthesis completion tune"""
    if not is_buzzer_enabled():
        return
        
    from embodiment.rainbow_interface import get_rainbow_driver
    rainbow = get_rainbow_driver()
    
    if rainbow and hasattr(rainbow, 'buzzer_manager'):
        try:
            # Neural synthesis completion fanfare - triumphant and complex
            notes = [
                Tone("C4"), Tone("E4"), Tone("G4"), Tone("C5"),  # Building up
                Tone("E5"), Tone("G5"), Tone("C6"), Tone("E6"),  # Neural peak
                Tone("C6"), Tone("G5"), Tone("E5"), Tone("C5")   # Settling into completion
            ]
            durations = [
                0.1, 0.1, 0.12, 0.15,
                0.18, 0.2, 0.25, 0.3,
                0.15, 0.12, 0.1, 0.4
            ]
            
            # Play the neural completion fanfare
            rainbow.buzzer_manager.play_sequence_async(notes, durations, gaps=0.03)
                
        except Exception as e:
            print(f"Error playing neural training complete tune: {e}")


def play_neural_training_error_tune():
    """Play a descending neural disconnection tune for training errors"""
    if not is_buzzer_enabled():
        return
        
    from embodiment.rainbow_interface import get_rainbow_driver
    rainbow = get_rainbow_driver()
    
    if rainbow and hasattr(rainbow, 'buzzer_manager'):
        try:
            # Neural error/disconnection sequence - descending and diminishing
            notes = [
                Tone("G5"), Tone("F5"), Tone("D5"),
                Tone("C5"), Tone("A4"), Tone("F4"), Tone("C4")
            ]
            durations = [0.12, 0.12, 0.15, 0.15, 0.18, 0.2, 0.3]
            
            # Play the neural error sequence
            rainbow.buzzer_manager.play_sequence_async(notes, durations, gaps=0.05)
                
        except Exception as e:
            print(f"Error playing neural training error tune: {e}")


def play_startup_tune():
    """Play an ascending startup tune when the system initializes - welcoming and optimistic"""
    if not is_buzzer_enabled():
        return
        
    from embodiment.rainbow_interface import get_rainbow_driver
    rainbow = get_rainbow_driver()
    
    if rainbow and hasattr(rainbow, 'buzzer_manager'):
        try:
            # Ascending startup melody - welcoming and energetic
            # Uses pentatonic scale for pleasant harmony
            notes = [
                Tone("C4"),   # Start low and friendly
                Tone("D4"),   # Step up
                Tone("E4"),   # Continue ascending
                Tone("G4"),   # Skip to perfect fifth - sounds confident
                Tone("A4"),   # Keep rising
                Tone("C5"),   # Octave - feeling of completion
                Tone("D5"),   # A bit higher 
                Tone("G5")    # End on triumphant high note
            ]
            
            # Accelerating rhythm - starts slow, gets more excited
            durations = [0.2, 0.18, 0.16, 0.14, 0.12, 0.15, 0.12, 0.35]
            
            # Play the ascending startup melody
            rainbow.buzzer_manager.play_sequence_async(notes, durations, gaps=0.03)
                
        except Exception as e:
            print(f"Error playing startup tune: {e}")


def play_ollama_tune(model_name=None):
    """Play a curious ascending tune when starting Ollama requests - uses model name to guide composition"""
    if not is_buzzer_enabled():
        return
        
    from embodiment.rainbow_interface import get_rainbow_driver
    rainbow = get_rainbow_driver()
    
    if rainbow and hasattr(rainbow, 'buzzer_manager'):
        try:
            # Base notes palette
            base_notes = [
                Tone("C4"), Tone("D4"), Tone("E4"), Tone("F4"),
                Tone("G4"), Tone("A4"), Tone("B4"), Tone("C5"),
                Tone("D5"), Tone("E5"), Tone("F5"), Tone("G5")
            ]
            
            if model_name:
                # Extract just the model name part (before colon)
                model_base = model_name.split(':')[0] if ':' in model_name else model_name
                
                # Create a hash of the model name for consistent but unique patterns
                model_hash = hashlib.md5(model_base.encode()).hexdigest()
                
                # Generate a short, unique 3-5 note sequence based on hash
                notes = []
                durations = []
                
                # Use first 3-5 hex chars to generate notes
                num_notes = 3 + (ord(model_hash[0]) % 3)  # 3-5 notes
                
                for i in range(num_notes):
                    # Use hash chars to select notes
                    char_val = ord(model_hash[i % len(model_hash)])
                    note_idx = char_val % len(base_notes)
                    notes.append(base_notes[note_idx])
                    
                    # Vary duration based on position (0.08-0.15)
                    duration = 0.08 + (0.07 * (i / num_notes))
                    durations.append(duration)
                
                # Add a final rising note for "curiosity"
                final_note_idx = (ord(model_hash[-1]) % 4) + 8  # Higher notes
                notes.append(base_notes[min(final_note_idx, len(base_notes)-1)])
                durations.append(0.2)
                
            else:
                # Default short curious tune
                notes = [Tone("C4"), Tone("E4"), Tone("G4"), Tone("C5")]
                durations = [0.1, 0.1, 0.1, 0.2]
            
            # Play the generated tune
            rainbow.buzzer_manager.play_sequence_async(notes, durations, gaps=0.02)
                
        except Exception as e:
            print(f"Error playing Ollama tune: {e}")


def play_ollama_complete_tune():
    """Play a victorious tune when Ollama completes successfully"""
    if not is_buzzer_enabled():
        return
        
    from embodiment.rainbow_interface import get_rainbow_driver
    rainbow = get_rainbow_driver()
    
    if rainbow and hasattr(rainbow, 'buzzer_manager'):
        try:
            # Victorious fanfare - major chord arpeggio ending high
            notes = [Tone("C4"), Tone("E4"), Tone("G4"), Tone("C5"), Tone("E5"), Tone("G5")]
            durations = [0.1, 0.1, 0.1, 0.15, 0.15, 0.3]
            rainbow.buzzer_manager.play_sequence_async(notes, durations, gaps=0.02)
        except Exception as e:
            print(f"Error playing victory tune: {e}")


def play_transcribe_tune():
    """Play a puzzle-solving pattern for transcription requests"""
    if not is_buzzer_enabled():
        return
        
    from embodiment.rainbow_interface import get_rainbow_driver
    rainbow = get_rainbow_driver()
    
    if rainbow and hasattr(rainbow, 'buzzer_manager'):
        try:
            # Puzzle-solving tune - thoughtful, searching pattern
            notes = [Tone("D4"), Tone("G4"), Tone("F4"), Tone("A4"), Tone("G4")]
            durations = [0.2, 0.15, 0.15, 0.2, 0.25]
            rainbow.buzzer_manager.play_sequence_async(notes, durations, gaps=0.08)
        except Exception as e:
            print(f"Error playing transcribe tune: {e}")


def play_tts_tune(voice_name=None):
    """Play an announcing fanfare for TTS requests - unique tune based on voice model"""
    if not is_buzzer_enabled():
        return
        
    from embodiment.rainbow_interface import get_rainbow_driver
    rainbow = get_rainbow_driver()
    
    if rainbow and hasattr(rainbow, 'buzzer_manager'):
        try:
            # Base announcing notes palette
            base_notes = [
                Tone("C5"), Tone("D5"), Tone("E5"), Tone("F5"),
                Tone("G5"), Tone("A5"), Tone("B5"), Tone("C5")
            ]
            
            if voice_name:
                # Extract voice base name (remove file extensions if present)
                voice_base = voice_name.split('.')[0].split('-')[0]
                
                # Map characters to create voice-specific fanfare
                char_to_pattern = {
                    'a': [5, 3, 5, 7], 'b': [0, 2, 4, 6], 'c': [1, 3, 5, 7],
                    'd': [2, 4, 6, 0], 'e': [3, 5, 7, 1], 'f': [4, 6, 0, 2],
                    'g': [5, 7, 1, 3], 'h': [6, 0, 2, 4], 'i': [7, 1, 3, 5],
                    'j': [0, 3, 6, 1], 'k': [1, 4, 7, 2], 'l': [2, 5, 0, 3],
                    'm': [3, 6, 1, 4], 'n': [4, 7, 2, 5], 'o': [5, 0, 3, 6],
                    'p': [6, 1, 4, 7], 'q': [7, 2, 5, 0], 'r': [0, 4, 1, 5],
                    's': [1, 5, 2, 6], 't': [2, 6, 3, 7], 'u': [3, 7, 4, 0],
                    'v': [4, 0, 5, 1], 'w': [5, 1, 6, 2], 'x': [6, 2, 7, 3],
                    'y': [7, 3, 0, 4], 'z': [0, 5, 2, 7], '_': [0, 2, 4, 6]
                }
                
                notes = []
                durations = []
                
                # Start with attention-getting pattern
                notes.extend([Tone("G5"), Tone("G5"), Tone("E5")])
                durations.extend([0.1, 0.1, 0.15])
                
                # Generate voice-specific pattern
                voice_chars = voice_base.lower()[:6]  # Use first 6 characters
                for i, char in enumerate(voice_chars):
                    if char in char_to_pattern:
                        pattern = char_to_pattern[char]
                        note_index = pattern[i % len(pattern)]
                        notes.append(base_notes[note_index])
                        
                        if i % 2 == 0:
                            durations.append(0.15)
                        else:
                            durations.append(0.1)
                
                # Voice type endings
                if 'en' in voice_base:
                    notes.extend([Tone("C5"), Tone("E5"), Tone("G5"), Tone("C5")])
                    durations.extend([0.1, 0.1, 0.2, 0.4])
                elif 'gb' in voice_base.lower():
                    notes.extend([Tone("D5"), Tone("F5"), Tone("A5"), Tone("D5")])
                    durations.extend([0.1, 0.15, 0.2, 0.4])
                else:
                    notes.extend([Tone("E5"), Tone("G5"), Tone("B5"), Tone("E5")])
                    durations.extend([0.1, 0.15, 0.2, 0.4])
                    
            else:
                # Default announcing tune
                notes = [Tone("G5"), Tone("E5"), Tone("C5"), Tone("D5"), 
                        Tone("E5"), Tone("G5"), Tone("C5")]
                durations = [0.15, 0.1, 0.1, 0.15, 0.15, 0.2, 0.4]
            
            time.sleep(0.1)  # Small pause to separate from previous tune
            
            # Play the generated fanfare
            rainbow.buzzer_manager.play_sequence_async(notes, durations, gaps=0.03)
                
        except Exception as e:
            print(f"Error playing TTS tune: {e}")


def play_bicameral_connection_tune():
    """Play a unique connecting tune representing two hemispheres joining - three-part harmony"""
    if not is_buzzer_enabled():
        return
        
    from embodiment.rainbow_interface import get_rainbow_driver
    rainbow = get_rainbow_driver()
    
    if rainbow and hasattr(rainbow, 'buzzer_manager'):
        try:
            # Three-part tune representing:
            # 1. Left hemisphere (logical) - precise intervals
            # 2. Right hemisphere (creative) - flowing melody
            # 3. Convergence - harmony resolution
            
            # Part 1: Logical mind - mathematical intervals (perfect fourths and fifths)
            logical_notes = [Tone("C4"), Tone("F4"), Tone("C4"), Tone("G4")]
            logical_durations = [0.15, 0.15, 0.15, 0.2]
            
            # Part 2: Creative mind - flowing melodic line
            creative_notes = [Tone("E4"), Tone("G4"), Tone("B4"), Tone("A4"), 
                            Tone("G4"), Tone("E4")]
            creative_durations = [0.1, 0.1, 0.15, 0.15, 0.1, 0.2]
            
            # Part 3: Convergence - harmonious resolution combining both
            convergence_notes = [Tone("C4"), Tone("E4"), Tone("G4"), Tone("C5"),
                               Tone("G4"), Tone("E4"), Tone("C4")]
            convergence_durations = [0.1, 0.1, 0.1, 0.3, 0.15, 0.15, 0.4]
            
            # Play the three parts
            # Logical mind
            rainbow.buzzer_manager.play_sequence_async(logical_notes, logical_durations, gaps=0.02)
            
            time.sleep(0.1)  # Brief pause between sections
            
            # Creative mind
            rainbow.buzzer_manager.play_sequence_async(creative_notes, creative_durations, gaps=0.02)
            
            time.sleep(0.1)  # Brief pause before convergence
            
            # Convergence - final harmony
            rainbow.buzzer_manager.play_sequence_async(convergence_notes, convergence_durations, gaps=0.02)
                
        except Exception as e:
            print(f"Error playing bicameral connection tune: {e}")


# -------- BUTTON SOUND EFFECTS -------- #
def play_toggle_left_sound():
    """Play a descending sound for toggling left/previous"""
    if not is_buzzer_enabled():
        return
        
    from embodiment.rainbow_interface import get_rainbow_driver
    rainbow = get_rainbow_driver()
    
    if rainbow and hasattr(rainbow, 'buzzer_manager'):
        try:
            notes = [Tone("E5"), Tone("C5")]
            rainbow.buzzer_manager.play_sequence_async(notes, [0.1]*2, gaps=0.05)
        except Exception as e:
            print(f"Error playing toggle left sound: {e}")


def play_toggle_right_sound():
    """Play an ascending sound for toggling right/next"""
    if not is_buzzer_enabled():
        return
        
    from embodiment.rainbow_interface import get_rainbow_driver
    rainbow = get_rainbow_driver()
    
    if rainbow and hasattr(rainbow, 'buzzer_manager'):
        try:
            notes = [Tone("C5"), Tone("E5")]
            rainbow.buzzer_manager.play_sequence_async(notes, [0.1]*2, gaps=0.05)
        except Exception as e:
            print(f"Error playing toggle right sound: {e}")


def play_confirmation_sound():
    """Play a confirmation sound for recording start"""
    if not is_buzzer_enabled():
        return
        
    from embodiment.rainbow_interface import get_rainbow_driver
    rainbow = get_rainbow_driver()
    
    if rainbow and hasattr(rainbow, 'buzzer_manager'):
        try:
            # Two quick high beeps
            for _ in range(2):
                rainbow.buzzer_manager.play_sequence_async([Tone("A5")], [0.08]*2, gaps=0.05)
        except Exception as e:
            print(f"Error playing confirmation sound: {e}")


def play_recording_complete_sound():
    """Play a sound when recording completes"""
    if not is_buzzer_enabled():
        return
        
    from embodiment.rainbow_interface import get_rainbow_driver
    rainbow = get_rainbow_driver()
    
    if rainbow and hasattr(rainbow, 'buzzer_manager'):
        try:
            # Descending completion sound
            notes = [Tone("G5"), Tone("E5"), Tone("C5")]
            rainbow.buzzer_manager.play_sequence_async(notes, [0.08]*3, gaps=0.05)
        except Exception as e:
            print(f"Error playing recording complete sound: {e}")


def play_toggle_left_echo():
    """Play a quieter echo of the toggle left sound on release"""
    if not is_buzzer_enabled():
        return
        
    from embodiment.rainbow_interface import get_rainbow_driver
    rainbow = get_rainbow_driver()
    
    if rainbow and hasattr(rainbow, 'buzzer_manager'):
        try:
            notes = [Tone("E4")]  # One octave lower for echo
            rainbow.buzzer_manager.play_sequence_async(notes, [0.05]*len(notes), gaps=0.05)
        except Exception as e:
            print(f"Error playing toggle left echo: {e}")


def play_toggle_right_echo():
    """Play a quieter echo of the toggle right sound on release"""
    if not is_buzzer_enabled():
        return
        
    from embodiment.rainbow_interface import get_rainbow_driver
    rainbow = get_rainbow_driver()
    
    if rainbow and hasattr(rainbow, 'buzzer_manager'):
        try:
            notes = [Tone("C4")]  # One octave lower for echo
            rainbow.buzzer_manager.play_sequence_async(notes, [0.05]*len(notes), gaps=0.05)
        except Exception as e:
            print(f"Error playing toggle right echo: {e}")


def play_button_error_sound():
    """Play a 2-note error sound when button press is ignored (like 'eh oh')"""
    if not is_buzzer_enabled():
        return
        
    from embodiment.rainbow_interface import get_rainbow_driver
    rainbow = get_rainbow_driver()
    
    if rainbow and hasattr(rainbow, 'buzzer_manager'):
        try:
            # "Eh oh" sound - descending minor third interval
            # E4 to C#4 creates that "uh oh" feeling
            notes = [Tone("E4"), Tone("C#4")]
            durations = [0.12, 0.15]  # Second note slightly longer for emphasis
            rainbow.buzzer_manager.play_sequence_async(notes, durations, gaps=0.03)
        except Exception as e:
            print(f"Error playing button error sound: {e}")


# -------- SOUND PLAYBACK HELPER -------- #
def play_sound_async(sound_function, *args, **kwargs):
    """Queue a sound function to play asynchronously"""
    if not is_buzzer_enabled():
        return
        
    from embodiment.rainbow_interface import get_rainbow_driver
    rainbow = get_rainbow_driver()
    
    if rainbow and hasattr(rainbow, 'buzzer_manager'):
        # Queue the function to run on the buzzer thread
        rainbow.buzzer_manager.queue_function(sound_function, *args, **kwargs)


# -------- AUDIOCRAFT SYNTHESIS FUNCTIONS -------- #
def play_audiocraft_sound_start_tune():
    """Play an ascending auditory synthesis initiation tune for sound effects"""
    if not is_buzzer_enabled():
        return
        
    from embodiment.rainbow_interface import get_rainbow_driver
    rainbow = get_rainbow_driver()
    
    if rainbow and hasattr(rainbow, 'buzzer_manager'):
        try:
            # Sound effect synthesis - simple ascending triad
            notes = [Tone("A4"), Tone("C#5"), Tone("E5")]  # A major triad ascending
            durations = [0.15, 0.15, 0.2]
            
            # Play the auditory synthesis initiation
            rainbow.buzzer_manager.play_sequence_async(notes, durations, gaps=0.02)
                
        except Exception as e:
            print(f"Error playing AudioCraft sound start tune: {e}")


def play_audiocraft_sound_processing_tune():
    """Play a rhythmic processing pattern for sound effect synthesis"""
    if not is_buzzer_enabled():
        return
        
    from embodiment.rainbow_interface import get_rainbow_driver
    rainbow = get_rainbow_driver()
    
    if rainbow and hasattr(rainbow, 'buzzer_manager'):
        try:
            # Alternating pattern representing neural processing
            notes = [Tone("C5"), Tone("D5"), Tone("C5"), Tone("D5")]
            durations = [0.1, 0.1, 0.1, 0.1]
            
            # Play the processing pattern
            rainbow.buzzer_manager.play_sequence_async(notes, durations, gaps=0.02)
                
        except Exception as e:
            print(f"Error playing AudioCraft sound processing tune: {e}")


def play_audiocraft_sound_complete_tune():
    """Play a completion chord for successful sound effect synthesis"""
    if not is_buzzer_enabled():
        return
        
    from embodiment.rainbow_interface import get_rainbow_driver
    rainbow = get_rainbow_driver()
    
    if rainbow and hasattr(rainbow, 'buzzer_manager'):
        try:
            # Satisfying resolution - major chord
            notes = [Tone("E5"), Tone("G5"), Tone("A5")]
            durations = [0.2, 0.2, 0.4]
            
            # Play the completion chord
            rainbow.buzzer_manager.play_sequence_async(notes, durations, gaps=0.02)
                
        except Exception as e:
            print(f"Error playing AudioCraft sound complete tune: {e}")


def play_audiocraft_sound_error_tune():
    """Play a descending warning pattern for sound synthesis errors"""
    if not is_buzzer_enabled():
        return
        
    from embodiment.rainbow_interface import get_rainbow_driver
    rainbow = get_rainbow_driver()
    
    if rainbow and hasattr(rainbow, 'buzzer_manager'):
        try:
            # Descending warning - minor third intervals
            notes = [Tone("A3"), Tone("G3"), Tone("F3")]
            durations = [0.3, 0.3, 0.4]
            
            # Play the error warning
            rainbow.buzzer_manager.play_sequence_async(notes, durations, gaps=0.05)
                
        except Exception as e:
            print(f"Error playing AudioCraft sound error tune: {e}")


def play_audiocraft_music_start_tune():
    """Play a complex musical initiation sequence for music generation"""
    if not is_buzzer_enabled():
        return
        
    from embodiment.rainbow_interface import get_rainbow_driver
    rainbow = get_rainbow_driver()
    
    if rainbow and hasattr(rainbow, 'buzzer_manager'):
        try:
            # Musical synthesis - major chord progression (more complex than sound effects)
            notes = [
                Tone("C4"), Tone("E4"), Tone("G4"), 
                Tone("C5"), Tone("E5")
            ]
            durations = [0.12, 0.12, 0.12, 0.15, 0.25]
            
            # Play the musical synthesis initiation
            rainbow.buzzer_manager.play_sequence_async(notes, durations, gaps=0.02)
                
        except Exception as e:
            print(f"Error playing AudioCraft music start tune: {e}")


def play_audiocraft_music_processing_tune():
    """Play a melodic sequence representing musical consciousness processing"""
    if not is_buzzer_enabled():
        return
        
    from embodiment.rainbow_interface import get_rainbow_driver
    rainbow = get_rainbow_driver()
    
    if rainbow and hasattr(rainbow, 'buzzer_manager'):
        try:
            # Flowing melodic sequence - more notes than sound effects processing
            notes = [
                Tone("G4"), Tone("A4"), Tone("B4"), 
                Tone("A4"), Tone("G4"), Tone("F4")
            ]
            durations = [0.08, 0.08, 0.08, 0.08, 0.08, 0.12]
            
            # Play the musical processing sequence
            rainbow.buzzer_manager.play_sequence_async(notes, durations, gaps=0.02)
                
        except Exception as e:
            print(f"Error playing AudioCraft music processing tune: {e}")


def play_audiocraft_music_complete_tune():
    """Play a triumphant harmonic series for musical generation completion"""
    if not is_buzzer_enabled():
        return
        
    from embodiment.rainbow_interface import get_rainbow_driver
    rainbow = get_rainbow_driver()
    
    if rainbow and hasattr(rainbow, 'buzzer_manager'):
        try:
            # Ascending harmonic series - triumphant and musical
            notes = [
                Tone("C5"), Tone("E5"), Tone("G5"), 
                Tone("C6"), Tone("E6")
            ]
            durations = [0.15, 0.15, 0.2, 0.25, 0.5]
            
            # Play the musical completion fanfare
            rainbow.buzzer_manager.play_sequence_async(notes, durations, gaps=0.02)
                
        except Exception as e:
            print(f"Error playing AudioCraft music complete tune: {e}")


def play_audiocraft_music_error_tune():
    """Play a dissonant descending sequence for musical synthesis errors"""
    if not is_buzzer_enabled():
        return
        
    from embodiment.rainbow_interface import get_rainbow_driver
    rainbow = get_rainbow_driver()
    
    if rainbow and hasattr(rainbow, 'buzzer_manager'):
        try:
            # Diminished descent - dissonant and unsettling
            notes = [
                Tone("Bb4"), Tone("Ab4"), Tone("Gb4"), 
                Tone("Eb4"), Tone("Db4")
            ]
            durations = [0.2, 0.2, 0.25, 0.25, 0.4]
            
            # Play the musical error sequence
            rainbow.buzzer_manager.play_sequence_async(notes, durations, gaps=0.05)
                
        except Exception as e:
            print(f"Error playing AudioCraft music error tune: {e}")


def play_streaming_snippet_tone():
    """Play a brief tone to indicate a new streaming snippet is being spoken"""
    if not is_buzzer_enabled():
        return
        
    from embodiment.rainbow_interface import get_rainbow_driver
    rainbow = get_rainbow_driver()
    
    if rainbow and hasattr(rainbow, 'buzzer_manager'):
        try:
            # Short, subtle tone pattern to indicate snippet boundary
            notes = [Tone("F5"), Tone("A5")]
            durations = [0.05, 0.08]
            rainbow.buzzer_manager.play_sequence_async(notes, durations, gaps=0.02)
        except Exception as e:
            print(f"Error playing streaming snippet tone: {e}") 