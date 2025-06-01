# Global rainbow driver instance
rainbow_driver = None

# Import config module directly to allow modification of its variables
import config
import time
import threading
import subprocess
import uuid
import os
import random

def get_rainbow_driver():
    """Get the global rainbow driver instance"""
    return rainbow_driver


def initialize_hardware():
    """Initialize the Rainbow HAT hardware interface"""
    global rainbow_driver
    
    try:
        # Import here to avoid issues if running without hardware
        import sys
        sys.path.insert(0, "/home/codemusic/custom_drivers")
        from rainbow_driver import RainbowDriver
        
        # Pass experimental features flag from config
        rainbow_driver = RainbowDriver(
            num_leds=7, 
            brightness=2, 
            use_experimental_strip=config.USE_EXPERIMENTAL_RAINBOW_STRIP
        )
        setup_button_handlers()
        print("✅ Rainbow HAT initialized successfully")
        
        # Play welcoming startup tune to indicate system is ready
        from expression.sound_orchestration import play_sound_async, play_startup_tune
        play_sound_async(play_startup_tune)
        
        return True
        
    except Exception as e:
        print(f"❌ Failed to initialize Rainbow HAT: {e}")
        rainbow_driver = None
        return False


def setup_button_handlers():
    """Setup button handlers for model selection and voice recording"""
    if not rainbow_driver:
        return
    
    from cognition.model_management import refresh_available_models
    from expression.sound_orchestration import play_sound_async
    from expression.sound_orchestration import (play_toggle_left_sound, play_toggle_right_sound,
                                               play_toggle_left_echo, play_toggle_right_echo,
                                               play_confirmation_sound, play_recording_complete_sound)
    from embodiment.display_manager import scroll_text_on_display, isScrolling, interrupt_scrolling, clear_display
    from memory.usage_logger import get_model_runtime
    from cognition.llm_interface import run_chat_completion
    from cognition.bicameral_mind import bicameral_chat_direct
    from expression.text_to_speech import find_voice_files, play_voice_intro, generate_tts_audio
    from perception.speech_recognition import transcribe_audio
    from utilities.text_processing import sanitize_for_speech, extract_short_model_name
    
    # Track which buttons are currently pressed
    buttons_pressed = {'A': False, 'B': False, 'C': False}
    clear_history_timer = None
    
    def is_system_busy():
        """Check if any pipeline stage is active"""
        # Check all active pipeline stages
        for stage, active in config.pipeline_stages.items():
            if active and stage.endswith('_active'):
                return True
        
        # Also check if recording is in progress
        if config.recording_in_progress:
            return True
            
        # Check if any active request is being processed
        if config.active_request_count > 0:
            return True
            
        return False
    
    def check_clear_history():
        """Check if all buttons are pressed to clear history"""
        nonlocal clear_history_timer
        
        if all(buttons_pressed.values()) and not config.recording_in_progress:
            # All buttons pressed - start timer
            if clear_history_timer is None:
                print("All buttons pressed - hold for 3 seconds to clear history")
                
                def clear_after_delay():
                    time.sleep(3)
                    if all(buttons_pressed.values()):  # Still all pressed
                        config.button_history.clear()
                        print("Button chat history cleared!")
                        
                        # Play confirmation sound - random 7-note tune
                        if rainbow_driver and hasattr(rainbow_driver, 'buzzer_manager'):
                            from gpiozero.tones import Tone
                            # Available notes for random selection
                            available_notes = [
                                Tone("C4"), Tone("D4"), Tone("E4"), Tone("F4"),
                                Tone("G4"), Tone("A4"), Tone("B4"), Tone("C5"),
                                Tone("D5"), Tone("E5"), Tone("F5"), Tone("G5")
                            ]
                            # Generate random 7-note sequence
                            random_notes = [random.choice(available_notes) for _ in range(7)]
                            random_durations = [random.uniform(0.08, 0.15) for _ in range(7)]
                            
                            # Play the random tune using buzzer manager
                            rainbow_driver.buzzer_manager.play_sequence_async(random_notes, random_durations, gaps=0.02)
                
                clear_history_timer = threading.Timer(3.0, clear_after_delay)
                clear_history_timer.start()
    
    def interrupt_audio_playback():
        """Interrupt any currently playing audio"""
        if config.current_audio_process and config.current_audio_process.poll() is None:
            # Audio is still playing, terminate it
            try:
                config.current_audio_process.terminate()
                config.current_audio_process.wait(timeout=1)
            except:
                try:
                    config.current_audio_process.kill()
                except:
                    pass
            
            # Reset pipeline since we interrupted
            reset_pipeline_stages()
            
            print("Audio playback interrupted")
            return True
        
        return False
    
    def handle_button_a():
        """Toggle to previous model"""
        buttons_pressed['A'] = True
        
        # Check if system is busy - ignore button press if so
        if is_system_busy():
            print("Button A ignored - system is busy")
            return
        
        # Check if we should interrupt audio
        if interrupt_audio_playback():
            return  # Just interrupt, don't do normal action
        
        check_clear_history()
        
        if not config.recording_in_progress and not all(buttons_pressed.values()):
            print(f"Button A pressed, recording_in_progress={config.recording_in_progress}")
            if rainbow_driver and hasattr(rainbow_driver, 'led_manager'):
                rainbow_driver.led_manager.set_led('A', True)  # LED on when pressed
            play_sound_async(play_toggle_left_sound)
            
            # Refresh models if we only have the default
            if len(config.available_models) == 1:
                refresh_available_models()
            
            # Cycle to previous model
            config.selected_model_index = (config.selected_model_index - 1) % len(config.available_models)
            
            # Interrupt any current scrolling
            if isScrolling:
                print("Interrupting scrolling for button A")
                interrupt_scrolling()
            
            # Clear display and show model index immediately
            clear_display()
            rainbow_driver.display_number(config.selected_model_index)
    
    def handle_button_a_release():
        """Handle button A release - show model name immediately"""
        buttons_pressed['A'] = False
        
        # Check if system is busy - don't show model info if so
        if is_system_busy():
            return
            
        if not config.recording_in_progress and not any(buttons_pressed.values()):
            if rainbow_driver and hasattr(rainbow_driver, 'led_manager'):
                rainbow_driver.led_manager.set_led('A', False)  # LED off when released
            play_sound_async(play_toggle_left_echo)
            
            # Start model info scroll immediately (no delay, no extra threading)
            if not buttons_pressed['A'] and not buttons_pressed['C']:  # Not pressing other buttons
                show_current_model_info()
    
    def handle_button_c():
        """Toggle to next model"""
        buttons_pressed['C'] = True
        
        # Check if system is busy - ignore button press if so
        if is_system_busy():
            print("Button C ignored - system is busy")
            return
        
        # Check if we should interrupt audio
        if interrupt_audio_playback():
            return  # Just interrupt, don't do normal action
        
        check_clear_history()
        
        if not config.recording_in_progress and not all(buttons_pressed.values()):
            if rainbow_driver and hasattr(rainbow_driver, 'led_manager'):
                rainbow_driver.led_manager.set_led('C', True)  # LED on when pressed
            play_sound_async(play_toggle_right_sound)
            
            # Refresh models if we only have the default
            if len(config.available_models) == 1:
                refresh_available_models()
            
            # Cycle to next model
            config.selected_model_index = (config.selected_model_index + 1) % len(config.available_models)
            
            # Interrupt any current scrolling
            if isScrolling:
                print("Interrupting scrolling for button C")
                interrupt_scrolling()
            
            # Clear display and show model index immediately
            clear_display()
            rainbow_driver.display_number(config.selected_model_index)
    
    def handle_button_c_release():
        """Handle button C release - show model name immediately"""
        buttons_pressed['C'] = False
        
        # Check if system is busy - don't show model info if so
        if is_system_busy():
            return
            
        if not config.recording_in_progress and not any(buttons_pressed.values()):
            if rainbow_driver and hasattr(rainbow_driver, 'led_manager'):
                rainbow_driver.led_manager.set_led('C', False)  # LED off when released
            play_sound_async(play_toggle_right_echo)
            
            # Start model info scroll immediately (no delay, no extra threading)
            if not buttons_pressed['A'] and not buttons_pressed['C']:  # Not pressing other buttons
                show_current_model_info()
    
    def handle_button_b():
        """Start recording on button press - LED solid while held"""
        buttons_pressed['B'] = True
        
        # Check if system is busy - ignore button press if so
        if is_system_busy():
            print("Button B ignored - system is busy")
            return
        
        # Check if we should interrupt audio
        if interrupt_audio_playback():
            return  # Just interrupt, don't do normal action
        
        check_clear_history()
        
        if config.recording_in_progress or all(buttons_pressed.values()):
            return  # Ignore if already recording or clearing history
        
        # LED solid on while button is held
        if rainbow_driver and hasattr(rainbow_driver, 'led_manager'):
            rainbow_driver.led_manager.set_led('B', True)
    
    def handle_button_b_release():
        """Start the recording pipeline on button release"""
        buttons_pressed['B'] = False
        
        # Check if system is busy - don't start recording if so
        if is_system_busy():
            # Turn off LED if it was on
            if rainbow_driver and hasattr(rainbow_driver, 'led_manager'):
                rainbow_driver.led_manager.set_led('B', False)
            return
        
        if config.recording_in_progress or all(buttons_pressed.values()):
            return  # Ignore if already recording or clearing history
        
        # Start recording pipeline in separate thread
        recording_thread = threading.Thread(target=recording_pipeline)
        recording_thread.daemon = True
        recording_thread.start()
    
    def show_current_model_info():
        """Display current model name"""
        # Display model name (scroll_text_on_display manages its own threading)
        full_model_name = config.available_models[config.selected_model_index]
        short_model_name = extract_short_model_name(full_model_name)
        model_name = short_model_name.split(':')[0]  # Remove version tag for display
        
        if model_name.lower() == "penphinmind":
            scroll_text_on_display("PenphinMind", scroll_speed=0.2)
        else:
            # Just display the model name without stats
            scroll_text_on_display(model_name, scroll_speed=0.2)
    
    def recording_pipeline():
        """Handle the complete recording -> transcription -> LLM -> TTS pipeline"""
        try:
            # Set recording flag
            config.recording_in_progress = True
            
            print(f"Starting recording pipeline with MIC_DEVICE: {config.MIC_DEVICE}")
            
            # Reset pipeline stages at start
            reset_pipeline_stages()
            
            # Play confirmation sound
            play_sound_async(play_confirmation_sound)
            
            # Record audio for 10 seconds
            temp_recording = f"/tmp/recording_{uuid.uuid4().hex}.wav"
            
            # Start LED blinking for recording using LED manager
            if rainbow_driver and hasattr(rainbow_driver, 'led_manager'):
                rainbow_driver.led_manager.blink_led('B')
            
            # Display countdown during recording  
            def show_countdown():
                if rainbow_driver:
                    rainbow_driver.show_countdown(10)
            
            # Start recording with arecord
            record_cmd = [
                'arecord',
                '-D', config.MIC_DEVICE,
                '-f', 'S16_LE',
                '-r', '16000',
                '-c', '1',
                '-d', '10',
                temp_recording
            ]
            
            print(f"Recording command: {' '.join(record_cmd)}")
            
            # Run recording and countdown in parallel
            record_process = subprocess.Popen(record_cmd, 
                                            stdout=subprocess.PIPE, 
                                            stderr=subprocess.PIPE)
            
            countdown_thread = threading.Thread(target=show_countdown)
            countdown_thread.start()
            
            # Wait for recording to complete
            return_code = record_process.wait()
            stdout, stderr = record_process.communicate()
            
            print(f"Recording completed with return code: {return_code}")
            if stdout:
                print(f"Recording stdout: {stdout.decode()}")
            if stderr:
                print(f"Recording stderr: {stderr.decode()}")
            
            countdown_thread.join()
            
            # Stop LED blinking
            if rainbow_driver:
                rainbow_driver.led_manager.stop_led('B')
            
            # Check if recording was successful
            if return_code != 0:
                print(f"Recording failed with return code {return_code}")
                if stderr:
                    print(f"Recording error: {stderr.decode()}")
                
                # Show error using new method
                if rainbow_driver:
                    rainbow_driver.show_error("REC ERR")
                return
            
            # Check if recording file exists and has content
            if not os.path.exists(temp_recording):
                print(f"Recording file {temp_recording} was not created")
                if rainbow_driver:
                    rainbow_driver.show_error("NO FILE")
                return
            
            file_size = os.path.getsize(temp_recording)
            print(f"Recording file size: {file_size} bytes")
            if file_size < 1000:  # Less than 1KB suggests no audio
                print("Recording file is too small, likely no audio captured")
                if rainbow_driver:
                    rainbow_driver.show_error("EMPTY")
                os.remove(temp_recording)
                return
            
            # Play recording complete sound
            play_sound_async(play_recording_complete_sound)
            
            # 1. Speech to Text - Start ASR LED
            start_system_processing('A')  # Red LED for ASR
            transcript = None
            try:
                transcript = transcribe_audio(temp_recording)
                os.remove(temp_recording)
                print(f"Transcription successful: {transcript[:50]}...")
            except Exception as e:
                print(f"Transcription error: {e}")
                transcript = "Hello, testing the system."
            
            # ASR complete, transition to LLM stage
            stop_system_processing()  # This marks ASR complete
            start_system_processing('B')  # Start LLM stage
            
            # Play voice intro before LLM processing
            voice = config.DEFAULT_VOICE
            play_sound_async(play_voice_intro, voice)
            
            # 2. Run LLM with selected model (will keep LED blinking)
            selected_model = config.available_models[config.selected_model_index]
            
            # Check if PenphinMind is selected
            if selected_model.lower() == "penphinmind":
                # Use bicameral_chat_direct function
                try:
                    reply = bicameral_chat_direct(transcript, voice=voice)
                except Exception as e:
                    reply = f"Bicameral processing error: {e}"
            else:
                # Normal single model flow
                # Build message history with model context
                messages = []
                
                # Add conversation history (including which model said what)
                for hist_user, hist_reply, hist_model in config.button_history[-config.MAX_BUTTON_HISTORY:]:
                    # Include model name in assistant messages for context
                    short_hist_model = extract_short_model_name(hist_model)
                    model_prefix = f"[{short_hist_model.split(':')[0]}]: " if hist_model != selected_model else ""
                    messages.append({"role": "user", "content": hist_user})
                    messages.append({"role": "assistant", "content": model_prefix + hist_reply})
                
                # Add current user message
                messages.append({"role": "user", "content": transcript})
                
                # System message that includes model switching context
                short_selected_model = extract_short_model_name(selected_model)
                
                # Get personality based on voice
                personality = config.get_personality_for_voice(voice, context="device")
                
                # Add model context to personality
                system_message = (
                    f"{personality} "
                    f"You are currently running as model '{short_selected_model.split(':')[0]}'. "
                    "Previous responses may be from different models, indicated by [model_name]: prefix. "
                    "You can reference what other models said if asked."
                )
                
                reply = run_chat_completion(selected_model, messages, system_message)
            
            # Save to button history
            config.button_history.append((transcript, reply, selected_model))
            
            # Keep only MAX_BUTTON_HISTORY * 2 exchanges as a buffer
            # This allows us to use the last MAX_BUTTON_HISTORY for context
            # while keeping some extra for reference
            while len(config.button_history) > config.MAX_BUTTON_HISTORY * 2:
                config.button_history.pop(0)
            
            print(f"Button chat history: {len(config.button_history)} exchanges")
            
            # 3. Text to Speech with default voice
            voice = config.DEFAULT_VOICE
            
            # Generate and play audio response
            tmp_wav = f"/tmp/{uuid.uuid4().hex}.wav"
            
            # LLM complete, transition to TTS stage
            stop_system_processing()  # This marks LLM complete
            start_system_processing('C')  # Start TTS stage
            
            # Sanitize text for speech
            clean_reply = sanitize_for_speech(reply)
            
            # Generate TTS
            output_file, tts_processing_time = generate_tts_audio(clean_reply, voice, tmp_wav)
            
            # TTS complete, transition to audio playback
            stop_system_processing()  # This marks TTS complete
            start_system_processing('aplay')
            
            # Play the audio response using Popen to make it interruptible
            config.current_audio_process = subprocess.Popen(
                ["aplay", "-D", config.AUDIO_DEVICE, tmp_wav],
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE
            )
            
            # Wait for playback to complete
            config.current_audio_process.wait()
            config.current_audio_process = None
            
            os.remove(tmp_wav)
            
            # All complete - stop resets everything
            stop_system_processing()

        except Exception as e:
            print(f"Error in recording pipeline: {e}")
            import traceback
            traceback.print_exc()
            
            # Log the error
            from memory.usage_logger import log_error
            log_error("recording_pipeline", str(e), {
                "voice": config.DEFAULT_VOICE,
                "model": config.available_models[config.selected_model_index] if config.available_models else "none",
                "traceback": traceback.format_exc()
            })
            
            # On error, reset everything
            reset_pipeline_stages()
            # Show error on display
            if rainbow_driver:
                rainbow_driver.show_error("ERROR")
        finally:
            # Reset recording flag
            config.recording_in_progress = False
            
            # Stop any LED animations
            if rainbow_driver and hasattr(rainbow_driver, 'led_manager'):
                rainbow_driver.led_manager.stop_led('B')
            
            # Clear display
            if rainbow_driver:
                rainbow_driver.clear_display()
            
            print("Recording pipeline complete, buttons re-enabled")
    
    # Setup button handlers with both press and release
    rainbow_driver.buttons['A'].when_pressed = handle_button_a
    rainbow_driver.buttons['A'].when_released = handle_button_a_release
    rainbow_driver.buttons['B'].when_pressed = handle_button_b
    rainbow_driver.buttons['B'].when_released = handle_button_b_release
    rainbow_driver.buttons['C'].when_pressed = handle_button_c
    rainbow_driver.buttons['C'].when_released = handle_button_c_release


