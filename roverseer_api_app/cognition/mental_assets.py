"""
Mental Assets Module - Provides contextual information for system messages

This module gathers various contextual information that can be embedded
into system messages to give the AI more awareness of its environment.
"""

import datetime
import platform
import os
from typing import Dict, Optional


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
    
    Args:
        assets: Dictionary of mental assets
        
    Returns:
        Formatted string tag
    """
    parts = []
    
    # Add temporal information
    parts.append(f"Current time: {assets['current_time']} on {assets['day_of_week']}, {assets['current_date']}")
    parts.append(f"Time of day: {assets['time_of_day']}")
    parts.append(f"Season: {assets['season']}")
    
    # Add system information if available
    if 'system' in assets:
        if 'device_model' in assets['system'] and 'Raspberry Pi' in assets['system']['device_model']:
            parts.append(f"Running on: {assets['system']['device_model']}")
        else:
            parts.append(f"Running on: {assets['system']['hostname']} ({assets['system']['platform']})")
    
    # Format as a mental assets tag
    return f"\n<mental_assets>\n{chr(10).join(parts)}\n</mental_assets>\n"


def enhance_system_message(base_message: str, context: Optional[Dict] = None) -> str:
    """
    Enhance a system message with mental assets.
    
    Args:
        base_message: The original system message
        context: Optional additional context to include
        
    Returns:
        Enhanced system message with mental assets
    """
    # Get mental assets
    assets = get_mental_assets()
    
    # Add any additional context
    if context:
        assets.update(context)
    
    # Format the assets tag
    assets_tag = format_mental_assets_tag(assets)
    
    # Append to system message
    return base_message + assets_tag


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