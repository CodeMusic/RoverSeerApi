import time
import random

from config import (LOGICAL_MODEL, CREATIVE_MODEL, LOGICAL_MESSAGE, CREATIVE_MESSAGE, 
                   CONVERGENCE_MESSAGE, DEFAULT_VOICE)
from cognition.llm_interface import run_chat_completion
from memory.usage_logger import log_penphin_mind_usage
from expression.sound_orchestration import play_sound_async, play_bicameral_connection_tune


# Global state for convergence model selection
convergence_model = None


def bicameral_chat_direct(prompt, system="", voice=DEFAULT_VOICE):
    """
    Direct bicameral processing without HTTP overhead.
    Returns the final synthesis text.
    """
    global convergence_model
    
    if not prompt.strip():
        raise ValueError("No prompt provided")

    try:
        # Play the unique bicameral connection tune
        play_sound_async(play_bicameral_connection_tune)
        
        # Randomly decide which model will handle convergence
        convergence_model = random.choice([LOGICAL_MODEL, CREATIVE_MODEL])
        first_model = LOGICAL_MODEL if convergence_model == CREATIVE_MODEL else CREATIVE_MODEL
        
        # 1. Send to First Mind
        first_start_time = time.time()
        first_messages = [{"role": "user", "content": prompt}]
        first_system = LOGICAL_MESSAGE if first_model == LOGICAL_MODEL else CREATIVE_MESSAGE
        
        first_response = run_chat_completion(first_model, first_messages, first_system, skip_logging=True)
        first_time = time.time() - first_start_time
        
        # Keep LLM LED state, don't stop
        time.sleep(0.5)  # Brief pause between minds
        
        # 2. Send to Second Mind (which will also handle convergence)
        second_start_time = time.time()
        second_messages = [{"role": "user", "content": prompt}]
        second_system = LOGICAL_MESSAGE if convergence_model == LOGICAL_MODEL else CREATIVE_MESSAGE
        
        second_response = run_chat_completion(convergence_model, second_messages, second_system, skip_logging=True)
        second_time = time.time() - second_start_time
        
        # Keep LLM LED state, don't stop
        time.sleep(0.5)  # Brief pause before convergence
        
        # 3. Send all to Convergence Mind (using the same model as second mind)
        convergence_start_time = time.time()
        
        # Build convergence prompt base
        convergence_prompt_base = f"""
        [Prompt:
        {prompt}

        First Mind Perspective:
        {first_response}

        Second Mind Perspective:
        {second_response}]"""
        
        # If system message provided, prepend it
        if system:
            convergence_prompt = system + ". " + convergence_prompt_base
        else:
            convergence_prompt = convergence_prompt_base
        
        convergence_messages = [{"role": "user", "content": convergence_prompt}]

        final_response = run_chat_completion(convergence_model, convergence_messages, CONVERGENCE_MESSAGE, skip_logging=True)
        convergence_time = time.time() - convergence_start_time
        
        # Log PenphinMind usage
        bicameral_system_message = f"Bicameral processing for: {prompt[:50]}..."
        log_penphin_mind_usage(
            first_model, convergence_model, convergence_model,
            bicameral_system_message, prompt,
            first_response, first_time,
            second_response, second_time,
            final_response, convergence_time,
            voice_id=voice
        )
        
        return final_response
        
    except Exception as e:
        error_msg = str(e)
        if "Connection refused" in error_msg:
            raise Exception("Failed to connect to Ollama service. Please ensure Ollama is running.")
        elif "model not found" in error_msg.lower():
            raise Exception(f"Model not found: {error_msg}")
        else:
            raise Exception(f"Bicameral processing failed: {error_msg}")


def get_convergence_model():
    """Get the currently selected convergence model"""
    return convergence_model


def reset_convergence_model():
    """Reset convergence model selection"""
    global convergence_model
    convergence_model = None 