# -------- LED PIPELINE MANAGEMENT -------- #

def reset_pipeline_stages():
    """Reset all pipeline stages to inactive"""
    # Reset pipeline flags
    for key in config.pipeline_stages:
        config.pipeline_stages[key] = False
        
    # Use LED manager to stop all LEDs
    if rainbow_driver and hasattr(rainbow_driver, 'led_manager'):
        rainbow_driver.led_manager.stop_all_leds()


def start_system_processing(led_color='B'):
    """Start the current blinking LED and mark stage as active"""
    if not rainbow_driver or not hasattr(rainbow_driver, 'led_manager'):
        return
        
    # Map old led_color to new stage names
    stage_map = {
        'A': 'asr',
        'B': 'llm', 
        'C': 'tts',
        'aplay': 'playing'
    }
    
    # Mark current active stage as active
    if led_color == 'A':  # ASR stage
        config.pipeline_stages['asr_active'] = True
        rainbow_driver.led_manager.show_progress('asr')
        
    elif led_color == 'B':  # LLM stage
        config.pipeline_stages['llm_active'] = True
        rainbow_driver.led_manager.show_progress('llm')
        
    elif led_color == 'C':  # TTS stage
        config.pipeline_stages['tts_active'] = True
        rainbow_driver.led_manager.show_progress('tts')
        
    elif led_color == 'aplay':  # Audio playback stage
        config.pipeline_stages['aplay_active'] = True
        rainbow_driver.led_manager.show_progress('playing')


