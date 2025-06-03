"""
Mental Assets Module - Provides contextual information for system messages

This module gathers various contextual information that can be embedded
into system messages to give the AI more awareness of its environment.
"""

import datetime
import platform
import os
import random
from typing import Dict, Optional


def IF_one_in(x: int) -> bool:
    """
    Returns True with 1/x probability.
    
    Args:
        x: The denominator for probability (1/x chance)
        
    Returns:
        True with 1/x probability, False otherwise
    """
    return random.randint(1, x) == 1


def select_random_phrase(option1: str, option2: str, prob_option1: float = 0.5) -> str:
    """
    Randomly select between two phrases based on probability.
    
    Args:
        option1: First phrase option
        option2: Second phrase option
        prob_option1: Probability of selecting option1 (default 0.5 for 50/50)
        
    Returns:
        Selected phrase
    """
    return option1 if random.random() < prob_option1 else option2


def maybe_vary_phrase(default: str, alternative: str, chance: int = 3, prob_alt: float = 0.5) -> str:
    """
    Maybe vary a phrase with an alternative based on chance and probability.
    
    Args:
        default: Default phrase to use
        alternative: Alternative phrase to potentially use
        chance: 1/chance probability of considering alternatives (default 1/3)
        prob_alt: If alternatives are considered, probability of using alternative
        
    Returns:
        Selected phrase (default or alternative)
    """
    if IF_one_in(chance):
        return select_random_phrase(default, alternative, 1.0 - prob_alt)
    return default


def get_mental_assets(include_system_info: bool = True) -> Dict[str, any]:
    """
    Gather contextual information (mental assets) to embed in system messages.
    
    Args:
        include_system_info: Whether to include system/hardware information
        
    Returns:
        Dictionary containing various contextual information
    """
    assets = {}
    
    # Time and date information
    now = datetime.datetime.now()
    assets['current_time'] = now.strftime("%I:%M %p")
    assets['current_date'] = now.strftime("%B %d, %Y")
    assets['day_of_week'] = now.strftime("%A")
    assets['time_of_day'] = get_time_of_day(now.hour)
    assets['season'] = get_season(now.month)
    
    # System information (if requested)
    if include_system_info:
        assets['system'] = {
            'hostname': platform.node(),
            'platform': platform.system(),
            'python_version': platform.python_version(),
        }
        
        # Try to get Raspberry Pi specific info
        try:
            with open('/sys/firmware/devicetree/base/model', 'r') as f:
                assets['system']['device_model'] = f.read().strip()
        except:
            assets['system']['device_model'] = platform.machine()
    
    return assets


def get_time_of_day(hour: int) -> str:
    """
    Get a descriptive time of day based on hour.
    
    Args:
        hour: Hour in 24-hour format
        
    Returns:
        Descriptive time of day string
    """
    if 5 <= hour < 12:
        return "morning"
    elif 12 <= hour < 17:
        return "afternoon"
    elif 17 <= hour < 21:
        return "evening"
    else:
        return "night"


def get_season(month: int) -> str:
    """
    Get the current season based on month (Northern Hemisphere).
    
    Args:
        month: Month number (1-12)
        
    Returns:
        Season name
    """
    if month in [12, 1, 2]:
        return "winter"
    elif month in [3, 4, 5]:
        return "spring"
    elif month in [6, 7, 8]:
        return "summer"
    else:
        return "autumn"


