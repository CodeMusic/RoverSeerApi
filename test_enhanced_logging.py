#!/usr/bin/env python3
"""
Test script for Enhanced LLM Logging with Mood Data and Tags

This script demonstrates the new logging features:
1. Detailed mood activation probabilities and data capture
2. <personality> and <mood> tags in responses  
3. Enhanced log display with mood analysis
4. Tag extraction for analysis

Run this to see the enhanced logging in action.
"""

import sys
import os
import json
import tempfile

# Add the app directory to the path so we can import modules
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'roverseer_api_app'))

def test_enhanced_logging():
    """Test the enhanced logging system with mood data"""
    print("🧠 Testing Enhanced LLM Logging System")
    print("=" * 50)
    
    try:
        # Import required modules
        from cognition.contextual_moods import (
            generate_mood_context_with_details,
            add_personality_mood_tags,
            extract_tags_from_response
        )
        from helpers.logging_helper import LoggingHelper
        from memory.usage_logger import log_llm_usage
        
        # Test personality and context
        personality_name = "GlaDOS"
        test_context = {
            "sunny": True,
            "morning": True,
            "coding": True,
            "user_mood": "excited"
        }
        
        print(f"🎭 Testing personality: {personality_name}")
        print(f"🌍 Test context: {test_context}")
        print()
        
        # Generate mood influences with detailed data
        mood_influences, mood_data = generate_mood_context_with_details(personality_name, test_context)
        
        print("🧠 Mood System Analysis:")
        print(f"   Context triggers detected: {mood_data.get('context_triggers_detected', [])}")
        print(f"   Total moods available: {mood_data.get('total_moods_available', 0)}")
        print(f"   Moods activated: {mood_data.get('moods_activated', [])}")
        
        if mood_data.get('activation_summary'):
            summary = mood_data['activation_summary']
            print(f"   Activation rate: {summary.get('activation_rate', 0) * 100:.1f}%")
        
        print()
        print("📊 Detailed Mood Probabilities:")
        for mood in mood_data.get('moods_checked', []):
            status = "✅ Activated" if mood.get('activated') else "⚡ Triggered" if mood.get('triggered') else "💤 Inactive"
            print(f"   {mood['mood_name']}: {status}")
            print(f"      Probability: {mood['trigger_probability'] * 100:.1f}%")
            print(f"      Triggers: {', '.join(mood.get('context_triggers', []))}")
            if mood.get('activation_roll') is not None:
                print(f"      Roll: {mood['activation_roll'] * 100:.1f}%")
            if mood.get('selected_influence'):
                print(f"      Influence: \"{mood['selected_influence']['text'][:60]}...\"")
            print()
        
        # Simulate an LLM response
        test_response = "Well, well. Your enthusiasm for this coding session is quite... *adjustable*. The morning light streaming in provides excellent illumination for observing your futile attempts at optimization. But don't worry - failure is just another data point in my comprehensive study of human incompetence."
        
        # Add personality and mood tags
        tagged_response = add_personality_mood_tags(test_response, personality_name, mood_data)
        
        print("🏷️ Response with Tags:")
        print(f"Original: {test_response[:100]}...")
        print(f"Tagged: {tagged_response[:150]}...")
        print()
        
        # Test tag extraction
        extracted = extract_tags_from_response(tagged_response)
        print("🔍 Extracted Tags:")
        print(f"   Personality: {extracted.get('personality')}")
        if extracted.get('mood'):
            print(f"   Mood data: {json.dumps(extracted['mood'], indent=2)}")
        print(f"   Clean response: {extracted.get('clean_response', '')[:100]}...")
        print()
        
        # Test enhanced logging
        print("📝 Testing Enhanced Logging...")
        
        # Create a temporary log directory for testing
        with tempfile.TemporaryDirectory() as temp_dir:
            # Override log directory temporarily
            original_log_dir = getattr(LoggingHelper, 'LOG_DIR', None)
            LoggingHelper.LOG_DIR = temp_dir
            
            # Log the enhanced LLM usage
            log_llm_usage(
                model_name="llama3.2:latest",
                system_message="You are GLaDOS from Portal. You are conducting scientific tests.",
                user_prompt="I'm excited to start coding this morning!",
                response=tagged_response,
                processing_time=2.34,
                voice_id="en_US-GlaDOS",
                personality=personality_name,
                mood_data=mood_data
            )
            
            print("✅ Enhanced log entry created successfully!")
            
            # Read back the log to verify structure
            log_file = os.path.join(temp_dir, f"llm_usage_{datetime.now().strftime('%Y-%m-%d')}.log")
            if os.path.exists(log_file):
                with open(log_file, 'r') as f:
                    log_entry = json.loads(f.read().strip())
                
                print("\n📋 Log Entry Structure:")
                print(f"   Timestamp: {log_entry['timestamp']}")
                print(f"   Model: {log_entry['model']}")
                print(f"   Personality: {log_entry['personality']}")
                print(f"   Voice: {log_entry['voice_id']}")
                print(f"   Runtime: {log_entry['runtime']}s")
                print(f"   Has mood data: {bool(log_entry.get('mood_data'))}")
                print(f"   Has tags in response: {'<personality>' in log_entry['llm_reply']}")
                
                # Restore original log directory
                if original_log_dir:
                    LoggingHelper.LOG_DIR = original_log_dir
        
        print("\n🎉 Enhanced Logging Test Completed Successfully!")
        print("\nNew Features Available:")
        print("✅ Detailed mood activation probabilities in logs")
        print("✅ <personality> and <mood> tags in responses")  
        print("✅ Enhanced log display with mood analysis")
        print("✅ Tag extraction for analysis")
        print("✅ Visual indicators in web interface")
        
    except ImportError as e:
        print(f"❌ Import error: {e}")
        print("Make sure you're running this from the project root directory")
        return False
    except Exception as e:
        print(f"❌ Test failed: {e}")
        import traceback
        traceback.print_exc()
        return False
    
    return True