def stop_system_processing():
    """Stop the current blinking LED and mark stage as complete"""
    if not rainbow_driver or not hasattr(rainbow_driver, 'led_manager'):
        return
        
    # Mark current active stage as complete and update display
    if config.pipeline_stages['asr_active']:
        config.pipeline_stages['asr_active'] = False
        config.pipeline_stages['asr_complete'] = True
        rainbow_driver.led_manager.show_progress('asr_complete')
            
    elif config.pipeline_stages['llm_active']:
        config.pipeline_stages['llm_active'] = False
        config.pipeline_stages['llm_complete'] = True
        rainbow_driver.led_manager.show_progress('llm_complete')
            
    elif config.pipeline_stages['tts_active']:
        config.pipeline_stages['tts_active'] = False
        config.pipeline_stages['tts_complete'] = True
        rainbow_driver.led_manager.show_progress('tts_complete')
            
    elif config.pipeline_stages['aplay_active']:
        # End of pipeline - reset everything
        reset_pipeline_stages()
        rainbow_driver.led_manager.show_progress('idle') 

# -------- EXPERIMENTAL RAINBOW STRIP HELPERS -------- #
# These functions provide direct access to rainbow strip features
# The driver will only execute them if use_experimental_strip=True

def show_rainbow_progress(progress, color=(0, 255, 0)):
    """Show progress bar on rainbow strip (requires experimental features)
    
    Args:
        progress: Float from 0.0 to 1.0
        color: RGB tuple for progress bar color
    """
    if rainbow_driver and rainbow_driver.use_experimental_strip:
        rainbow_driver.rainbow_strip_manager.show_progress_bar(progress, color)


