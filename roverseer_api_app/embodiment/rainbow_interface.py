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
        
        # Initialize pipeline orchestrator after hardware is ready
        from embodiment.pipeline_orchestrator import get_pipeline_orchestrator
        orchestrator = get_pipeline_orchestrator()
        orchestrator._initialize_hardware_reference()  # Ensure it has the rainbow_driver reference
        
        # Play welcoming startup tune to indicate system is ready
        from expression.sound_orchestration import play_sound_async, play_startup_tune
        play_sound_async(play_startup_tune)
        
        # Refresh available models (including personalities) before re-sync
        from cognition.model_management import refresh_available_models
        print("🔄 Refreshing models and personalities list...")
        refresh_available_models()
        
        # Enhanced personality and voice synchronization after hardware init
        from cognition.personality import get_personality_manager
        personality_manager = get_personality_manager()
        
        print(f"🔍 Before re-sync: selected_model_index={config.selected_model_index}, available_models count={len(config.available_models)}")
        
        # Force reload current personality if none is loaded
        if not personality_manager.current_personality:
            print("⚠️  No current personality loaded, attempting to load default...")
            personality_manager._load_current_personality()
        
        if personality_manager.current_personality:
            print(f"🎯 Syncing device to personality: {personality_manager.current_personality.name}")
            
            # Ensure the personality's voice is set as default
            if personality_manager.current_personality.voice_id:
                from config import update_default_voice
                success = update_default_voice(personality_manager.current_personality.voice_id)
                if success:
                    print(f"✅ Default voice updated to: {personality_manager.current_personality.voice_id}")
                else:
                    print(f"⚠️  Failed to update default voice to: {personality_manager.current_personality.voice_id}")
            
            # Find and set the personality index
            personality_entry = f"PERSONALITY:{personality_manager.current_personality.name}"
            try:
                personality_index = config.available_models.index(personality_entry)
                config.selected_model_index = personality_index
                print(f"✅ Re-synced device to personality {personality_manager.current_personality.name} (index {personality_index})")
            except ValueError:
                print(f"⚠️  Current personality {personality_manager.current_personality.name} not found in device list")
                # List what personalities ARE available
                personality_entries = [m for m in config.available_models if m.startswith("PERSONALITY:")]
                print(f"   Available personalities: {personality_entries}")
                
                # If no personalities available but we have one loaded, try to use its model preference
                if personality_manager.current_personality.model_preference:
                    try:
                        model_index = config.available_models.index(personality_manager.current_personality.model_preference)
                        config.selected_model_index = model_index
                        print(f"✅ Fallback: Using personality's preferred model {personality_manager.current_personality.model_preference} (index {model_index})")
                    except ValueError:
                        print(f"⚠️  Personality's preferred model {personality_manager.current_personality.model_preference} not available")
        else:
            print("⚠️  No personality available after hardware initialization")
            # Set up a basic working state
            if config.available_models:
                config.selected_model_index = 0
                print(f"🔧 Fallback: Set to first available model: {config.available_models[0]}")
        
        print(f"🔍 After re-sync: selected_model_index={config.selected_model_index}")
        print(f"🔍 Current default voice: {config.DEFAULT_VOICE}")
        print(f"🔍 Current personality: {personality_manager.current_personality.name if personality_manager.current_personality else 'None'}")
        
        # Show current selection on startup
        from embodiment.display_manager import scroll_text_on_display
        from helpers.text_processing_helper import TextProcessingHelper
        
        # Longer delay for startup tune to play and system to settle
        time.sleep(1.5)
        
        config.DebugLog("Checking startup display - available_models: {}, selected_index: {}", 
                        len(config.available_models), config.selected_model_index)
        
        # Display current selection
        if config.available_models and 0 <= config.selected_model_index < len(config.available_models):
            current_selection = config.available_models[config.selected_model_index]
            
            config.DebugLog("Startup display - selected_model_index: {}", config.selected_model_index)
            config.DebugLog("Startup display - current_selection: {}", current_selection)
            config.DebugLog("Startup display - available_models count: {}", len(config.available_models))
            
            if current_selection.startswith("PERSONALITY:"):
                # It's a personality - show with emoji
                personality_name = current_selection[12:]
                config.DebugLog("Startup display - personality_name: {}", personality_name)
                
                # Get the personality to access emoji
                from cognition.personality import get_personality_manager
                manager = get_personality_manager()
                personality = manager.get_personality(personality_name)
                
                if personality:
                    # Show emoji and name
                    display_text = f"{personality.avatar_emoji} {personality.name}"
                    print(f"🎯 Showing default personality on startup: {display_text}")
                    scroll_text_on_display(display_text, scroll_speed=0.15)
                else:
                    print(f"🎯 Showing default selection on startup: {personality_name}")
                    scroll_text_on_display(personality_name, scroll_speed=0.15)
            else:
                # It's a regular model
                short_model_name = TextProcessingHelper.extract_short_model_name(current_selection)
                model_name = short_model_name.split(':')[0]
                
                if model_name.lower() == "penphinmind":
                    display_text = "PenphinMind"
                else:
                    display_text = model_name
                
                print(f"🎯 Showing default model on startup: {display_text}")
                scroll_text_on_display(display_text, scroll_speed=0.15)
        else:
            config.DebugLog("Startup display - invalid index or no models available")
            config.DebugLog("available_models: {}", config.available_models)
            config.DebugLog("selected_model_index: {}", config.selected_model_index)
        
        return True
        
    except Exception as e:
        print(f"❌ Failed to initialize Rainbow HAT: {e}")
        rainbow_driver = None
        return False


