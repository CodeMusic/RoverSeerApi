#!/usr/bin/env python3
"""
Test script for the Personality Variations Template System

Demonstrates how personalities use template tags in system messages that get
replaced with configurable response variations based on context.
"""

import sys
import os

# Add the project root to the path
sys.path.append('roverseer_api_app')

from cognition.personality import personality_manager
from cognition.personality_variations import personality_variations, replace_personality_template, detect_event_from_context


def test_template_replacement():
    """Test the new template tag replacement system"""
    print("=== Testing Template Tag Replacement ===")
    
    # Test different contexts with GlaDOS
    test_contexts = [
        {"weather": "sunny", "time_of_day": "morning"},
        {"weather": "hot", "time_of_day": "evening"},
        {"weather": "cold"},
        {"interaction_type": "compliment"},
        {"interaction_type": "error"}
    ]
    
    # Get GlaDOS template
    base_template = "You are GlaDOS. {weather_context} {time_context} {interaction_context}"
    
    print("\n🧪 GlaDOS Template Replacement Tests:")
    print(f"Base template: {base_template}")
    
    for i, context in enumerate(test_contexts, 1):
        print(f"\nContext #{i}: {context}")
        result = replace_personality_template("GlaDOS", base_template, context)
        print(f"  Result: {result}")


def test_personality_integration_with_templates():
    """Test the full personality system with template replacement"""
    print("\n=== Testing Full Personality Integration ===")
    
    # Test with different personalities and contexts
    test_cases = [
        {
            "personality": "GlaDOS",
            "context": {"weather": "sunny", "time_of_day": "morning", "interaction_type": "compliment"}
        },
        {
            "personality": "JARVIS", 
            "context": {"weather": "hot", "time_of_day": "evening"}
        },
        {
            "personality": "CodeMusAI",
            "context": {"weather": "rainy", "current_task": "coding"}
        },
        {
            "personality": "Pengu",
            "context": {"weather": "snow"}
        }
    ]
    
    for test_case in test_cases:
        personality_name = test_case["personality"]
        context = test_case["context"]
        
        if personality_manager.switch_to(personality_name):
            print(f"\n{personality_manager.current_personality.avatar_emoji} {personality_name} Test:")
            print(f"  Context: {context}")
            
            # Test system message generation
            system_msg = personality_manager.current_personality.generate_system_message(context)
            print(f"  System message length: {len(system_msg)} characters")
            print(f"  System message: {system_msg}")
            
            # Test intro message
            intro = personality_manager.current_personality.get_intro_message()
            print(f"  Intro message: {intro}")


def test_template_variations_display():
    """Show what variations are available for each personality"""
    print("\n=== Available Template Variations ===")
    
    personalities = ["GlaDOS", "JARVIS", "CodeMusAI", "Pengu"]
    
    for personality in personalities:
        print(f"\n{personality} Variations:")
        variations = personality_variations.list_personality_variations(personality)
        
        for context_type, contexts in variations.items():
            print(f"  {context_type}:")
            for event_name, event_variations in contexts.items():
                print(f"    {event_name}: {len(event_variations)} variations")
                for var in event_variations:
                    prob = var.get('probability', 0)
                    text = var.get('text', '')[:60]
                    print(f"      {prob*100:5.1f}%: {text}...")


def test_context_detection_enhanced():
    """Test enhanced context detection for template system"""
    print("\n=== Enhanced Context Detection ===")
    
    test_contexts = [
        {"weather": "sunny and warm", "time_of_day": "morning"},
        {"weather": "rainy", "current_task": "programming music software"},
        {"time_of_day": "evening", "interaction_type": "compliment received"},
        {"weather": "snowy", "time_of_day": "night"},
        {"current_task": "coding", "interaction_type": "error occurred"}
    ]
    
    for i, context in enumerate(test_contexts, 1):
        print(f"\nContext #{i}: {context}")
        events = detect_event_from_context(context)
        print(f"  Detected events: {events}")
        
        # Show how this would affect different personalities
        for personality in ["GlaDOS", "JARVIS", "CodeMusAI"]:
            if personality_variations.has_variations(personality):
                # Build a simple template to test
                template = f"I am {personality}. " + "{weather_context} {time_context} {task_context} {interaction_context}"
                result = replace_personality_template(personality, template, context)
                cleaned = result.replace(f"I am {personality}. ", "").strip()
                if cleaned:
                    print(f"    {personality}: {cleaned}")


def test_probability_distribution_in_templates():
    """Test that probabilities work correctly in template replacement"""
    print("\n=== Template Probability Distribution Test ===")
    
    context = {"weather": "sunny", "time_of_day": "morning"}
    template = "You are GlaDOS. {weather_context} {time_context}"
    
    print(f"Testing template: {template}")
    print(f"With context: {context}")
    print(f"\nResults from 10 generations:")
    
    for i in range(10):
        result = replace_personality_template("GlaDOS", template, context)
        # Extract just the variations part
        base_part = "You are GlaDOS."
        variations_part = result.replace(base_part, "").strip()
        print(f"  #{i+1}: {variations_part}")


if __name__ == "__main__":
    print("🎭 Personality Variations Template System Test")
    print("=" * 60)
    
    try:
        test_template_replacement()
        test_personality_integration_with_templates()
        test_template_variations_display()
        test_context_detection_enhanced()
        test_probability_distribution_in_templates()
        
        print("\n✅ All template system tests completed successfully!")
        
    except Exception as e:
        print(f"\n❌ Test failed with error: {e}")
        import traceback
        traceback.print_exc() 