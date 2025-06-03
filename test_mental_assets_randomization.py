#!/usr/bin/env python3
"""
Test script to demonstrate the mental assets randomization functionality.
Run this script to see how the IF_one_in() and randomization functions create varied mental asset descriptions.
"""

import sys
import os

# Add the roverseer_api_app directory to Python path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'roverseer_api_app'))

from cognition.mental_assets import (
    IF_one_in, 
    select_random_phrase, 
    maybe_vary_phrase,
    test_mental_asset_variations,
    get_mental_assets,
    format_mental_assets_tag,
    get_personality_aware_mental_assets,
    format_personality_aware_assets_tag
)

def test_probability_functions():
    """Test the core probability functions"""
    print("🎲 Testing Probability Functions")
    print("=" * 40)
    
    # Test IF_one_in function
    print("Testing IF_one_in(3) - should be true roughly 1/3 of the time:")
    results = [IF_one_in(3) for _ in range(20)]
    true_count = sum(results)
    print(f"Results: {results}")
    print(f"True count: {true_count}/20 (expected ~6-7)")
    
    print("\nTesting select_random_phrase with 70/30 split:")
    phrases = [select_random_phrase("Option A", "Option B", 0.7) for _ in range(20)]
    a_count = phrases.count("Option A")
    b_count = phrases.count("Option B")
    print(f"Option A: {a_count}/20, Option B: {b_count}/20")
    
    print("\nTesting maybe_vary_phrase with 1/4 chance:")
    varied = [maybe_vary_phrase("Default", "Alternative", chance=4) for _ in range(20)]
    alt_count = varied.count("Alternative")
    default_count = varied.count("Default")
    print(f"Default: {default_count}/20, Alternative: {alt_count}/20")
    print()

def demonstrate_mental_asset_variations():
    """Show mental asset variations in action"""
    print("🧠 Mental Asset Variation Demonstrations")
    print("=" * 45)
    
    print("Standard mental assets with randomization:")
    assets = get_mental_assets()
    
    for i in range(5):
        tag = format_mental_assets_tag(assets)
        print(f"\n--- Example {i+1} ---")
        print(tag.strip())
    
    print("\n" + "="*45)
    print("Personality-aware mental assets:")
    
    personalities = ["GLaDOS", "JARVIS", "CodeMusAI"]
    for personality in personalities:
        print(f"\n🎭 {personality} Examples:")
        for i in range(3):
            p_assets = get_personality_aware_mental_assets(personality)
            tag = format_personality_aware_assets_tag(p_assets, personality)
            print(f"\nExample {i+1}:")
            print(tag.strip())

def show_probability_breakdown():
    """Show the probability breakdown of different features"""
    print("📊 Probability Breakdown")
    print("=" * 25)
    print("• Time phrase variation: 1/3 chance (60% prob for alternative)")
    print("• Time of day variation: 1/4 chance (40% prob for alternative)")
    print("• Season variation: 1/3 chance (50% prob for alternative)")
    print("• Poetic season description: 1/5 chance")
    print("• Device description variation: 1/4 chance")
    print("• System awareness note: 1/8 chance")
    print("• Personality mental state: 1/3 or 1/4 chance (varies by personality)")
    print("• Environmental awareness: 1/10 chance (personality-specific)")
    print()

if __name__ == "__main__":
    print("🌟 Mental Assets Randomization Test Suite")
    print("=" * 50)
    print()
    
    # Test basic probability functions
    test_probability_functions()
    
    # Show probability breakdown
    show_probability_breakdown()
    
    # Demonstrate variations
    demonstrate_mental_asset_variations()
    
    print("\n" + "="*50)
    print("✅ Test complete! Mental assets now provide varied,")
    print("   dynamic descriptions with personality awareness.")
    print("   Each AI response will have subtly different")
    print("   contextual information, making conversations")
    print("   feel more natural and less robotic.") 