from config import available_models, DEFAULT_MODEL
from cognition.llm_interface import get_available_models, sort_models_by_size


def refresh_available_models():
    """Refresh the available models list from Ollama"""
    global available_models
    models = get_available_models()
    if models:  # Only update if we got models
        available_models[:] = sort_models_by_size(models)  # Update in-place
        print(f"Refreshed model list: {len(available_models)} models found (including PenphinMind)")
        return True
    return False


def initialize_model_list():
    """Initialize the model list on startup"""
    global available_models
    
    print("Fetching available models...")
    max_retries = 5
    retry_delay = 2.0
    
    for attempt in range(max_retries):
        if refresh_available_models():
            break
        else:
            print(f"Attempt {attempt + 1}/{max_retries} failed, waiting {retry_delay}s...")
            import time
            time.sleep(retry_delay)
    
    # If still no models, use default
    if not available_models:
        available_models[:] = [DEFAULT_MODEL]
        print(f"No models found after {max_retries} attempts, using default: {DEFAULT_MODEL}")
    
    return len(available_models) > 1  # Return True if we got more than just the default


def get_current_model(selected_index):
    """Get the currently selected model name"""
    if 0 <= selected_index < len(available_models):
        return available_models[selected_index]
    return DEFAULT_MODEL


def get_model_count():
    """Get the total number of available models"""
    return len(available_models)


def is_penphin_mind_selected(selected_index):
    """Check if PenphinMind is currently selected"""
    current_model = get_current_model(selected_index)
    return current_model.lower() == "penphinmind" 