def demonstrate_mood_probabilities():
    """Demonstrate mood probability calculations multiple times"""
    print("\n🎲 Mood Probability Demonstration")
    print("=" * 40)
    
    try:
        from cognition.contextual_moods import generate_mood_context_with_details
        
        personality_name = "GlaDOS"
        test_context = {"sunny": True, "coding": True}
        
        print(f"Running mood generation 5 times for {personality_name}")
        print(f"Context: {test_context}")
        print()
        
        for i in range(1, 6):
            print(f"Run {i}:")
            mood_influences, mood_data = generate_mood_context_with_details(personality_name, test_context)
            
            activated = mood_data.get('moods_activated', [])
            triggered = len([m for m in mood_data.get('moods_checked', []) if m.get('triggered')])
            
            print(f"   Triggered: {triggered}, Activated: {len(activated)} ({activated})")
            
            if mood_influences:
                print(f"   Influence: \"{mood_influences[:80]}...\"")
            else:
                print(f"   Influence: None")
            print()
        
    except Exception as e:
        print(f"❌ Demonstration failed: {e}")


if __name__ == "__main__":
    # Import datetime here so it's available for the test
    from datetime import datetime
    
    print("🚀 Enhanced LLM Logging Test Suite")
    print("=" * 60)
    
    # Run main test
    success = test_enhanced_logging()
    
    if success:
        # Run probability demonstration
        demonstrate_mood_probabilities()
        
        print("\n" + "=" * 60)
        print("🎯 Next Steps:")
        print("1. Check the web interface Logs section to see enhanced displays")
        print("2. Look for 🧠 and 🏷️ indicators next to log entries")
        print("3. Click 'View Full Details' to see mood probabilities")
        print("4. Test with different personalities and contexts")
        print("\n💡 The mood system now captures detailed activation data")
        print("   and adds extractable tags to responses for analysis!")
        
    else:
        print("\n❌ Test failed. Check the error messages above.")
        sys.exit(1) 