#!/usr/bin/env python3
"""
Contextual Moods Test and Management Tool

This script allows testing and managing the contextual moods system.
It can be used to:
- Test different context scenarios
- View which moods activate for different triggers
- Add new moods and test them
- Debug mood selection logic
- Edit the contextual_moods.json file
"""

import sys
import os
import json
from datetime import datetime

# Add the roverseer_api_app directory to the path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'roverseer_api_app'))

from cognition.contextual_moods import contextual_moods, generate_mood_context
from cognition.personality import personality_manager


def test_context_scenarios():
    """Test various context scenarios to see mood activations"""
    
    print("🧠 Testing Contextual Moods System")
    print("=" * 50)
    
    # Test scenarios
    scenarios = [
        {
            "name": "Sunny Morning Coding",
            "context": {
                "weather": "sunny and warm",
                "time_of_day": "morning", 
                "current_task": "coding a new feature"
            }
        },
        {
            "name": "Hot Afternoon with Compliment",
            "context": {
                "weather": "hot and bright",
                "time_of_day": "afternoon",
                "interaction_type": "user gave compliment"
            }
        },
        {
            "name": "Cold Evening",
            "context": {
                "weather": "cold and cloudy",
                "time_of_day": "evening"
            }
        },
        {
            "name": "Rainy Day Music Session",
            "context": {
                "weather": "rainy",
                "current_task": "listening to music and coding"
            }
        },
        {
            "name": "Snowy Winter Day",
            "context": {
                "weather": "snow falling",
                "time_of_day": "afternoon"
            }
        }
    ]
    
    # Test each personality with each scenario
    personalities = ["GlaDOS", "JARVIS", "CodeMusAI", "Pengu"]
    
    for scenario in scenarios:
        print(f"\n🌟 Scenario: {scenario['name']}")
        print(f"   Context: {scenario['context']}")
        print("-" * 40)
        
        for personality in personalities:
            if contextual_moods.has_moods(personality):
                # Run multiple times to see probability variations
                results = []
                for _ in range(5):
                    mood_text = generate_mood_context(personality, scenario['context'])
                    if mood_text:
                        results.append(mood_text)
                
                if results:
                    print(f"   {personality}:")
                    for i, result in enumerate(set(results), 1):
                        print(f"     {i}. {result[:80]}{'...' if len(result) > 80 else ''}")
                else:
                    print(f"   {personality}: No mood activations")
            else:
                print(f"   {personality}: No moods configured")


def list_all_moods():
    """List all configured moods for each personality"""
    
    print("\n📝 All Configured Moods")
    print("=" * 50)
    
    for personality_name in contextual_moods.moods.keys():
        print(f"\n🎭 {personality_name}")
        print("-" * 30)
        
        moods = contextual_moods.list_personality_moods(personality_name)
        for mood_name, mood_data in moods.items():
            triggers = ", ".join(mood_data.get('context_triggers', []))
            probability = mood_data.get('trigger_probability', 1.0)
            influences_count = len(mood_data.get('mood_influences', []))
            
            print(f"   • {mood_name}")
            print(f"     Triggers: {triggers}")
            print(f"     Probability: {probability}")
            print(f"     Influences: {influences_count} options")
            
            # Show actual influence text
            for i, influence in enumerate(mood_data.get('mood_influences', []), 1):
                text = influence.get('text', '')[:60]
                weight = influence.get('weight', 1.0)
                print(f"       {i}. \"{text}{'...' if len(influence.get('text', '')) > 60 else ''}\" (weight: {weight})")


def test_mood_with_custom_context():
    """Allow testing with custom context input"""
    
    print("\n🧪 Custom Context Testing")
    print("=" * 40)
    print("Enter custom context (or press Enter to skip):")
    print("Format: weather=sunny,time_of_day=morning,current_task=coding")
    
    user_input = input("> ").strip()
    
    if not user_input:
        return
    
    # Parse the custom context
    context = {}
    try:
        for pair in user_input.split(','):
            key, value = pair.split('=', 1)
            context[key.strip()] = value.strip()
    except ValueError:
        print("⚠️  Invalid format. Use: key=value,key2=value2")
        return
    
    print(f"\nTesting context: {context}")
    print("-" * 30)
    
    for personality in ["GlaDOS", "JARVIS", "CodeMusAI", "Pengu"]:
        if contextual_moods.has_moods(personality):
            mood_text = generate_mood_context(personality, context)
            if mood_text:
                print(f"{personality}: {mood_text}")
            else:
                print(f"{personality}: No mood activation")