def start_rainbow_cycle(speed=0.1):
    """Start rainbow animation (requires experimental features)
    
    Args:
        speed: Animation speed (seconds between updates)
    """
    if rainbow_driver and rainbow_driver.use_experimental_strip:
        rainbow_driver.rainbow_strip_manager.rainbow_cycle(speed)


def pulse_rainbow_color(color, speed=0.05):
    """Pulse all rainbow LEDs with a color (requires experimental features)
    
    Args:
        color: RGB tuple
        speed: Pulse speed
    """
    if rainbow_driver and rainbow_driver.use_experimental_strip:
        rainbow_driver.rainbow_strip_manager.pulse_color(color, speed)


def stop_rainbow_animation():
    """Stop any running rainbow animation (requires experimental features)"""
    if rainbow_driver and rainbow_driver.use_experimental_strip:
        rainbow_driver.rainbow_strip_manager.stop_animation()


def celebrate_with_rainbow():
    """Alternative celebration with only rainbow effects (requires experimental features)"""
    if rainbow_driver and rainbow_driver.use_experimental_strip:
        # Just the rainbow effect without display/button LEDs
        rainbow_driver.rainbow_strip_manager.rainbow_cycle(speed=0.05)
        time.sleep(2)
        rainbow_driver.rainbow_strip_manager.clear() 