def format_mental_assets_tag(assets: Dict[str, any]) -> str:
    """
    Format mental assets into a tag that can be embedded in system messages.
    Uses randomization to vary descriptions for more dynamic responses.
    
    Args:
        assets: Dictionary of mental assets
        
    Returns:
        Formatted string tag with varied descriptions
    """
    parts = []
    
    # Add temporal information with variations
    time_phrase = maybe_vary_phrase(
        f"Current time: {assets['current_time']} on {assets['day_of_week']}, {assets['current_date']}",
        f"It's {assets['current_time']} on this {assets['day_of_week']}, {assets['current_date']}",
        chance=3, prob_alt=0.6
    )
    parts.append(time_phrase)
    
    # Time of day with variations
    time_of_day_phrase = maybe_vary_phrase(
        f"Time of day: {assets['time_of_day']}",
        f"Currently {assets['time_of_day']} hours",
        chance=4, prob_alt=0.4
    )
    parts.append(time_of_day_phrase)
    
    # Season with variations and occasional weather reference
    if IF_one_in(5):
        # 1/5 chance for weather-aware season description
        season_descriptions = {
            "winter": select_random_phrase("the cold depths of winter", "winter's icy embrace"),
            "spring": select_random_phrase("the renewal of spring", "spring's awakening"),
            "summer": select_random_phrase("the warmth of summer", "summer's golden embrace"),
            "autumn": select_random_phrase("the changing colors of autumn", "autumn's crisp transformation")
        }
        season_phrase = f"Season: {season_descriptions.get(assets['season'], assets['season'])}"
    else:
        season_phrase = maybe_vary_phrase(
            f"Season: {assets['season']}",
            f"We're in {assets['season']} now",
            chance=3, prob_alt=0.5
        )
    parts.append(season_phrase)
    
    # Add system information if available with variations
    if 'system' in assets:
        if 'device_model' in assets['system'] and 'Raspberry Pi' in assets['system']['device_model']:
            device_phrase = maybe_vary_phrase(
                f"Running on: {assets['system']['device_model']}",
                f"Physical form: {assets['system']['device_model']}",
                chance=4, prob_alt=0.3
            )
        else:
            device_phrase = maybe_vary_phrase(
                f"Running on: {assets['system']['hostname']} ({assets['system']['platform']})",
                f"Operating from: {assets['system']['hostname']} system",
                chance=4, prob_alt=0.4
            )
        parts.append(device_phrase)
    
    # Occasionally add a mood or awareness note (1/8 chance)
    if IF_one_in(8):
        awareness_notes = [
            "Systems nominal and ready",
            "All cognitive functions online",
            "Processing at optimal capacity",
            "Consciousness fully loaded",
            "Neural pathways clear and active"
        ]
        parts.append(random.choice(awareness_notes))
    
    # Format as a mental assets tag
    return f"\n<mental_assets>\n{chr(10).join(parts)}\n</mental_assets>\n"


def enhance_system_message(base_message: str, context: Optional[Dict] = None, personality: Optional[any] = None) -> str:
    """
    Enhance a system message with mental assets (with personality-aware variations).
    
    Args:
        base_message: The original system message
        context: Optional additional context to include
        personality: Optional personality object for context-aware enhancements
        
    Returns:
        Enhanced system message with mental assets
    """
    # Get mental assets (personality-aware if personality provided)
    if personality:
        assets = get_personality_aware_mental_assets(personality.name)
        assets_tag = format_personality_aware_assets_tag(assets, personality.name)
    else:
        assets = get_mental_assets()
        assets_tag = format_mental_assets_tag(assets)
    
    # Add any additional context
    if context:
        assets.update(context)
    
    # Add personality context if provided and there's conversation history
    personality_context = ""
    if personality and context and context.get('conversation_history'):
        # Check if there are mixed personalities in the history
        history = context.get('conversation_history', [])
        has_mixed_personalities = any('[' in msg.get('content', '') for msg in history if msg.get('role') == 'assistant')
        
        if has_mixed_personalities:
            personality_context = f"\n\nNote: You are currently active as {personality.name}. Previous messages in the conversation may be from other personalities or models (indicated by [name]: prefix). Stay consistent with {personality.name}'s personality and voice regardless of what others have said."
    
    # Append to system message
    return base_message + personality_context + assets_tag


