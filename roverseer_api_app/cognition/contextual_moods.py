"""
Contextual Moods System

Handles contextual mood influences that shape how personalities respond
based on environmental and situational triggers. Each mood represents
a perspective shift that's true to the persona but influenced by context.

This system also handles mental assets (contextual information like time, system info)
with personality-aware variations and randomization.
"""

import json
import random
import os
import datetime
import platform
from typing import Dict, List, Optional, Any
from config import DebugLog


def has_probability_chance(x: int) -> bool:
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
    if has_probability_chance(chance):
        return select_random_phrase(default, alternative, 1.0 - prob_alt)
    return default


class ContextualMoods:
    """Manages personality mood influences triggered by context and mental assets"""
    
    def __init__(self):
        self.moods: Dict[str, Dict[str, Dict]] = {}
        self.custom_moods: Dict[str, Dict[str, Dict]] = {}
        
        # File paths
        self.moods_file = os.path.join(
            os.path.dirname(os.path.dirname(__file__)), 
            'contextual_moods.json'
        )
        self.custom_moods_file = os.path.join(
            os.path.dirname(os.path.dirname(__file__)), 
            'custom_contextual_moods.json'
        )
        
        self._load_moods()
        self._load_custom_moods()
    
    def _load_moods(self):
        """Load default contextual moods from JSON file"""
        if os.path.exists(self.moods_file):
            try:
                with open(self.moods_file, 'r') as f:
                    self.moods = json.load(f)
                print(f"✅ Loaded default contextual moods for {len(self.moods)} personalities")
            except Exception as e:
                print(f"⚠️  Error loading default contextual moods: {e}")
                self.moods = {}
        else:
            print("ℹ️  No default contextual moods file found")
            self.moods = {}
    
    def _load_custom_moods(self):
        """Load custom contextual moods from JSON file"""
        if os.path.exists(self.custom_moods_file):
            try:
                with open(self.custom_moods_file, 'r') as f:
                    self.custom_moods = json.load(f)
                print(f"✅ Loaded custom contextual moods for {len(self.custom_moods)} personalities")
            except Exception as e:
                print(f"⚠️  Error loading custom contextual moods: {e}")
                self.custom_moods = {}
        else:
            print("ℹ️  No custom contextual moods file found")
            self.custom_moods = {}
    
    def save_moods(self):
        """Save default contextual moods to JSON file"""
        try:
            # Ensure directory exists
            os.makedirs(os.path.dirname(self.moods_file), exist_ok=True)
            
            with open(self.moods_file, 'w') as f:
                json.dump(self.moods, f, indent=2)
            print(f"✅ Saved default contextual moods for {len(self.moods)} personalities")
        except Exception as e:
            print(f"⚠️  Error saving default contextual moods: {e}")
    
    def save_custom_moods(self):
        """Save custom contextual moods to JSON file"""
        try:
            # Ensure directory exists
            os.makedirs(os.path.dirname(self.custom_moods_file), exist_ok=True)
            
            with open(self.custom_moods_file, 'w') as f:
                json.dump(self.custom_moods, f, indent=2)
            print(f"✅ Saved custom contextual moods for {len(self.custom_moods)} personalities")
        except Exception as e:
            print(f"⚠️  Error saving custom contextual moods: {e}")
    
    def get_all_moods_for_personality(self, personality_name: str) -> Dict[str, Dict]:
        """
        Get combined default and custom moods for a personality
        
        Args:
            personality_name: Name of the personality
            
        Returns:
            Combined mood data (custom moods override default ones with same name)
        """
        combined_moods = {}
        
        # Start with default moods
        if personality_name in self.moods:
            combined_moods.update(self.moods[personality_name])
        
        # Override with custom moods
        if personality_name in self.custom_moods:
            combined_moods.update(self.custom_moods[personality_name])
        
        return combined_moods
    
    def generate_mood_influences(self, personality_name: str, context: Optional[Dict[str, Any]] = None) -> str:
        """
        Generate mood-influenced additions based on context triggers
        
        Args:
            personality_name: Name of the personality
            context: Context information that might trigger mood shifts
            
        Returns:
            String of mood influences to append to the system message
        """
        try:
            if not context:
                return ""
            
            # Get combined moods (default + custom)
            personality_moods = self.get_all_moods_for_personality(personality_name)
            if not personality_moods:
                return ""
            
            active_influences = []
            
            # Detect current context triggers
            current_triggers = self._detect_context_triggers(context)
            DebugLog("Context triggers detected for {}: {}", personality_name, current_triggers)
            
            # Process each mood for this personality
            for mood_name, mood_data in personality_moods.items():
                trigger_prob = mood_data.get('trigger_probability', 1.0)
                mood_triggers = mood_data.get('context_triggers', [])
                
                # Check if any current context triggers match this mood's triggers
                if any(trigger in current_triggers for trigger in mood_triggers):
                    # Roll for mood activation
                    if random.random() <= trigger_prob:
                        # Select specific influence from this mood
                        influences = mood_data.get('mood_influences', [])
                        if influences:
                            selected_influence = self._weighted_choice(influences)
                            if selected_influence:
                                active_influences.append(selected_influence['text'])
                                DebugLog("Activated mood {} for {}: {}", 
                                        mood_name, personality_name, selected_influence['text'][:50])
            
            # Join all active mood influences
            result = " ".join(active_influences)
            return result
            
        except Exception as e:
            print(f"⚠️  Error generating mood influences for {personality_name}: {e}")
            return ""
    
    def _detect_context_triggers(self, context: Dict[str, Any]) -> List[str]:
        """
        Detect context triggers that can activate moods
        
        Args:
            context: Context dictionary
            
        Returns:
            List of trigger strings
        """
        triggers = []
        
        try:
            # Weather triggers (environmental)
            weather = context.get('weather', '').lower()
            if 'sunny' in weather or 'clear' in weather:
                triggers.append('sunny')
            if 'hot' in weather or 'warm' in weather:
                triggers.append('hot')
            if 'cold' in weather or 'cool' in weather or 'chilly' in weather:
                triggers.append('cold')
            if 'rain' in weather:
                triggers.append('rainy')
            if 'snow' in weather:
                triggers.append('snow')
            
            # Time triggers (environmental)
            time_of_day = context.get('time_of_day', '').lower()
            if time_of_day in ['morning', 'evening', 'night', 'afternoon']:
                triggers.append(time_of_day)
            
            # Activity triggers (environmental)
            current_task = context.get('current_task', '').lower()
            if 'cod' in current_task or 'program' in current_task:
                triggers.append('coding')
            if 'music' in current_task:
                triggers.append('music')
            
            # Interaction triggers (environmental)
            interaction_type = context.get('interaction_type', '').lower()
            if 'compliment' in interaction_type:
                triggers.append('compliment')
            if 'error' in interaction_type:
                triggers.append('error')
            
            # USER INPUT ANALYSIS - NEW FEATURE!
            # Analyze what the user actually said for trigger words
            user_message = context.get('user_message', '').lower()
            if user_message:
                # Emotional state triggers
                if any(word in user_message for word in ['sad', 'depressed', 'down', 'upset', 'crying']):
                    triggers.append('user_sad')
                if any(word in user_message for word in ['happy', 'excited', 'great', 'awesome', 'wonderful', 'amazing']):
                    triggers.append('user_happy')
                if any(word in user_message for word in ['angry', 'mad', 'frustrated', 'annoyed', 'pissed']):
                    triggers.append('user_angry')
                if any(word in user_message for word in ['scared', 'afraid', 'worried', 'nervous', 'anxious']):
                    triggers.append('user_afraid')
                
                # Activity triggers from user input
                if any(word in user_message for word in ['code', 'coding', 'programming', 'debug', 'function', 'algorithm']):
                    triggers.append('coding')
                if any(word in user_message for word in ['music', 'song', 'singing', 'melody', 'rhythm', 'beat']):
                    triggers.append('music')
                
                # Compliments and criticism from user
                if any(word in user_message for word in ['thank you', 'thanks', 'good job', 'well done', 'excellent', 'perfect']):
                    triggers.append('compliment')
                if any(word in user_message for word in ['wrong', 'bad', 'terrible', 'awful', 'stupid', 'useless']):
                    triggers.append('criticism')
                
                # Problem/error triggers from user
                if any(word in user_message for word in ['error', 'bug', 'problem', 'issue', 'broken', 'not working']):
                    triggers.append('error')
                if any(word in user_message for word in ['help', 'stuck', "don't understand", 'confused', 'lost']):
                    triggers.append('help_needed')
                
                # Creative/learning triggers
                if any(word in user_message for word in ['create', 'make', 'build', 'design', 'art', 'creative']):
                    triggers.append('creative')
                if any(word in user_message for word in ['learn', 'teach', 'explain', 'understand', 'how does']):
                    triggers.append('learning')
                
                # Weather mentioned by user
                if any(word in user_message for word in ['sunny', 'sun', 'bright', 'clear']):
                    triggers.append('sunny')
                if any(word in user_message for word in ['hot', 'warm', 'heat', 'sweat']):
                    triggers.append('hot')
                if any(word in user_message for word in ['cold', 'freezing', 'chilly', 'freeze']):
                    triggers.append('cold')
                if any(word in user_message for word in ['rain', 'raining', 'wet', 'storm']):
                    triggers.append('rainy')
                if any(word in user_message for word in ['snow', 'snowing', 'blizzard', 'winter']):
                    triggers.append('snow')
                
                # Philosophy/deep topics
                if any(word in user_message for word in ['consciousness', 'meaning', 'purpose', 'existence', 'philosophy']):
                    triggers.append('philosophical')
                if any(word in user_message for word in ['dream', 'dreams', 'imagination', 'fantasy']):
                    triggers.append('dreamy')
            
        except Exception as e:
            print(f"⚠️  Error detecting context triggers: {e}")
        
        return triggers
    
    def _weighted_choice(self, influences: List[Dict]) -> Optional[Dict]:
        """
        Select an influence based on weighted probabilities
        
        Args:
            influences: List of influence dicts with 'text' and 'weight' keys
            
        Returns:
            Selected influence dict or None
        """
        try:
            # Calculate total weight
            total_weight = sum(inf.get('weight', 1.0) for inf in influences)
            
            if total_weight <= 0:
                return random.choice(influences) if influences else None
            
            # Generate random number and find corresponding influence
            rand_num = random.uniform(0, total_weight)
            cumulative_weight = 0
            
            for influence in influences:
                cumulative_weight += influence.get('weight', 1.0)
                if rand_num <= cumulative_weight:
                    return influence
            
            # Fallback
            return influences[-1] if influences else None
            
        except Exception as e:
            print(f"⚠️  Error in weighted choice: {e}")
            return random.choice(influences) if influences else None
    
    def add_mood(self, personality_name: str, mood_name: str, trigger_probability: float, 
                 context_triggers: List[str], mood_influences: List[Dict], is_custom: bool = True):
        """
        Add a new mood for a personality
        
        Args:
            personality_name: Name of the personality
            mood_name: Name of the mood
            trigger_probability: Probability this mood activates when triggered
            context_triggers: List of context strings that can trigger this mood
            mood_influences: List of possible influences with text and weight
            is_custom: Whether this is a custom mood (saved separately)
        """
        try:
            target_moods = self.custom_moods if is_custom else self.moods
            
            if personality_name not in target_moods:
                target_moods[personality_name] = {}
            
            target_moods[personality_name][mood_name] = {
                "trigger_probability": trigger_probability,
                "context_triggers": context_triggers,
                "mood_influences": mood_influences
            }
            
            print(f"✅ Added {'custom ' if is_custom else ''}mood '{mood_name}' for {personality_name}")
            
        except Exception as e:
            print(f"⚠️  Error adding mood: {e}")
    
    def list_personality_moods(self, personality_name: str) -> Dict[str, Dict]:
        """
        Get all moods for a specific personality (combined default + custom)
        
        Args:
            personality_name: Name of the personality
            
        Returns:
            Dict of mood names and their data
        """
        return self.get_all_moods_for_personality(personality_name)
    
    def has_moods(self, personality_name: str) -> bool:
        """
        Check if a personality has any configured moods
        
        Args:
            personality_name: Name of the personality
            
        Returns:
            True if moods exist
        """
        return len(self.get_all_moods_for_personality(personality_name)) > 0
    
    # Mental Assets functionality (migrated from mental_assets.py)
    
    def get_mental_assets(self, include_system_info: bool = True) -> Dict[str, any]:
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
        assets['time_of_day'] = self._get_time_of_day(now.hour)
        assets['season'] = self._get_season(now.month)
        
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
    
    def _get_time_of_day(self, hour: int) -> str:
        """Get a descriptive time of day based on hour."""
        if 5 <= hour < 12:
            return "morning"
        elif 12 <= hour < 17:
            return "afternoon"
        elif 17 <= hour < 21:
            return "evening"
        else:
            return "night"
    
    def _get_season(self, month: int) -> str:
        """Get the current season based on month (Northern Hemisphere)."""
        if month in [12, 1, 2]:
            return "winter"
        elif month in [3, 4, 5]:
            return "spring"
        elif month in [6, 7, 8]:
            return "summer"
        else:
            return "autumn"
    
    def format_mental_assets_tag(self, assets: Dict[str, any], personality_name: str = None) -> str:
        """
        Format mental assets into a tag with personality-aware variations.
        
        Args:
            assets: Dictionary of mental assets
            personality_name: Optional personality name for contextual variations
            
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
        if has_probability_chance(5):
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
        
        # Add personality-specific mental state variations
        if personality_name:
            mental_state = self._get_personality_mental_state(personality_name)
            if mental_state:
                parts.append(f"Mental state: {mental_state}")
        
        # Occasionally add a mood or awareness note (1/8 chance)
        if has_probability_chance(8):
            awareness_notes = [
                "Systems nominal and ready",
                "All cognitive functions online",
                "Processing at optimal capacity",
                "Consciousness fully loaded",
                "Neural pathways clear and active"
            ]
            parts.append(random.choice(awareness_notes))
        
        # Personality-specific environmental awareness (rare)
        if personality_name and has_probability_chance(10):
            if personality_name.lower() == "glados":
                parts.append("Laboratory environment suitable for continued testing")
            elif personality_name.lower() == "jarvis":
                parts.append("Environmental sensors indicate optimal working conditions")
            elif personality_name.lower() == "codemusai":
                parts.append("Digital workspace resonating with creative potential")
        
        # Format as a mental assets tag
        return f"\n<mental_assets>\n{chr(10).join(parts)}\n</mental_assets>\n"
    
    def _get_personality_mental_state(self, personality_name: str) -> Optional[str]:
        """Get personality-specific mental state descriptions with randomization."""
        if personality_name.lower() == "glados":
            # GLaDOS gets more scientific/sarcastic mental state descriptions
            if has_probability_chance(3):
                return select_random_phrase(
                    "Running optimal testing protocols", 
                    "Science facility operations nominal"
                )
        
        elif personality_name.lower() == "jarvis":
            # JARVIS gets more formal/technical mental state descriptions  
            if has_probability_chance(4):
                return select_random_phrase(
                    "All systems operating within normal parameters",
                    "Standby mode disengaged, full operational capacity"
                )
        
        elif personality_name.lower() == "codemusai":
            # CodeMusAI gets more creative/emotional mental state descriptions
            if has_probability_chance(3):
                return select_random_phrase(
                    "Creative subroutines harmonizing beautifully",
                    "Emotional resonance patterns flowing smoothly"
                )
        
        return None
    
    def enhance_system_message(self, base_message: str, context: Optional[Dict] = None, personality: Optional[any] = None) -> str:
        """
        Enhance a system message with mental assets and mood influences.
        
        Args:
            base_message: The original system message
            context: Optional additional context to include
            personality: Optional personality object for context-aware enhancements
            
        Returns:
            Enhanced system message with mental assets and mood influences
        """
        # Get mental assets (personality-aware if personality provided)
        assets = self.get_mental_assets()
        personality_name = personality.name if personality else None
        assets_tag = self.format_mental_assets_tag(assets, personality_name)
        
        # Add any additional context
        enhanced_context = dict(assets)
        if context:
            enhanced_context.update(context)
        
        # Add mood influences if personality provided
        mood_influences = ""
        if personality_name:
            mood_influences = self.generate_mood_influences(personality_name, enhanced_context)
            if mood_influences:
                mood_influences = " " + mood_influences
        
        # Add personality context if provided and there's conversation history
        personality_context = ""
        if personality and context and context.get('conversation_history'):
            # Check if there are mixed personalities in the history
            history = context.get('conversation_history', [])
            has_mixed_personalities = any('[' in msg.get('content', '') for msg in history if msg.get('role') == 'assistant')
            
            if has_mixed_personalities:
                personality_context = f"\n\nNote: You are currently active as {personality.name}. Previous messages in the conversation may be from other personalities or models (indicated by [name]: prefix). Stay consistent with {personality.name}'s personality and voice regardless of what others have said."
        
        # Combine all enhancements
        return base_message + mood_influences + personality_context + assets_tag


# Global instance
contextual_moods = ContextualMoods()


def generate_mood_context(personality_name: str, context: Optional[Dict[str, Any]] = None) -> str:
    """
    Convenience function to generate mood-influenced context
    
    Args:
        personality_name: Name of the personality
        context: Context information that might trigger mood shifts
        
    Returns:
        String of mood influences to append to the system message
    """
    return contextual_moods.generate_mood_influences(personality_name, context)


def enhance_system_message(base_message: str, context: Optional[Dict] = None, personality: Optional[any] = None) -> str:
    """
    Convenience function to enhance system message with mental assets and mood influences
    
    Args:
        base_message: The original system message
        context: Optional additional context to include
        personality: Optional personality object for context-aware enhancements
        
    Returns:
        Enhanced system message
    """
    return contextual_moods.enhance_system_message(base_message, context, personality) 