def add_new_mood():
    """Interactive mood creation"""
    
    print("\n➕ Add New Mood")
    print("=" * 30)
    
    # Get personality
    personalities = list(contextual_moods.moods.keys()) + ["NEW"]
    print("Available personalities:")
    for i, p in enumerate(personalities, 1):
        print(f"  {i}. {p}")
    
    try:
        choice = int(input("Select personality (number): ")) - 1
        if choice == len(personalities) - 1:  # NEW
            personality_name = input("Enter new personality name: ").strip()
        else:
            personality_name = personalities[choice]
    except (ValueError, IndexError):
        print("⚠️  Invalid choice")
        return
    
    # Get mood details
    mood_name = input("Mood name: ").strip()
    if not mood_name:
        print("⚠️  Mood name required")
        return
    
    try:
        probability = float(input("Trigger probability (0.0-1.0): ") or "0.7")
    except ValueError:
        probability = 0.7
    
    triggers_input = input("Context triggers (comma-separated): ").strip()
    triggers = [t.strip() for t in triggers_input.split(',') if t.strip()]
    
    # Get mood influences
    influences = []
    print("\nEnter mood influences (press Enter on empty line to finish):")
    while True:
        text = input("Influence text: ").strip()
        if not text:
            break
        try:
            weight = float(input("Weight (0.0-1.0): ") or "1.0")
        except ValueError:
            weight = 1.0
        
        influences.append({"text": text, "weight": weight})
    
    if not influences:
        print("⚠️  At least one mood influence required")
        return
    
    # Add the mood
    contextual_moods.add_mood(
        personality_name=personality_name,
        mood_name=mood_name,
        trigger_probability=probability,
        context_triggers=triggers,
        mood_influences=influences
    )
    
    contextual_moods.save_moods()
    print(f"✅ Added '{mood_name}' mood to {personality_name}")


def open_json_file():
    """Open the contextual_moods.json file for direct editing"""
    
    print("\n📝 Opening JSON File")
    print("=" * 30)
    
    json_path = os.path.join('roverseer_api_app', 'contextual_moods.json')
    
    if os.path.exists(json_path):
        print(f"JSON file location: {os.path.abspath(json_path)}")
        print("\nYou can edit this file directly with any text editor.")
        print("After editing, restart this script to test your changes.")
        
        # Show current structure
        try:
            with open(json_path, 'r') as f:
                data = json.load(f)
            print(f"\nCurrent structure has {len(data)} personalities:")
            for name, moods in data.items():
                print(f"  • {name}: {len(moods)} moods")
        except Exception as e:
            print(f"⚠️  Error reading file: {e}")
    else:
        print(f"⚠️  File not found: {json_path}")


def show_mood_json_structure():
    """Show the JSON structure for adding new moods"""
    
    print("\n📋 Mood JSON Structure")
    print("=" * 40)
    
    example_structure = {
        "PersonalityName": {
            "mood_name": {
                "trigger_probability": 0.7,
                "context_triggers": ["sunny", "morning", "coding"],
                "mood_influences": [
                    {
                        "text": "Example mood influence text that gets appended to system message",
                        "weight": 0.6
                    },
                    {
                        "text": "Alternative mood influence with different probability",
                        "weight": 0.4
                    }
                ]
            }
        }
    }
    
    print("Example mood structure:")
    print(json.dumps(example_structure, indent=2))
    
    print("\nContext Trigger Options:")
    print("• Weather: sunny, hot, cold, rainy, snow")
    print("• Time: morning, afternoon, evening, night") 
    print("• Activities: coding, music")
    print("• Interactions: compliment, error")
    
    print("\nPsychology-Focused Naming Convention:")
    print("• Use emotional/mental state terms")
    print("• Focus on psychological triggers")
    print("• Examples: scientific_fascination, condescending_superiority,")
    print("  creative_inspiration, pure_excitement, nostalgic_menace")


def test_specific_personality():
    """Test moods for a specific personality in detail"""
    
    print("\n🎭 Detailed Personality Testing")
    print("=" * 40)
    
    personalities = list(contextual_moods.moods.keys())
    if not personalities:
        print("⚠️  No personalities configured")
        return
    
    print("Available personalities:")
    for i, p in enumerate(personalities, 1):
        print(f"  {i}. {p}")
    
    try:
        choice = int(input("Select personality (number): ")) - 1
        personality_name = personalities[choice]
    except (ValueError, IndexError):
        print("⚠️  Invalid choice")
        return
    
    print(f"\n🎭 Testing {personality_name}")
    print("-" * 30)
    
    # Show all moods for this personality
    moods = contextual_moods.list_personality_moods(personality_name)
    for mood_name, mood_data in moods.items():
        print(f"\n🧠 {mood_name}")
        print(f"   Probability: {mood_data.get('trigger_probability', 1.0)}")
        print(f"   Triggers: {', '.join(mood_data.get('context_triggers', []))}")
        
        # Test with triggers
        for trigger in mood_data.get('context_triggers', []):
            test_context = {"test_trigger": trigger}
            result = generate_mood_context(personality_name, test_context)
            if result:
                print(f"   → With '{trigger}': {result[:60]}{'...' if len(result) > 60 else ''}")


def main():
    """Main menu for the contextual moods tool"""
    
    while True:
        print("\n🎭 Contextual Moods Management Tool")
        print("=" * 50)
        print("1. Test Context Scenarios")
        print("2. List All Configured Moods")
        print("3. Add New Mood (Interactive)")
        print("4. Test Custom Context")
        print("5. Test Specific Personality")
        print("6. Open JSON File for Editing")
        print("7. Show JSON Structure Guide")
        print("8. Exit")
        
        choice = input("\nSelect option (1-8): ").strip()
        
        if choice == "1":
            test_context_scenarios()
        elif choice == "2":
            list_all_moods()
        elif choice == "3":
            add_new_mood()
        elif choice == "4":
            test_mood_with_custom_context()
        elif choice == "5":
            test_specific_personality()
        elif choice == "6":
            open_json_file()
        elif choice == "7":
            show_mood_json_structure()
        elif choice == "8":
            print("👋 Goodbye!")
            break
        else:
            print("⚠️  Invalid choice. Please select 1-8.")


if __name__ == "__main__":
    main() 