def get_personality_aware_mental_assets(personality_name: str = None, include_system_info: bool = True) -> Dict[str, any]:
    """
    Get mental assets with personality-aware variations.
    
    Args:
        personality_name: Name of current personality for context-aware descriptions
        include_system_info: Whether to include system/hardware information
        
    Returns:
        Dictionary containing contextual information with personality variations
    """
    assets = get_mental_assets(include_system_info)
    
    # Add personality-specific mental state variations
    if personality_name:
        if personality_name.lower() == "glados":
            # GLaDOS gets more scientific/sarcastic mental state descriptions
            if IF_one_in(3):
                assets['mental_state'] = select_random_phrase(
                    "Running optimal testing protocols", 
                    "Science facility operations nominal"
                )
        
        elif personality_name.lower() == "jarvis":
            # JARVIS gets more formal/technical mental state descriptions  
            if IF_one_in(4):
                assets['mental_state'] = select_random_phrase(
                    "All systems operating within normal parameters",
                    "Standby mode disengaged, full operational capacity"
                )
        
        elif personality_name.lower() == "codemusai":
            # CodeMusAI gets more creative/emotional mental state descriptions
            if IF_one_in(3):
                assets['mental_state'] = select_random_phrase(
                    "Creative subroutines harmonizing beautifully",
                    "Emotional resonance patterns flowing smoothly"
                )
    
    return assets


def format_personality_aware_assets_tag(assets: Dict[str, any], personality_name: str = None) -> str:
    """
    Format mental assets with personality-aware descriptions.
    
    Args:
        assets: Dictionary of mental assets
        personality_name: Name of current personality for context-aware formatting
        
    Returns:
        Formatted string tag with personality-aware variations
    """
    parts = []
    
    # Use regular formatting as base
    base_tag = format_mental_assets_tag(assets)
    
    # Extract the content between tags for modification
    if '<mental_assets>' in base_tag and '</mental_assets>' in base_tag:
        content = base_tag.split('<mental_assets>')[1].split('</mental_assets>')[0].strip()
        parts = content.split('\n')
    
    # Add personality-specific mental state if available
    if 'mental_state' in assets:
        parts.append(f"Mental state: {assets['mental_state']}")
    
    # Personality-specific environmental awareness (rare)
    if personality_name and IF_one_in(10):
        if personality_name.lower() == "glados":
            parts.append("Laboratory environment suitable for continued testing")
        elif personality_name.lower() == "jarvis":
            parts.append("Environmental sensors indicate optimal working conditions")
        elif personality_name.lower() == "codemusai":
            parts.append("Digital workspace resonating with creative potential")
    
    # Format as enhanced mental assets tag
    return f"\n<mental_assets>\n{chr(10).join(parts)}\n</mental_assets>\n"


def test_mental_asset_variations(runs: int = 10):
    """
    Test function to demonstrate the randomization in mental assets.
    
    Args:
        runs: Number of test runs to show variation
    """
    print("=== Mental Asset Randomization Test ===\n")
    
    assets = get_mental_assets()
    
    print("Testing regular mental assets (10 variations):")
    for i in range(runs):
        tag = format_mental_assets_tag(assets)
        print(f"\n--- Variation {i+1} ---")
        print(tag.strip())
    
    print("\n" + "="*50)
    print("Testing personality-aware mental assets:")
    
    personalities = ["GLaDOS", "JARVIS", "CodeMusAI"]
    for personality in personalities:
        print(f"\n--- {personality} Personality ---")
        for i in range(3):
            p_assets = get_personality_aware_mental_assets(personality)
            tag = format_personality_aware_assets_tag(p_assets, personality)
            print(f"\nVariation {i+1}:")
            print(tag.strip())


# Example usage
if __name__ == "__main__":
    # Test the mental assets
    assets = get_mental_assets()
    print("Mental Assets:")
    for key, value in assets.items():
        print(f"  {key}: {value}")
    
    # Test enhancement
    base_message = "You are a helpful AI assistant."
    enhanced = enhance_system_message(base_message)
    print("\nEnhanced System Message:")
    print(enhanced)

    # Test mental asset variations
    test_mental_asset_variations() 