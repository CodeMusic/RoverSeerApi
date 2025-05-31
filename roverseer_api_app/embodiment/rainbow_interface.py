# Global rainbow driver instance
rainbow_driver = None

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
        
        rainbow_driver = RainbowDriver(num_leds=7, brightness=2)
        setup_button_handlers()
        print("✅ Rainbow HAT initialized successfully")
        return True
        
    except Exception as e:
        print(f"❌ Failed to initialize Rainbow HAT: {e}")
        rainbow_driver = None
        return False


def setup_button_handlers():
    """Setup button handlers for model selection and voice recording"""
    if not rainbow_driver:
        return
    
    from config import (available_models, selected_model_index, recording_in_progress, 
                       button_history, MAX_BUTTON_HISTORY, current_audio_process, 
                       pipeline_stages, MIC_DEVICE, AUDIO_DEVICE, DEFAULT_VOICE)
    from cognition.model_management import refresh_available_models
    from expression.sound_orchestration import play_sound_async, sound_queue
    from expression.sound_orchestration import (play_toggle_left_sound, play_toggle_right_sound,
                                               play_toggle_left_echo, play_toggle_right_echo,
                                               play_confirmation_sound, play_recording_complete_sound)
    from embodiment.display_manager import scroll_text_on_display, isScrolling
    from memory.usage_logger import get_model_runtime
    from cognition.llm_interface import run_chat_completion
    from cognition.bicameral_mind import bicameral_chat_direct
    from expression.text_to_speech import find_voice_files, play_voice_intro, generate_tts_audio
    from perception.speech_recognition import transcribe_audio
    from utilities.text_processing import sanitize_for_speech
    import threading
    import time
    import subprocess
    import uuid
    import os
    import random
    
    # Track which buttons are currently pressed
    buttons_pressed = {'A': False, 'B': False, 'C': False}
    clear_history_timer = None
    
    def check_clear_history():
        """Check if all buttons are pressed to clear history"""
        nonlocal clear_history_timer
        
        if all(buttons_pressed.values()) and not recording_in_progress:
            # All buttons pressed - start timer
            if clear_history_timer is None:
                print("All buttons pressed - hold for 3 seconds to clear history")
                
                def clear_after_delay():
                    time.sleep(3)
                    if all(buttons_pressed.values()):  # Still all pressed
                        button_history.clear()
                        print("Button chat history cleared!")
                        
                        # Play confirmation sound - random 7-note tune
                        if rainbow_driver and hasattr(rainbow_driver, 'buzzer'):
                            from gpiozero.tones import Tone
                            # Available notes for random selection
                            available_notes = [
                                Tone("C4"), Tone("D4"), Tone("E4"), Tone("F4"),
                                Tone("G4"), Tone("A4"), Tone("B4"), Tone("C5"),
                                Tone("D5"), Tone("E5"), Tone("F5"), Tone("G5")
                            ]
                            # Generate random 7-note sequence
                            random_notes = [random.choice(available_notes) for _ in range(7)]
                            
                            # Play the random tune
                            for note in random_notes:
                                rainbow_driver.buzzer.play(note)
                                time.sleep(random.uniform(0.08, 0.15))  # Vary timing too
                                rainbow_driver.buzzer.stop()
                                time.sleep(0.02)
                        
                        # Flash all LEDs
                        for _ in range(3):
                            for led in ['A', 'B', 'C']:
                                rainbow_driver.button_leds[led].on()
                            time.sleep(0.2)
                            for led in ['A', 'B', 'C']:
                                rainbow_driver.button_leds[led].off()
                            time.sleep(0.2)
                
                clear_history_timer = threading.Thread(target=clear_after_delay)
                clear_history_timer.daemon = True
                clear_history_timer.start()
    
    def interrupt_audio_playback():
        """Interrupt any currently playing audio"""
        if current_audio_process and current_audio_process.poll() is None:
            # Audio is still playing, terminate it
            try:
                current_audio_process.terminate()
                current_audio_process.wait(timeout=1)
            except:
                try:
                    current_audio_process.kill()
                except:
                    pass
            
            # Reset pipeline since we interrupted
            reset_pipeline_stages()
            
            # Clear the sound queue to prevent queued sounds from playing
            while not sound_queue.empty():
                try:
                    sound_queue.get_nowait()
                except:
                    break
            
            print("Audio playback interrupted")
            return True
        
        return False
    
    def handle_button_a():
        """Toggle to previous model"""
        buttons_pressed['A'] = True
        
        # Check if we should interrupt audio
        if interrupt_audio_playback():
            return  # Just interrupt, don't do normal action
        
        check_clear_history()
        
        if not recording_in_progress and not all(buttons_pressed.values()):
            print(f"Button A pressed, recording_in_progress={recording_in_progress}")
            rainbow_driver.button_leds['A'].on()  # LED on when pressed
            play_sound_async(play_toggle_left_sound)
            
            # Refresh models if we only have the default
            if len(available_models) == 1:
                refresh_available_models()
            
            # Cycle to previous model
            selected_model_index = (selected_model_index - 1) % len(available_models)
            
            # Display model name briefly
            model_name = available_models[selected_model_index].split(':')[0]
            if model_name.lower() == "penphinmind":
                scroll_text_on_display("PenphinMind", scroll_speed=0.2)
            else:
                # Get runtime info
                avg_runtime = get_model_runtime(available_models[selected_model_index])
                if avg_runtime:
                    display_text = f"{model_name} {avg_runtime:.1f}s"
                else:
                    display_text = model_name
                scroll_text_on_display(display_text, scroll_speed=0.2)
            
            # Show model index after scrolling
            while isScrolling:
                time.sleep(0.1)
            
            rainbow_driver.display_number(selected_model_index)
    
    def handle_button_a_release():
        """Handle button A release"""
        buttons_pressed['A'] = False
        if not recording_in_progress and not any(buttons_pressed.values()):
            rainbow_driver.button_leds['A'].off()  # LED off when released
            play_sound_async(play_toggle_left_echo)
    
    def handle_button_c():
        """Toggle to next model"""
        buttons_pressed['C'] = True
        
        # Check if we should interrupt audio
        if interrupt_audio_playback():
            return  # Just interrupt, don't do normal action
        
        check_clear_history()
        
        if not recording_in_progress and not all(buttons_pressed.values()):
            rainbow_driver.button_leds['C'].on()  # LED on when pressed
            play_sound_async(play_toggle_right_sound)
            
            # Refresh models if we only have the default
            if len(available_models) == 1:
                refresh_available_models()
            
            # Cycle to next model
            selected_model_index = (selected_model_index + 1) % len(available_models)
            
            # Display model name briefly
            model_name = available_models[selected_model_index].split(':')[0]
            if model_name.lower() == "penphinmind":
                scroll_text_on_display("PenphinMind", scroll_speed=0.2)
            else:
                # Get runtime info
                avg_runtime = get_model_runtime(available_models[selected_model_index])
                if avg_runtime:
                    display_text = f"{model_name} {avg_runtime:.1f}s"
                else:
                    display_text = model_name
                scroll_text_on_display(display_text, scroll_speed=0.2)
            
            # Show model index after scrolling
            while isScrolling:
                time.sleep(0.1)
            
            rainbow_driver.display_number(selected_model_index)
    
    def handle_button_c_release():
        """Handle button C release"""
        buttons_pressed['C'] = False
        if not recording_in_progress and not any(buttons_pressed.values()):
            rainbow_driver.button_leds['C'].off()  # LED off when released
            play_sound_async(play_toggle_right_echo)
    
    def handle_button_b():
        """Start recording on button press - LED solid while held"""
        buttons_pressed['B'] = True
        
        # Check if we should interrupt audio
        if interrupt_audio_playback():
            return  # Just interrupt, don't do normal action
        
        check_clear_history()
        
        if recording_in_progress or all(buttons_pressed.values()):
            return  # Ignore if already recording or clearing history
        
        # LED solid on while button is held
        rainbow_driver.button_leds['B'].on()
    
    def handle_button_b_release():
        """Start the recording pipeline on button release"""
        buttons_pressed['B'] = False
        
        if recording_in_progress or all(buttons_pressed.values()):
            return  # Ignore if already recording or clearing history
        
        # Start recording pipeline in separate thread
        recording_thread = threading.Thread(target=recording_pipeline)
        recording_thread.daemon = True
        recording_thread.start()
    
    def recording_pipeline():
        """Handle the complete recording -> transcription -> LLM -> TTS pipeline"""
        try:
            # Import all needed dependencies
            from config import recording_in_progress, current_audio_process
            
            # Set recording flag
            recording_in_progress = True
            
            print(f"Starting recording pipeline with MIC_DEVICE: {MIC_DEVICE}")
            
            # Reset pipeline stages at start
            reset_pipeline_stages()
            
            # Play confirmation sound
            play_sound_async(play_confirmation_sound)
            
            # Record audio for 10 seconds
            temp_recording = f"/tmp/recording_{uuid.uuid4().hex}.wav"
            
            # Start LED blinking for recording (Button B)
            recording_led_blink = threading.Event()
            
            def blink_recording_led():
                """Blink button B LED during recording"""
                while not recording_led_blink.is_set():
                    if rainbow_driver:
                        rainbow_driver.button_leds['B'].on()
                    time.sleep(0.3)
                    if not recording_led_blink.is_set() and rainbow_driver:
                        rainbow_driver.button_leds['B'].off()
                    time.sleep(0.3)
            
            blink_thread = threading.Thread(target=blink_recording_led)
            blink_thread.daemon = True
            blink_thread.start()
            
            # Display countdown during recording
            def show_countdown():
                for i in range(10, 0, -1):
                    if rainbow_driver:
                        rainbow_driver.display_number(i)
                    time.sleep(1)
            
            # Start recording with arecord
            record_cmd = [
                'arecord',
                '-D', MIC_DEVICE,
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
            recording_led_blink.set()
            blink_thread.join(timeout=1)
            
            # Turn off button B LED
            if rainbow_driver:
                rainbow_driver.button_leds['B'].off()
            
            # Check if recording was successful
            if return_code != 0:
                print(f"Recording failed with return code {return_code}")
                if stderr:
                    print(f"Recording error: {stderr.decode()}")
                
                # Clear display and show error
                if rainbow_driver:
                    from embodiment.display_manager import clear_display
                    clear_display()
                    scroll_text_on_display("REC ERR", scroll_speed=0.3)
                    time.sleep(2)
                    clear_display()
                return
            
            # Check if recording file exists and has content
            if not os.path.exists(temp_recording):
                print(f"Recording file {temp_recording} was not created")
                if rainbow_driver:
                    from embodiment.display_manager import clear_display
                    clear_display()
                    scroll_text_on_display("NO FILE", scroll_speed=0.3)
                    time.sleep(2)
                    clear_display()
                return
            
            file_size = os.path.getsize(temp_recording)
            print(f"Recording file size: {file_size} bytes")
            if file_size < 1000:  # Less than 1KB suggests no audio
                print("Recording file is too small, likely no audio captured")
                if rainbow_driver:
                    from embodiment.display_manager import clear_display
                    clear_display()
                    scroll_text_on_display("EMPTY", scroll_speed=0.3)
                    time.sleep(2)
                    clear_display()
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
            voice = DEFAULT_VOICE
            play_sound_async(play_voice_intro, voice)
            
            # 2. Run LLM with selected model (will keep LED blinking)
            selected_model = available_models[selected_model_index]
            
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
                for hist_user, hist_reply, hist_model in button_history[-MAX_BUTTON_HISTORY:]:
                    # Include model name in assistant messages for context
                    model_prefix = f"[{hist_model.split(':')[0]}]: " if hist_model != selected_model else ""
                    messages.append({"role": "user", "content": hist_user})
                    messages.append({"role": "assistant", "content": model_prefix + hist_reply})
                
                # Add current user message
                messages.append({"role": "user", "content": transcript})
                
                # System message that includes model switching context
                system_message = (
                    "You are RoverSeer, a helpful voice assistant. Keep responses concise and conversational. "
                    f"You are currently running as model '{selected_model.split(':')[0]}'. "
                    "Previous responses may be from different models, indicated by [model_name]: prefix. "
                    "You can reference what other models said if asked."
                )
                
                reply = run_chat_completion(selected_model, messages, system_message)
            
            # Save to button history
            button_history.append((transcript, reply, selected_model))
            if len(button_history) > MAX_BUTTON_HISTORY * 2:  # Keep some buffer
                button_history.pop(0)
            
            print(f"Button chat history: {len(button_history)} exchanges")
            
            # 3. Text to Speech with default voice
            voice = DEFAULT_VOICE
            
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
            current_audio_process = subprocess.Popen(
                ["aplay", "-D", AUDIO_DEVICE, tmp_wav],
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE
            )
            
            # Wait for playback to complete
            current_audio_process.wait()
            current_audio_process = None
            
            os.remove(tmp_wav)
            
            # All complete - stop resets everything
            stop_system_processing()

        except Exception as e:
            print(f"Error in recording pipeline: {e}")
            import traceback
            traceback.print_exc()
            # On error, reset everything
            reset_pipeline_stages()
            # Show error on display
            if rainbow_driver:
                from embodiment.display_manager import clear_display
                clear_display()
                scroll_text_on_display("ERROR", scroll_speed=0.3)
                time.sleep(2)
                clear_display()
        finally:
            # Reset recording flag
            recording_in_progress = False
            
            # Make sure LED blinking is stopped
            if 'recording_led_blink' in locals():
                recording_led_blink.set()
            if 'blink_thread' in locals() and blink_thread.is_alive():
                blink_thread.join(timeout=1)
            
            # Turn off button B LED
            if rainbow_driver:
                rainbow_driver.button_leds['B'].off()
            
            # Clear display
            if rainbow_driver:
                from embodiment.display_manager import clear_display
                clear_display()
            
            print("Recording pipeline complete, buttons re-enabled")
    
    # Setup button handlers with both press and release
    rainbow_driver.buttons['A'].when_pressed = handle_button_a
    rainbow_driver.buttons['A'].when_released = handle_button_a_release
    rainbow_driver.buttons['B'].when_pressed = handle_button_b
    rainbow_driver.buttons['B'].when_released = handle_button_b_release
    rainbow_driver.buttons['C'].when_pressed = handle_button_c
    rainbow_driver.buttons['C'].when_released = handle_button_c_release


# -------- LED PIPELINE MANAGEMENT -------- #
def update_pipeline_leds():
    """Update LEDs based on current pipeline stage states"""
    if not rainbow_driver:
        return
    
    from config import pipeline_stages
    
    # Determine LED states based on pipeline progress
    if pipeline_stages['aplay_active']:
        # Audio playback: all LEDs should blink (handled by blink thread)
        return
    
    # Set solid LEDs based on completed stages
    if pipeline_stages['asr_complete']:
        rainbow_driver.button_leds['A'].on()  # Red solid
    else:
        rainbow_driver.button_leds['A'].off()
        
    if pipeline_stages['llm_complete']:
        rainbow_driver.button_leds['B'].on()  # Green solid
    else:
        rainbow_driver.button_leds['B'].off()
        
    if pipeline_stages['tts_complete']:
        rainbow_driver.button_leds['C'].on()  # Blue solid
    else:
        rainbow_driver.button_leds['C'].off()


def reset_pipeline_stages():
    """Reset all pipeline stages to inactive"""
    from config import pipeline_stages
    
    for key in pipeline_stages:
        pipeline_stages[key] = False
    # Turn off all LEDs
    if rainbow_driver:
        for led in ['A', 'B', 'C']:
            rainbow_driver.button_leds[led].off()


def blink_processing_led(led_color='B'):
    """Blink the appropriate LED during processing"""
    from config import system_processing, pipeline_stages
    
    # This will be called from a processing module
    # Implementation details moved to separate processing state management
    pass


def start_system_processing(led_color='B'):
    """Start the current blinking LED and mark stage as active"""
    from config import pipeline_stages, system_processing
    
    # Mark current active stage as active
    if led_color == 'A':
        pipeline_stages['asr_active'] = True
    elif led_color == 'B':
        pipeline_stages['llm_active'] = True
    elif led_color == 'C':
        pipeline_stages['tts_active'] = True
    elif led_color == 'aplay':
        pipeline_stages['aplay_active'] = True
    
    # System processing flag will be managed by calling module
    

def stop_system_processing():
    """Stop the current blinking LED and mark stage as complete"""
    from config import pipeline_stages
    
    # Mark current active stage as complete
    if pipeline_stages['asr_active']:
        pipeline_stages['asr_active'] = False
        pipeline_stages['asr_complete'] = True
    elif pipeline_stages['llm_active']:
        pipeline_stages['llm_active'] = False
        pipeline_stages['llm_complete'] = True
    elif pipeline_stages['tts_active']:
        pipeline_stages['tts_active'] = False
        pipeline_stages['tts_complete'] = True
    elif pipeline_stages['aplay_active']:
        # End of pipeline - reset everything
        reset_pipeline_stages()
        
    # Update LEDs to show current state
    update_pipeline_leds() 