def setup_button_handlers():
    """Setup button handlers for model selection and voice recording"""
    if not rainbow_driver:
        return
    
    import threading
    import time
    
    from cognition.model_management import refresh_available_models
    from expression.sound_orchestration import play_sound_async
    from expression.sound_orchestration import (play_toggle_left_sound, play_toggle_right_sound,
                                               play_toggle_left_echo, play_toggle_right_echo,
                                               play_confirmation_sound, play_recording_complete_sound,
                                               play_button_error_sound)
    from embodiment.display_manager import scroll_text_on_display, isScrolling, interrupt_scrolling, clear_display
    from memory.usage_logger import get_model_runtime
    from cognition.llm_interface import run_chat_completion
    from cognition.bicameral_mind import bicameral_chat_direct
    from expression.text_to_speech import find_voice_files, play_voice_intro, generate_tts_audio
    from perception.speech_recognition import transcribe_audio
    from helpers.text_processing_helper import TextProcessingHelper
    from embodiment.pipeline_orchestrator import get_pipeline_orchestrator
    
    # Get pipeline orchestrator
    orchestrator = get_pipeline_orchestrator()
    
    # Track which buttons are currently pressed
    buttons_pressed = {'A': False, 'B': False, 'C': False}
    clear_history_timer = None
    
    def is_system_busy():
        """Check if button actions should be blocked - delegate to orchestrator"""
        # TEMPORARY FIX: Be more permissive to restore button functionality
        # Only block during actual processing, not stuck states
        current_state = orchestrator.get_current_state()
        
        # Force reset if we're in a stuck state without recording in progress
        if current_state.value != "idle" and not config.recording_in_progress:
            print(f"🔧 Force resetting stuck orchestrator state from {current_state.value} to idle")
            orchestrator.force_reset_to_idle()
        
        # Allow buttons during most states to prevent permanent blocking
        return current_state.value in ["processing_speech", "contemplating"] and config.recording_in_progress
    
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
                        
                        # Play confirmation sound using orchestrator
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
        """Interrupt any currently playing audio using orchestrator"""
        # Use orchestrator to handle interruption properly
        orchestrator.request_interruption()
        
        # Also check for external audio processes
        if config.current_audio_process and config.current_audio_process.poll() is None:
            try:
                config.current_audio_process.terminate()
                config.current_audio_process.wait(timeout=1)
            except:
                try:
                    config.current_audio_process.kill()
                except:
                    pass
            print("Audio playback interrupted")
            return True
        
        return False
    
    def handle_button_a():
        """Toggle to previous model"""
        buttons_pressed['A'] = True
        
        config.DebugLog("Button A pressed")
        
        # Check if system is busy using orchestrator
        if is_system_busy():
            print("Button A ignored - system is busy")
            play_sound_async(play_button_error_sound)
            return
        
        # Check if we should interrupt audio
        if interrupt_audio_playback():
            return  # Just interrupt, don't do normal action
        
        check_clear_history()
        
        if not config.recording_in_progress and not all(buttons_pressed.values()):
            print(f"Button A pressed, recording_in_progress={config.recording_in_progress}")
            # Use rainbow_driver's LED manager instead of direct calls
            if rainbow_driver and hasattr(rainbow_driver, 'button_led_manager'):
                rainbow_driver.button_led_manager.set_led('A', True)
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
            # Use rainbow_driver's LED manager instead of direct calls
            if rainbow_driver and hasattr(rainbow_driver, 'button_led_manager'):
                rainbow_driver.button_led_manager.set_led('A', False)
            play_sound_async(play_toggle_left_echo)
            
            # Start model info scroll immediately (no delay, no extra threading)
            if not buttons_pressed['A'] and not buttons_pressed['C']:  # Not pressing other buttons
                show_current_model_info()
    
    def handle_button_c():
        """Toggle to next model"""
        buttons_pressed['C'] = True
        
        # Check if system is busy using orchestrator
        if is_system_busy():
            print("Button C ignored - system is busy")
            play_sound_async(play_button_error_sound)
            return
        
        # Check if we should interrupt audio
        if interrupt_audio_playback():
            return  # Just interrupt, don't do normal action
        
        check_clear_history()
        
        if not config.recording_in_progress and not all(buttons_pressed.values()):
            # Use rainbow_driver's LED manager instead of direct calls
            if rainbow_driver and hasattr(rainbow_driver, 'button_led_manager'):
                rainbow_driver.button_led_manager.set_led('C', True)
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
            # Use rainbow_driver's LED manager instead of direct calls
            if rainbow_driver and hasattr(rainbow_driver, 'button_led_manager'):
                rainbow_driver.button_led_manager.set_led('C', False)
            play_sound_async(play_toggle_right_echo)
            
            # Start model info scroll immediately (no delay, no extra threading)
            if not buttons_pressed['A'] and not buttons_pressed['C']:  # Not pressing other buttons
                show_current_model_info()
    
    def handle_button_b():
        """Start recording on button press"""
        buttons_pressed['B'] = True
        
        # Check if system is busy using orchestrator
        if is_system_busy():
            print("Button B ignored - system is busy")
            play_sound_async(play_button_error_sound)
            return
        
        # Check if we should interrupt audio
        if interrupt_audio_playback():
            return  # Just interrupt, don't do normal action
        
        check_clear_history()
        
        if config.recording_in_progress or all(buttons_pressed.values()):
            return  # Ignore if already recording or clearing history
        
        # Use orchestrator to start the pipeline flow
        orchestrator.start_pipeline_flow("voice")
    
    def handle_button_b_release():
        """Start the recording pipeline on button release"""
        buttons_pressed['B'] = False
        
        config.DebugLog("Button B released")
        print("Button B released - starting checks...")
        
        # Check if recording should be blocked using orchestrator
        # TEMPORARY FIX: Be more permissive to restore functionality
        current_state = orchestrator.get_current_state()
        if current_state.value in ["processing_speech", "contemplating"] and config.recording_in_progress:
            config.DebugLog("Recording blocked in {} state", current_state.value)
            print(f"Button B: Recording blocked in {current_state.value} state")
            play_sound_async(play_button_error_sound)
            return

        if config.recording_in_progress:
            config.DebugLog("Recording already in progress ({})", config.recording_in_progress)
            print(f"Button B: Recording already in progress ({config.recording_in_progress})")
            play_sound_async(play_button_error_sound)
            return
            
        if all(buttons_pressed.values()):
            config.DebugLog("All buttons pressed - ignoring")
            print("Button B: All buttons pressed - ignoring")
            return
        
        config.DebugLog("Starting recording pipeline thread")
        print("Button B: All checks passed, starting recording pipeline...")
        
        # Start recording pipeline in separate thread
        recording_thread = threading.Thread(target=recording_pipeline)
        recording_thread.daemon = True
        recording_thread.start()
        print("Button B: Recording thread started")
    
    def show_current_model_info():
        """Display current model or personality name"""
        # Display model name (scroll_text_on_display manages its own threading)
        current_selection = config.available_models[config.selected_model_index]
        
        if current_selection.startswith("PERSONALITY:"):
            # It's a personality - show the name with emoji
            personality_name = current_selection[12:]  # Remove "PERSONALITY:" prefix
            
            # Get the personality to access emoji
            from cognition.personality import get_personality_manager
            manager = get_personality_manager()
            personality = manager.get_personality(personality_name)
            
            if personality:
                # Show emoji and name
                display_text = f"{personality.avatar_emoji} {personality.name}"
                scroll_text_on_display(display_text, scroll_speed=0.2)
            else:
                scroll_text_on_display(personality_name, scroll_speed=0.2)
        else:
            # It's a regular model
            short_model_name = TextProcessingHelper.extract_short_model_name(current_selection)
            model_name = short_model_name.split(':')[0]  # Remove version tag for display
            
            if model_name.lower() == "penphinmind":
                scroll_text_on_display("PenphinMind", scroll_speed=0.2)
            else:
                # Just display the model name without stats
                scroll_text_on_display(model_name, scroll_speed=0.2)
    
    def recording_pipeline():
        """Handle the complete recording -> transcription -> LLM -> TTS pipeline"""
        # Get orchestrator instance
        from embodiment.pipeline_orchestrator import get_pipeline_orchestrator, SystemState
        orchestrator = get_pipeline_orchestrator()
        
        try:
            # Set recording flag
            config.recording_in_progress = True
            
            print(f"Starting recording pipeline with MIC_DEVICE: {config.MIC_DEVICE}")
            config.DebugLog("Recording flag set to True")
            
            # We should already be in LISTENING state from button press
            # If not, transition to it now
            if orchestrator.get_current_state().value != "listening":
                orchestrator.transition_to_state(SystemState.LISTENING)
            
            # Play confirmation sound using orchestrator
            config.DebugLog("Playing confirmation sound")
            orchestrator.play_system_sound(play_confirmation_sound)
            
            # Record audio for 10 seconds
            temp_recording = f"/tmp/recording_{uuid.uuid4().hex}.wav"
            
            # Display countdown during recording  
            def show_countdown():
                if rainbow_driver:
                    config.DebugLog("Starting countdown display")
                    try:
                        rainbow_driver.show_countdown(10)
                        config.DebugLog("Countdown display completed")
                    except Exception as e:
                        config.DebugLog("Error in show_countdown: {}", e)
                        print(f"Error in show_countdown: {e}")
                        # Fallback - manual countdown
                        try:
                            for i in range(10, 0, -1):
                                rainbow_driver.display_number(i)
                                time.sleep(1)
                            rainbow_driver.clear_display()
                        except Exception as e2:
                            print(f"Error in fallback countdown: {e2}")
                else:
                    config.DebugLog("No rainbow_driver available for countdown")
            
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
            # This happens DURING the LISTENING state (green blink)
            record_process = subprocess.Popen(record_cmd, 
                                            stdout=subprocess.PIPE, 
                                            stderr=subprocess.PIPE)
            
            # Register the process with orchestrator for cleanup tracking
            orchestrator.register_audio_process(record_process)
            
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
            
            # Check if recording was successful
            if return_code != 0:
                print(f"Recording failed with return code {return_code}")
                if stderr:
                    print(f"Recording error: {stderr.decode()}")
                
                # Show error using new method
                if rainbow_driver:
                    rainbow_driver.show_error("REC ERR")
                
                # CRITICAL FIX: Request interruption to properly reset orchestrator state
                print("🔧 Requesting orchestrator interruption due to recording failure")
                orchestrator.request_interruption()
                return
            
            # Check if recording file exists and has content
            if not os.path.exists(temp_recording):
                print(f"Recording file {temp_recording} was not created")
                if rainbow_driver:
                    rainbow_driver.show_error("NO FILE")
                
                # CRITICAL FIX: Request interruption to properly reset orchestrator state
                print("🔧 Requesting orchestrator interruption due to missing recording file")
                orchestrator.request_interruption()
                return
            
            file_size = os.path.getsize(temp_recording)
            print(f"Recording file size: {file_size} bytes")
            if file_size < 1000:  # Less than 1KB suggests no audio
                print("Recording file is too small, likely no audio captured")
                if rainbow_driver:
                    rainbow_driver.show_error("EMPTY")
                os.remove(temp_recording)
                
                # CRITICAL FIX: Request interruption to properly reset orchestrator state
                print("🔧 Requesting orchestrator interruption due to empty recording")
                orchestrator.request_interruption()
                return
            
            # Play recording complete sound using orchestrator
            orchestrator.play_system_sound(play_recording_complete_sound)
            
            # NOW advance to speech processing (red blink) - recording is complete
            print("🔄 Recording complete, transitioning to speech processing (red blink)...")
            config.DebugLog("Transitioning from LISTENING to PROCESSING_SPEECH")
            
            try:
                current_state_before = orchestrator.get_current_state()
                print(f"📊 Current state before advance: {current_state_before.value}")
                
                orchestrator.advance_pipeline_flow()  # LISTENING -> PROCESSING_SPEECH
                
                current_state_after = orchestrator.get_current_state()
                print(f"📊 Current state after advance: {current_state_after.value}")
                
                if current_state_after.value == "processing_speech":
                    print("✅ Successfully transitioned to PROCESSING_SPEECH")
                else:
                    print(f"❌ Failed to transition - still in {current_state_after.value}")
                    
            except Exception as e:
                print(f"❌ Error during state transition: {e}")
                import traceback
                traceback.print_exc()
            
            # Brief delay to ensure LED state change is visible
            time.sleep(0.5)
            
            transcript = None
            try:
                print("🎤 Starting transcription with Whisper...")
                transcript = transcribe_audio(temp_recording)
                os.remove(temp_recording)
                print(f"✅ Transcription successful: {transcript[:50]}...")
            except Exception as e:
                print(f"❌ Transcription error: {e}")
                transcript = "Hello, testing the system."
            
            # ASR complete, transition to LLM stage
            print("🔄 Transcription complete, transitioning to LLM processing...")
            config.DebugLog("Transitioning from PROCESSING_SPEECH to CONTEMPLATING")
            
            try:
                current_state_before = orchestrator.get_current_state()
                print(f"📊 Current state before advance: {current_state_before.value}")
                
                orchestrator.advance_pipeline_flow()  # PROCESSING_SPEECH -> CONTEMPLATING
                
                current_state_after = orchestrator.get_current_state()
                print(f"📊 Current state after advance: {current_state_after.value}")
                
            except Exception as e:
                print(f"❌ Error during state transition: {e}")
                import traceback
                traceback.print_exc()
            
            # Get personality manager and determine voice/model
            from cognition.personality import get_personality_manager
            manager = get_personality_manager()
            
            # Check what's selected
            current_selection = config.available_models[config.selected_model_index]
            
            if current_selection.startswith("PERSONALITY:"):
                # A personality is selected - switch to it
                personality_name = current_selection[12:]  # Remove prefix
                
                if manager.switch_to(personality_name):
                    print(f"Device switched to personality: {personality_name}")
                    
                    # Update DEFAULT_VOICE to match
                    from config import update_default_voice
                    if manager.current_personality and manager.current_personality.voice_id:
                        update_default_voice(manager.current_personality.voice_id)
                    
                    # Use personality's voice and model
                    voice = manager.current_personality.voice_id
                    
                    # Use smart model selection based on total context size
                    # Calculate total context: current transcript + conversation history
                    context_tokens = len(transcript.split())  # Current input
                    
                    # Add conversation history tokens
                    for hist_user, hist_reply, _ in config.button_history[-config.MAX_BUTTON_HISTORY:]:
                        context_tokens += len(hist_user.split())
                        context_tokens += len(hist_reply.split())
                    
                    print(f"Total context tokens: {context_tokens}")
                    selected_model = manager.choose_model(max_tokens=context_tokens, default_model=config.DEFAULT_MODEL)
                    
                    # Verify the model exists in available models (not counting personality entries)
                    actual_models = [m for m in config.available_models if not m.startswith("PERSONALITY:")]
                    if selected_model not in actual_models:
                        print(f"⚠️  Selected model {selected_model} not available, using default")
                        selected_model = config.DEFAULT_MODEL
                    
                    print(f"Using personality voice: {voice}, selected model: {selected_model} (total context {context_tokens} tokens)")
                else:
                    print(f"Failed to switch to personality: {personality_name}")
                    voice = config.DEFAULT_VOICE
                    selected_model = config.DEFAULT_MODEL
            else:
                # A regular model is selected
                selected_model = current_selection
                
                # Use current personality's voice if available
                if manager.current_personality:
                    voice = manager.current_personality.voice_id
                    print(f"Using current personality's voice: {voice}")
                else:
                    voice = config.DEFAULT_VOICE
                    print("No current personality, using default voice")
            
            orchestrator.play_system_sound(play_voice_intro, voice)
            
            # 2. Run LLM with selected model
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
                    short_hist_model = TextProcessingHelper.extract_short_model_name(hist_model)
                    
                    # Extract personality name if it's a personality entry
                    if hist_model.startswith("PERSONALITY:"):
                        hist_personality_name = hist_model[12:]
                        model_prefix = f"[{hist_personality_name}]: "
                    else:
                        model_prefix = f"[{short_hist_model.split(':')[0]}]: " if hist_model != selected_model else ""
                    
                    messages.append({"role": "user", "content": hist_user})
                    messages.append({"role": "assistant", "content": model_prefix + hist_reply})
                
                # Add current user message
                messages.append({"role": "user", "content": transcript})
                
                # Get system message from personality manager
                # Generate system message with context
                short_selected_model = TextProcessingHelper.extract_short_model_name(selected_model)
                
                if manager.current_personality:
                    # Use personality's system message
                    context = {
                        "time_of_day": "day",  # Could be enhanced with actual time
                        "user_name": None,
                    }
                    system_message = manager.current_personality.generate_system_message(context)
                    print(f"Using system message from personality: {manager.current_personality.name}")
                else:
                    # Fallback to default
                    system_message = (
                        f"You are RoverSeer, a helpful voice assistant. "
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
            
            # Show appropriate display name in console log
            display_name = manager.get_display_name_for_model(selected_model)
            print(f"💬 Chat saved with {display_name} using {selected_model}")
            
            # 3. Text to Speech with personality's voice
            from cognition.personality import get_personality_manager
            manager = get_personality_manager()
            
            # Use personality's voice if available, otherwise use default
            if manager.current_personality and manager.current_personality.voice_id:
                voice = manager.current_personality.voice_id
            else:
                voice = config.DEFAULT_VOICE
            
            # Generate and play audio response
            tmp_wav = f"/tmp/{uuid.uuid4().hex}.wav"
            
            # LLM complete, transition to TTS stage
            orchestrator.advance_pipeline_flow()  # CONTEMPLATING -> SYNTHESIZING
            
            # Sanitize text for speech
            clean_reply = TextProcessingHelper.sanitize_for_speech(reply)
            
            # Generate TTS
            output_file, tts_processing_time = generate_tts_audio(clean_reply, voice, tmp_wav)
            
            # TTS complete, transition to audio playback
            orchestrator.advance_pipeline_flow()  # SYNTHESIZING -> EXPRESSING
            
            # Play the audio response using Popen to make it interruptible
            config.current_audio_process = subprocess.Popen(
                ["aplay", "-D", config.AUDIO_DEVICE, tmp_wav],
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE
            )
            
            # Register the process with orchestrator for cleanup tracking
            orchestrator.register_audio_process(config.current_audio_process)
            
            # CRITICAL FIX: Wait for playback with timeout and error handling
            try:
                # Wait for completion with timeout to prevent hanging
                return_code = config.current_audio_process.wait(timeout=30)  # 30 second timeout
                
                if return_code != 0:
                    # Audio process failed, get error details
                    stdout, stderr = config.current_audio_process.communicate()
                    print(f"Audio playback failed with return code {return_code}")
                    print(f"stderr: {stderr.decode() if stderr else 'No error output'}")
                    
                    # Try fallback audio device
                    print("Trying fallback audio device 'default'")
                    fallback_process = subprocess.Popen(
                        ["aplay", "-D", "default", tmp_wav],
                        stdout=subprocess.PIPE,
                        stderr=subprocess.PIPE
                    )
                    fallback_process.wait(timeout=15)  # Shorter timeout for fallback
                    
            except subprocess.TimeoutExpired:
                print("Audio playback timed out, terminating process")
                config.current_audio_process.terminate()
                try:
                    config.current_audio_process.wait(timeout=2)
                except subprocess.TimeoutExpired:
                    config.current_audio_process.kill()
                    config.current_audio_process.wait()
                    
            except Exception as audio_error:
                print(f"Audio playback error: {audio_error}")
                # Try to terminate the process
                try:
                    if config.current_audio_process and config.current_audio_process.poll() is None:
                        config.current_audio_process.terminate()
                        config.current_audio_process.wait(timeout=2)
                except:
                    pass
            
            finally:
                # Always clean up
                config.current_audio_process = None
            
            # Clean up temp file
            try:
                os.remove(tmp_wav)
            except:
                pass
            
            # All complete - return to idle
            orchestrator.complete_pipeline_flow()  # EXPRESSING -> IDLE

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
            
            # On error, interrupt the pipeline using orchestrator
            orchestrator.request_interruption()
            
            # Show more specific error on display based on error type
            if rainbow_driver:
                error_message = "ERROR"  # Default fallback
                
                # Categorize common errors for better user feedback
                error_str = str(e).lower()
                if "connection" in error_str or "network" in error_str:
                    error_message = "NET ERR"
                elif "timeout" in error_str:
                    error_message = "TIMEOUT"
                elif "model" in error_str or "ollama" in error_str:
                    error_message = "MODEL"
                elif "voice" in error_str or "tts" in error_str:
                    error_message = "VOICE"
                elif "transcrib" in error_str or "asr" in error_str:
                    error_message = "ASR ERR"
                elif "memory" in error_str or "allocation" in error_str:
                    error_message = "MEMORY"
                else:
                    # For debugging, show first 7 chars of error if it's short
                    if len(str(e)) <= 7:
                        error_message = str(e)[:7].upper()
                
                print(f"Displaying error: {error_message} (original: {e})")
                rainbow_driver.show_error(error_message)
                
                # Auto-clear error after 3 seconds
                def clear_error_display():
                    time.sleep(3)
                    try:
                        rainbow_driver.clear_display()
                    except:
                        pass
                
                error_clear_thread = threading.Thread(target=clear_error_display)
                error_clear_thread.daemon = True
                error_clear_thread.start()
        finally:
            # CRITICAL FIX: Reset recording flag FIRST to re-enable buttons immediately
            config.recording_in_progress = False
            print("🔧 CLEANUP: Recording flag reset to False")
            
            # ENHANCED FIX: Force orchestrator back to IDLE state with multiple fallback strategies
            try:
                current_state = orchestrator.get_current_state()
                print(f"🔧 CLEANUP: Current orchestrator state: {current_state.value}")
                
                if current_state.value != "idle" and current_state.value != "interrupted":
                    print(f"🔧 CLEANUP: Forcing orchestrator from {current_state.value} to IDLE")
                    
                    # Strategy 1: Try graceful completion
                    try:
                        orchestrator.complete_pipeline_flow()
                        print("🔧 CLEANUP: Graceful completion successful")
                    except Exception as graceful_error:
                        print(f"🔧 CLEANUP: Graceful completion failed: {graceful_error}")
                        
                        # Strategy 2: Try interruption request
                        try:
                            orchestrator.request_interruption()
                            print("🔧 CLEANUP: Interruption request sent")
                            
                            # Give it a moment to process
                            time.sleep(0.1)
                            
                            # Check if it worked
                            final_state = orchestrator.get_current_state()
                            if final_state.value not in ["idle", "interrupted"]:
                                print(f"🔧 CLEANUP: Still not idle after interruption ({final_state.value}), trying force reset")
                                
                                # Strategy 3: Force reset to idle (last resort)
                                if hasattr(orchestrator, 'force_reset_to_idle'):
                                    orchestrator.force_reset_to_idle()
                                    print("🔧 CLEANUP: Force reset completed")
                                else:
                                    print("🔧 CLEANUP: No force reset method available")
                            else:
                                print(f"🔧 CLEANUP: Successfully reached {final_state.value} state")
                                
                        except Exception as interrupt_error:
                            print(f"🔧 CLEANUP: Interruption request failed: {interrupt_error}")
                            print("🔧 CLEANUP: Will attempt hardware reset")
                            
                            # Strategy 4: Hardware-level cleanup (ultimate fallback)
                            try:
                                if rainbow_driver:
                                    rainbow_driver.clear_display()
                                    # Turn off all LEDs to visually indicate reset
                                    if hasattr(rainbow_driver, 'button_leds'):
                                        for led in rainbow_driver.button_leds.values():
                                            led.off()
                                print("🔧 CLEANUP: Hardware reset completed")
                            except Exception as hw_error:
                                print(f"🔧 CLEANUP: Hardware reset failed: {hw_error}")
                else:
                    print(f"🔧 CLEANUP: Orchestrator already in appropriate state: {current_state.value}")
                    
            except Exception as cleanup_error:
                print(f"🔧 CLEANUP ERROR: Failed to access orchestrator state: {cleanup_error}")
                print("🔧 CLEANUP: Recording flag still reset, buttons should work")
            
            # Clear display and ensure visual feedback of completion
            if rainbow_driver:
                try:
                    rainbow_driver.clear_display()
                    print("🔧 CLEANUP: Display cleared")
                except Exception as display_error:
                    print(f"🔧 CLEANUP: Display clear failed: {display_error}")
            
            print("🔧 CLEANUP COMPLETE: Recording pipeline cleanup finished, buttons re-enabled")
            config.DebugLog("Recording pipeline cleanup complete - recording_in_progress: {}", config.recording_in_progress)
    
    # Setup button handlers with both press and release
    # CRITICAL FIX: Assign our handlers AFTER a brief delay to override template handlers
    def assign_our_handlers():
        time.sleep(0.1)  # Brief delay to ensure driver's template handlers are set first
        print("🔧 Assigning sophisticated button handlers (overriding template handlers)")
        rainbow_driver.buttons['A'].when_pressed = handle_button_a
        rainbow_driver.buttons['A'].when_released = handle_button_a_release
        rainbow_driver.buttons['B'].when_pressed = handle_button_b
        rainbow_driver.buttons['B'].when_released = handle_button_b_release
        rainbow_driver.buttons['C'].when_pressed = handle_button_c
        rainbow_driver.buttons['C'].when_released = handle_button_c_release
        print("✅ Sophisticated button handlers assigned successfully")
    
    # Run handler assignment in a separate thread to avoid blocking initialization
    assignment_thread = threading.Thread(target=assign_our_handlers)
    assignment_thread.daemon = True
    assignment_thread.start()


# -------- LED PIPELINE MANAGEMENT -------- #
# 
# ARCHITECTURE OVERVIEW:
# This system uses a dual-LED approach for comprehensive user feedback:
#
# 1. RGB LEDs (Rainbow Strip Pixels 0-2):
#    - Provides semantic pipeline status using dedicated red/green/blue LEDs
#    - Red: ASR/Speech Recognition activity
#    - Green: LLM/Thinking activity  
#    - Blue: TTS/Speech Generation activity
#    - Only active when use_experimental_strip=True
#
# 2. Button LEDs (Physical Button LEDs A/B/C):
#    - Handles user interaction feedback and audio playback indication
#    - Remains available for button press feedback regardless of pipeline state
#    - Used for audio playback "all blink" effect
#
# This separation follows psychology-focused architecture by providing:
# - Clear semantic meaning (colors = cognitive functions)
# - Consistent user interaction patterns (buttons always responsive)
# - Graceful degradation (works with or without experimental features)
#

def reset_pipeline_stages():
    """Reset all pipeline stages to inactive using orchestrator"""
    from embodiment.pipeline_orchestrator import get_pipeline_orchestrator
    orchestrator = get_pipeline_orchestrator()
    orchestrator.complete_pipeline_flow()  # Forces transition to IDLE and cleanup


def start_system_processing(led_color='B', is_text_input=False, has_voice_output=True):
    """Start system processing using orchestrator
    
    Note: This function is kept for backward compatibility but now delegates
    to the orchestrator. The led_color parameter maps to system states.
    """
    from embodiment.pipeline_orchestrator import get_pipeline_orchestrator
    from embodiment.pipeline_orchestrator import SystemState
    
    orchestrator = get_pipeline_orchestrator()
    
    # Map legacy led_color to orchestrator states
    state_mappings = {
        'A': SystemState.PROCESSING_SPEECH,  # ASR stage
        'B': SystemState.CONTEMPLATING,     # LLM stage  
        'C': SystemState.SYNTHESIZING,      # TTS stage
        'aplay': SystemState.EXPRESSING     # Audio playback
    }
    
    if led_color in state_mappings:
        target_state = state_mappings[led_color]
        orchestrator.transition_to_state(target_state)
    else:
        print(f"Warning: Unknown led_color '{led_color}' in start_system_processing")


def stop_system_processing():
    """Stop system processing using orchestrator
    
    Note: This function is kept for backward compatibility but now delegates
    to the orchestrator to advance to the next stage.
    """
    from embodiment.pipeline_orchestrator import get_pipeline_orchestrator
    orchestrator = get_pipeline_orchestrator()
    
    # Advance to next stage in the pipeline
    orchestrator.advance_pipeline_flow()

# -------- EXPERIMENTAL RAINBOW STRIP HELPERS -------- #
# These functions provide direct access to rainbow strip features
# The driver will only execute them if use_experimental_strip=True

def show_rainbow_progress(progress, color=(0, 255, 0)):
    """Show progress bar on rainbow strip (requires experimental features)
    
    Args:
        progress: Float from 0.0 to 1.0
        color: RGB tuple for progress bar color
    """
    if rainbow_driver and config.USE_EXPERIMENTAL_RAINBOW_STRIP:
        rainbow_driver.rainbow_strip_manager.show_progress_bar(progress, color)


def start_rainbow_cycle(speed=0.1):
    """Start rainbow animation (requires experimental features)
    
    Args:
        speed: Animation speed (seconds between updates)
    """
    if rainbow_driver and config.USE_EXPERIMENTAL_RAINBOW_STRIP:
        rainbow_driver.rainbow_strip_manager.rainbow_cycle(speed)


def pulse_rainbow_color(color, speed=0.05):
    """Pulse all rainbow LEDs with a color (requires experimental features)
    
    Args:
        color: RGB tuple
        speed: Pulse speed
    """
    if rainbow_driver and config.USE_EXPERIMENTAL_RAINBOW_STRIP:
        rainbow_driver.rainbow_strip_manager.pulse_color(color, speed)


def stop_rainbow_animation():
    """Stop any running rainbow animation (requires experimental features)"""
    if rainbow_driver and config.USE_EXPERIMENTAL_RAINBOW_STRIP:
        rainbow_driver.rainbow_strip_manager.stop_animation()


def celebrate_with_rainbow():
    """Alternative celebration with only rainbow effects (requires experimental features)"""
    if rainbow_driver and config.USE_EXPERIMENTAL_RAINBOW_STRIP:
        # Just the rainbow effect without display/button LEDs
        rainbow_driver.rainbow_strip_manager.rainbow_cycle(speed=0.05)
        time.sleep(2)
        rainbow_driver.rainbow_strip_manager.clear() 