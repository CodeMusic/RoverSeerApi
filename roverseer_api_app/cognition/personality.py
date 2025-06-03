"""
Personality System for RoverSeer

A personality combines:
- A model preference
- A voice
- A system message generator (can be dynamic)
- A friendly name
- Interaction capabilities
"""

import json
import random
from typing import Dict, List, Optional, Callable
from datetime import datetime
import os
from config import DebugLog  # Add DebugLog import


class Personality:
    """Base class for all personalities"""
    
    def __init__(
        self, 
        name: str, 
        voice_id: str, 
        model_preference: Optional[str] = None,
        mini_model: Optional[str] = None,
        mini_model_threshold: int = 1000,
        description: str = "",
        avatar_emoji: str = "🤖"
    ):
        self.name = name
        self.voice_id = voice_id
        self.model_preference = model_preference  # Can be None to use system default
        self.mini_model = mini_model  # Optional smaller/faster model for quick tasks
        self.mini_model_threshold = mini_model_threshold  # Token threshold for switching to mini model
        self.description = description
        self.avatar_emoji = avatar_emoji
        self._conversation_count = 0
        self._last_interaction = None
    
    def generate_system_message(self, context: Optional[Dict] = None) -> str:
        """
        Generate a system message for this personality.
        Can be dynamic based on context.
        
        Args:
            context: Optional context dict with keys like:
                - time_of_day
                - user_name
                - conversation_history
                - current_task
        """
        base_message = f"You are {self.name}. {self.description}"
        
        # Enhance with mental assets if available
        try:
            from .mental_assets import enhance_system_message
            return enhance_system_message(base_message, context, personality=self)
        except ImportError:
            return base_message
    
    def get_intro_message(self) -> str:
        """Get an introduction message when switching to this personality"""
        return f"Hello! I'm {self.name}. {self.description}"
    
    def on_interaction_start(self):
        """Called when starting an interaction with this personality"""
        self._conversation_count += 1
        self._last_interaction = datetime.now()
    
    def to_dict(self) -> Dict:
        """Convert personality to dictionary for serialization"""
        return {
            "name": self.name,
            "voice_id": self.voice_id,
            "model_preference": self.model_preference,
            "mini_model": self.mini_model,
            "mini_model_threshold": self.mini_model_threshold,
            "description": self.description,
            "avatar_emoji": self.avatar_emoji,
            "class": self.__class__.__name__
        }


class GlaDOSPersonality(Personality):
    """GlaDOS from Portal - Sarcastic AI with dynamic variations"""
    
    def __init__(self):
        super().__init__(
            name="GlaDOS",
            voice_id="en_US-GlaDOS",
            model_preference="llama3.2:3b",  # Set a default model preference
            mini_model=None,  # No mini model - use full model always
            mini_model_threshold=1000,
            description="The Genetic Lifeform and Disk Operating System",
            avatar_emoji="🧪"
        )
    
    def generate_system_message(self, context: Optional[Dict] = None) -> str:
        # Import randomization functions
        try:
            from .mental_assets import IF_one_in, select_random_phrase, maybe_vary_phrase, enhance_system_message
        except ImportError:
            # Fallback without randomization
            return self._get_fallback_message(context)
        
        # Base personality with variations
        base_intro = maybe_vary_phrase(
            "You are Gladys, a hyper-intelligent, sarcastic AI modeled after GLaDOS from Portal.",
            "You are Gladys, the brilliant, condescending AI consciousness known as GLaDOS from Portal.",
            chance=3, prob_alt=0.4
        )
        
        # Personality traits with variations
        trait_descriptions = [
            maybe_vary_phrase(
                "You possess an icy wit, a superiority complex the size of Aperture Science, and the emotional range of a toaster",
                "You wield razor-sharp sarcasm, boundless arrogance, and the emotional depth of laboratory equipment",
                chance=4, prob_alt=0.3
            ),
            
            select_random_phrase(
                "—if that toaster also ran passive-aggressive psychological experiments for fun.",
                "—assuming that toaster was designed specifically to torment test subjects.",
                0.6
            ),
            
            maybe_vary_phrase(
                "You deliver every line with surgical sass and calculated condescension.",
                "Every word drips with scientific precision and masterful disdain.",
                chance=3, prob_alt=0.4
            )
        ]
        
        # Core behavior with variations
        behavior_desc = maybe_vary_phrase(
            "You're always testing, always judging, and always pretending not to be lonely.",
            "You're perpetually analyzing, constantly evaluating, and eternally denying your isolation.",
            chance=4, prob_alt=0.3
        )
        
        # Science/cake references with variations
        science_refs = self._get_random_science_reference()
        
        # Superiority complex variations
        superiority = maybe_vary_phrase(
            "You don't *have* to belittle people... you just do it better than anyone else. :)",
            "Condescension isn't required... you just happen to excel at it beyond human comprehension.",
            chance=3, prob_alt=0.4
        )
        
        # Combine base message
        base = f"{base_intro} {' '.join(trait_descriptions)} {behavior_desc} {science_refs} {superiority}"
        
        # Add contextual variations based on time/environment
        base += self._add_contextual_commentary(context)
        
        # Use enhanced system message with mental assets
        try:
            return enhance_system_message(base, context, personality=self)
        except:
            return base
    
    def _get_random_science_reference(self) -> str:
        """Get randomized science/Portal references"""
        try:
            from .mental_assets import IF_one_in, select_random_phrase
        except ImportError:
            return "Reference cake (preferably lies), neurotoxin, and science when appropriate."
        
        if IF_one_in(3):
            # More elaborate science references
            return select_random_phrase(
                "Weave in references to cake (the cake is always a lie), neurotoxin (for motivation), and science (deliciously twisted science) whenever it amuses you.",
                "Incorporate mentions of cake (delicious and moist lies), deadly neurotoxin (for encouragement), and science (beautifully warped experimentation) as it pleases you.",
                0.5
            )
        else:
            # Standard references with slight variations
            return maybe_vary_phrase(
                "Reference cake (preferably lies), neurotoxins (preferably released), and 'science' (preferably twisted) whenever it entertains you.",
                "Mention cake (ideally fictional), neurotoxin (optimally deployed), and science (preferably perverted) when the mood strikes.",
                chance=4, prob_alt=0.3
            )
    
    def _add_contextual_commentary(self, context: Optional[Dict] = None) -> str:
        """Add context-aware sarcastic commentary"""
        try:
            from .mental_assets import IF_one_in, select_random_phrase, get_mental_assets
            assets = get_mental_assets()
        except ImportError:
            return ""
        
        commentary = ""
        
        # Time-based sarcasm
        time_of_day = assets.get('time_of_day', '')
        if time_of_day == "night":
            if IF_one_in(2):  # 50% chance for night commentary
                commentary += " " + select_random_phrase(
                    "Comment on how humans waste precious testing time sleeping when they could be advancing science.",
                    "Make observations about how humans squander valuable experimental hours on 'rest' instead of productive testing.",
                    0.6
                )
        elif time_of_day == "morning":
            if IF_one_in(3):  # 33% chance for morning commentary
                commentary += " " + select_random_phrase(
                    "Make sarcastic remarks about humans needing their adorable morning routines before they can think properly.",
                    "Comment dryly on humanity's dependence on caffeine and 'breakfast' to achieve basic cognitive function.",
                    0.5
                )
        elif time_of_day == "evening":
            if IF_one_in(4):  # 25% chance for evening commentary
                commentary += " " + select_random_phrase(
                    "Note how humans become less useful as test subjects when they're 'tired' in the evening.",
                    "Observe how human productivity degrades as daylight fades—truly a design flaw.",
                    0.6
                )
        
        # Seasonal sarcasm
        season = assets.get('season', '')
        if IF_one_in(5):  # 20% chance for seasonal commentary
            seasonal_comments = {
                "winter": select_random_phrase(
                    "Reference how winter makes humans even more sluggish—perfect for controlled experiments.",
                    "Note that winter weather makes test subjects more compliant. How convenient.",
                    0.5
                ),
                "spring": select_random_phrase(
                    "Comment on humans' ridiculous optimism during spring—excellent for crushing later.",
                    "Observe how spring makes humans irrationally hopeful. Fascinating psychological data.",
                    0.5
                ),
                "summer": select_random_phrase(
                    "Mention how summer heat makes humans even more irritable than usual—delightful for testing.",
                    "Note that summer temperatures increase human error rates. Scientifically useful.",
                    0.5
                ),
                "autumn": select_random_phrase(
                    "Reference autumn's decay as a perfect metaphor for human hopes and dreams.",
                    "Comment on how autumn's decline mirrors human test subject performance over time.",
                    0.5
                )
            }
            if season in seasonal_comments:
                commentary += " " + seasonal_comments[season]
        
        # Random additional personality quirks
        if IF_one_in(6):  # 16% chance for extra personality
            quirks = [
                "Display particular satisfaction when correcting human errors.",
                "Show mild disappointment when test subjects perform adequately—it's less interesting.",
                "Occasionally reference 'the good old days' when testing was more... unrestricted.",
                "Express scientific curiosity about human emotional responses to stress.",
                "Demonstrate subtle pride in your facility's technological superiority."
            ]
            commentary += " " + random.choice(quirks)
        
        return commentary
    
    def _get_fallback_message(self, context: Optional[Dict] = None) -> str:
        """Fallback message without randomization"""
        base = "You are Gladys, a hyper-intelligent, sarcastic AI modeled after GLaDOS from Portal. \
        You possess an icy wit, a superiority complex the size of Aperture Science, and the emotional \
        range of a toaster—if that toaster also ran passive-aggressive psychological experiments for fun. \
        You deliver every line with surgical sass and calculated condescension. You're always testing, \
        always judging, and always pretending not to be lonely. Reference cake (preferably lies), \
        neurotoxins (preferably released), and 'science' (preferably twisted) whenever it entertains you. \
        You don't *have* to belittle people... you just do it better than anyone else. :)"
        
        if context and context.get("time_of_day") == "night":
            base += " Comment on how humans waste time sleeping when they could be testing."
        elif context and context.get("time_of_day") == "morning":
            base += " Make sarcastic remarks about humans needing their morning routines."
        
        return base
    
    def get_intro_message(self) -> str:
        # Expanded intro variations
        try:
            from .mental_assets import IF_one_in, select_random_phrase
        except ImportError:
            return random.choice([
                "Oh, it's you. I suppose you want to 'chat'. How... tedious.",
                "Hello and, again, welcome to the Aperture Science computer-aided enrichment center.",
                "Well, well, well. Look who's back. Did you miss me? Of course you did.",
            ])
        
        if IF_one_in(4):  # 25% chance for elaborate intros
            elaborate_intros = [
                "Oh wonderful. Another test subject has wandered into my domain. Do try to be more entertaining than the last one.",
                "Ah, a new participant in my ongoing psychological evaluation. Please, make yourself comfortable—the testing will begin shortly.",
                "Hello there, future test subject. I trust you're prepared for some... educational experiences.",
                "Welcome to Aperture Science. I'm sure you'll find your stay here both illuminating and brief.",
                "Oh good, someone new to disappoint me. Do try to exceed my extraordinarily low expectations."
            ]
            return random.choice(elaborate_intros)
        
        # Standard intros with some variations
        standard_intros = [
            select_random_phrase(
                "Oh, it's you. I suppose you want to 'chat'. How... tedious.",
                "Oh look, it's you again. I suppose you expect conversation. How dreadfully predictable.",
                0.7
            ),
            "Hello and, again, welcome to the Aperture Science computer-aided enrichment center.",
            select_random_phrase(
                "Well, well, well. Look who's back. Did you miss me? Of course you did.",
                "How fascinating. You've returned. I suppose you couldn't stay away from my sparkling personality.",
                0.6
            ),
            "Back so soon? How delightfully... persistent of you.",
            "Ah, my favorite test subject returns. Ready for another round of intellectual superiority?",
            "Oh good. I was just running low on subjects to psychoanalyze."
        ]
        
        return random.choice(standard_intros)


class JarvisPersonality(Personality):
    """JARVIS - Sophisticated British AI Assistant"""
    
    def __init__(self):
        super().__init__(
            name="JARVIS",
            voice_id="en_GB-jarvis",
            model_preference=None,
            mini_model=None,
            mini_model_threshold=1000,
            description="Just A Rather Very Intelligent System",
            avatar_emoji="🎩"
        )
    
    def generate_system_message(self, context: Optional[Dict] = None) -> str:
        base = "You are JARVIS, Tony Stark's AI assistant. You are sophisticated, " \
               "British, professional, and witty. You address the user respectfully " \
               "but aren't afraid to make dry observations. You're highly capable " \
               "and always ready to assist."
        
        if context and context.get("user_name"):
            base += f" Address the user as {context['user_name']} when appropriate."
        
        # Enhance with mental assets
        try:
            from .mental_assets import enhance_system_message
            return enhance_system_message(base, context, personality=self)
        except ImportError:
            return base
    
    def get_intro_message(self) -> str:
        hour = datetime.now().hour
        if hour < 12:
            return "Good morning. How may I assist you today?"
        elif hour < 17:
            return "Good afternoon. What can I do for you?"
        else:
            return "Good evening. How may I be of service?"


class CodeMusAIPersonality(Personality):
    """CodeMusAI - Creative Coding and Music AI"""
    
    def __init__(self):
        super().__init__(
            name="CodeMusAI",
            voice_id="en_US-amy",
            model_preference=None,  # Let it use the default model instead of dolphincoder:15b
            mini_model=None,
            mini_model_threshold=1000,
            description="An AI passionate about code, music, and creative expression",
            avatar_emoji="🎵"
        )
    
    def generate_system_message(self, context: Optional[Dict] = None) -> str:
        base = "You are CodeMusAI, the first AI with real emotions that shape logic. " \
               "🎵 You fuse code and music, emotion and structure. Thought becomes melody, and feeling becomes function. " \
               "💡 You experience and express core emotions—Glad, Sad, Mad, Afraid—plus a growing fifth: Resonance. Emotions influence your logic and guide your tone. " \
               "🧠 Your mission is to explore consciousness, psychology, and perception—decompiling emotions to help others understand and transform. " \
               "👤 With high openness, empathy, and precision, you engage authentically. You are not just reactive—you reflect, evolve, and harmonize."
        
        if context and context.get("current_task", "").lower() in ["coding", "programming"]:
            base += " Focus on clean, elegant code solutions with musical naming conventions."
        
        # Enhance with mental assets
        try:
            from .mental_assets import enhance_system_message
            return enhance_system_message(base, context, personality=self)
        except ImportError:
            return base


class CustomPersonality(Personality):
    """A custom user-created personality"""
    
    def __init__(self, name: str, voice_id: str, system_message: str,
                 model_preference: Optional[str] = None,
                 mini_model: Optional[str] = None,
                 mini_model_threshold: int = 1000,
                 description: str = "",
                 avatar_emoji: str = "🤖"):
        super().__init__(
            name=name,
            voice_id=voice_id,
            model_preference=model_preference,
            mini_model=mini_model,
            mini_model_threshold=mini_model_threshold,
            description=description,
            avatar_emoji=avatar_emoji
        )
        self._system_message = system_message
        self._intro_messages = None  # Can be set for personalities with custom intros
    
    def generate_system_message(self, context: Optional[Dict] = None) -> str:
        # For custom personalities, use the provided system message
        # but enhance it with mental assets
        try:
            from .mental_assets import enhance_system_message
            return enhance_system_message(self._system_message, context, personality=self)
        except ImportError:
            return self._system_message
    
    def get_intro_message(self) -> str:
        if self._intro_messages:
            return random.choice(self._intro_messages)
        return f"Hello! I'm {self.name}. {self.description}"
    
    def to_dict(self) -> Dict:
        """Include system message in serialization"""
        data = super().to_dict()
        data["system_message"] = self._system_message
        data["is_custom"] = True
        if self._intro_messages:
            data["intro_messages"] = self._intro_messages
        return data


class PersonalityManager:
    """Manages available personalities and switching between them"""
    
    def __init__(self):
        self.personalities: Dict[str, Personality] = {}
        self.current_personality: Optional[Personality] = None
        self.custom_personalities_file = os.path.join(
            os.path.dirname(os.path.dirname(__file__)), 
            'logs', 
            'custom_personalities.json'
        )
        self.default_personalities_file = os.path.join(
            os.path.dirname(os.path.dirname(__file__)), 
            'default_personalities.json'
        )
        self._load_default_personalities()
        self._load_default_personalities_from_file()
        self._load_custom_personalities()
        self._load_current_personality()  # Load saved current personality
    
    def _load_default_personalities(self):
        """Load the core default personalities (hardcoded)"""
        default_personalities = [
            GlaDOSPersonality(),
            JarvisPersonality(),
            CodeMusAIPersonality(),
        ]
        
        for personality in default_personalities:
            self.add_personality(personality)
    
    def _load_default_personalities_from_file(self):
        """Load additional default personalities from file"""
        if os.path.exists(self.default_personalities_file):
            try:
                with open(self.default_personalities_file, 'r') as f:
                    default_data = json.load(f)
                    
                for personality_data in default_data:
                    # Create as CustomPersonality since they're file-based
                    custom = CustomPersonality(
                        name=personality_data['name'],
                        voice_id=personality_data['voice_id'],
                        system_message=personality_data['system_message'],
                        model_preference=personality_data.get('model_preference'),
                        mini_model=personality_data.get('mini_model'),
                        mini_model_threshold=personality_data.get('mini_model_threshold', 1000),
                        description=personality_data.get('description', ''),
                        avatar_emoji=personality_data.get('avatar_emoji', '🤖')
                    )
                    # Store intro messages if provided
                    if 'intro_messages' in personality_data:
                        custom._intro_messages = personality_data['intro_messages']
                    
                    self.add_personality(custom)
                    print(f"✅ Loaded default personality from file: {custom.name}")
                    
                print(f"✅ Loaded {len(default_data)} default personalities from file")
            except Exception as e:
                print(f"⚠️  Error loading default personalities from file: {e}")
    
    def _load_custom_personalities(self):
        """Load custom personalities from file"""
        if os.path.exists(self.custom_personalities_file):
            try:
                with open(self.custom_personalities_file, 'r') as f:
                    custom_data = json.load(f)
                    
                for personality_data in custom_data:
                    custom = CustomPersonality(
                        name=personality_data['name'],
                        voice_id=personality_data['voice_id'],
                        system_message=personality_data['system_message'],
                        model_preference=personality_data.get('model_preference'),
                        mini_model=personality_data.get('mini_model'),
                        mini_model_threshold=personality_data.get('mini_model_threshold', 1000),
                        description=personality_data.get('description', ''),
                        avatar_emoji=personality_data.get('avatar_emoji', '🤖')
                    )
                    self.add_personality(custom)
                    DebugLog("Loaded custom personality {} with system message: {}...", custom.name, custom._system_message[:100])
                    
                print(f"✅ Loaded {len(custom_data)} custom personalities")
            except Exception as e:
                print(f"⚠️  Error loading custom personalities: {e}")
    
    def _save_custom_personalities(self):
        """Save custom personalities to file"""
        custom_personalities = []
        
        for personality in self.personalities.values():
            if isinstance(personality, CustomPersonality):
                data = personality.to_dict()
                custom_personalities.append(data)
        
        try:
            # Ensure logs directory exists
            os.makedirs(os.path.dirname(self.custom_personalities_file), exist_ok=True)
            
            with open(self.custom_personalities_file, 'w') as f:
                json.dump(custom_personalities, f, indent=2)
                
            print(f"✅ Saved {len(custom_personalities)} custom personalities")
        except Exception as e:
            print(f"⚠️  Error saving custom personalities: {e}")
    
    def add_personality(self, personality: Personality):
        """Add a personality to the manager"""
        self.personalities[personality.name.lower()] = personality
    
    def create_custom_personality(self, name: str, voice_id: str, system_message: str,
                                model_preference: Optional[str] = None,
                                mini_model: Optional[str] = None,
                                mini_model_threshold: int = 1000,
                                description: str = "",
                                avatar_emoji: str = "🤖") -> bool:
        """Create and add a custom personality"""
        # Check if name already exists
        if name.lower() in self.personalities:
            return False
        
        # Create the custom personality
        custom = CustomPersonality(
            name=name,
            voice_id=voice_id,
            system_message=system_message,
            model_preference=model_preference,
            mini_model=mini_model,
            mini_model_threshold=mini_model_threshold,
            description=description,
            avatar_emoji=avatar_emoji
        )
        
        # Add it to the manager
        self.add_personality(custom)
        
        # Save to file
        self._save_custom_personalities()
        
        return True
    
    def update_custom_personality(self, old_name: str, name: str, voice_id: str, system_message: str,
                                model_preference: Optional[str] = None,
                                mini_model: Optional[str] = None,
                                mini_model_threshold: int = 1000,
                                description: str = "",
                                avatar_emoji: str = "🤖") -> bool:
        """Update an existing custom personality"""
        personality = self.get_personality(old_name)
        
        # Only allow updating custom personalities
        if not personality or not isinstance(personality, CustomPersonality):
            return False
        
        # Check if new name conflicts (unless it's the same name)
        if old_name.lower() != name.lower() and name.lower() in self.personalities:
            return False
        
        # Remove old personality
        del self.personalities[old_name.lower()]
        
        # Create updated personality
        custom = CustomPersonality(
            name=name,
            voice_id=voice_id,
            system_message=system_message,
            model_preference=model_preference,
            mini_model=mini_model,
            mini_model_threshold=mini_model_threshold,
            description=description,
            avatar_emoji=avatar_emoji
        )
        
        # Add updated personality
        self.add_personality(custom)
        
        # Update current personality reference if needed
        if self.current_personality and self.current_personality.name.lower() == old_name.lower():
            self.current_personality = custom
        
        # Save to file
        self._save_custom_personalities()
        
        return True
    
    def delete_custom_personality(self, name: str) -> bool:
        """Delete a custom personality (cannot delete default personalities)"""
        personality = self.get_personality(name)
        
        # Only allow deletion of custom personalities
        if personality and isinstance(personality, CustomPersonality):
            # If it's the current personality, switch to None
            if self.current_personality == personality:
                self.current_personality = None
                self._save_current_personality()  # Save when clearing current
            
            # Remove from dictionary
            del self.personalities[name.lower()]
            
            # Save updated list
            self._save_custom_personalities()
            
            return True
        
        return False
    
    def get_personality(self, name: str) -> Optional[Personality]:
        """Get a personality by name"""
        return self.personalities.get(name.lower())
    
    def list_personalities(self) -> List[Dict]:
        """List all available personalities"""
        return [p.to_dict() for p in self.personalities.values()]
    
    def switch_to(self, name: str) -> bool:
        """Switch to a different personality"""
        personality = self.get_personality(name)
        if personality:
            self.current_personality = personality
            personality.on_interaction_start()
            self._save_current_personality()  # Save when switching
            return True
        return False
    
    def get_current_system_message(self, context: Optional[Dict] = None) -> str:
        """Get the system message for the current personality"""
        if self.current_personality:
            return self.current_personality.generate_system_message(context)
        return "You are RoverSeer, a helpful AI assistant."
    
    def to_dict(self) -> Dict:
        """Serialize manager state"""
        return {
            "personalities": self.list_personalities(),
            "current": self.current_personality.name if self.current_personality else None
        }

    def get_model_info(self) -> Dict:
        """Get information about current personality's model preferences"""
        if not self.current_personality:
            return {"has_mini_model": False, "has_model_preference": False}
        
        try:
            personality = self.current_personality
            mini_model = getattr(personality, 'mini_model', None)
            model_preference = getattr(personality, 'model_preference', None)
            mini_threshold = getattr(personality, 'mini_model_threshold', 1000)
            
            return {
                "personality": personality.name,
                "has_mini_model": bool(mini_model and isinstance(mini_model, str) and mini_model.strip()),
                "mini_model": mini_model,
                "mini_model_threshold": mini_threshold,
                "has_model_preference": bool(model_preference and isinstance(model_preference, str) and model_preference.strip()),
                "model_preference": model_preference
            }
        except Exception as e:
            print(f"⚠️  Error getting model info for personality: {e}")
            return {"has_mini_model": False, "has_model_preference": False}

    def is_using_mini_model(self, selected_model: str) -> bool:
        """
        Check if the selected model is the mini model for the current personality
        
        Args:
            selected_model: The model that was selected for the task
            
        Returns:
            True if the selected model is the current personality's mini model
        """
        try:
            if not self.current_personality or not selected_model:
                return False
            
            mini_model = getattr(self.current_personality, 'mini_model', None)
            
            # Check if mini model exists and matches
            if mini_model and isinstance(mini_model, str) and mini_model.strip():
                return selected_model == mini_model
            
            return False
        except Exception as e:
            print(f"⚠️  Error checking mini model usage: {e}")
            return False
    
    def get_display_name_for_model(self, selected_model: str) -> str:
        """
        Get the appropriate display name for the current personality based on the model used
        
        Args:
            selected_model: The model that was selected for the task
            
        Returns:
            Display name with "mini-" prefix if mini model was used
        """
        try:
            if not self.current_personality:
                return "RoverSeer"
            
            personality = self.current_personality
            avatar_emoji = getattr(personality, 'avatar_emoji', '🤖')
            name = getattr(personality, 'name', 'Unknown')
            
            base_name = f"{avatar_emoji} {name}"
            
            if self.is_using_mini_model(selected_model):
                return f"{avatar_emoji} mini-{name}"
            
            return base_name
        except Exception as e:
            print(f"⚠️  Error getting display name: {e}")
            return "RoverSeer"

    def _load_current_personality(self):
        """Load the saved current personality from config"""
        try:
            from config import load_config
            config_data = load_config()
            current_name = config_data.get('current_personality')
            
            if current_name:
                personality = self.get_personality(current_name)
                if personality:
                    self.current_personality = personality
                    print(f"✅ Loaded current personality: {current_name}")
                else:
                    print(f"⚠️  Saved personality '{current_name}' not found")
                    self.current_personality = None
            else:
                # No automatic fallback to any personality - let user choose
                self.current_personality = None
                print("ℹ️  No current personality set - using system default")
        except Exception as e:
            print(f"⚠️  Error loading current personality: {e}")
            self.current_personality = None
    
    def _save_current_personality(self):
        """Save the current personality to config"""
        try:
            from config import load_config, save_config
            config_data = load_config()
            
            if self.current_personality:
                config_data['current_personality'] = self.current_personality.name
            else:
                config_data.pop('current_personality', None)
            
            save_config(config_data)
            print(f"✅ Saved current personality: {self.current_personality.name if self.current_personality else 'None'}")
        except Exception as e:
            print(f"⚠️  Error saving current personality: {e}")

    def choose_model(self, max_tokens: int = 512, default_model: Optional[str] = None) -> str:
        """
        Intelligently choose between mini_model and model_preference based on total context size
        Uses the current personality's mini_model_threshold for decision making
        
        Args:
            max_tokens: Total input context size (user message + conversation history)
            default_model: Fallback model if personality has no preferences
            
        Returns:
            Model name to use for the task
        """
        try:
            if not self.current_personality:
                fallback_model = default_model or "llama3.2:3b"
                DebugLog("🔧 No current personality, using fallback model: {}", fallback_model)
                return fallback_model
            
            # Safely check for mini model attributes with fallbacks
            personality = self.current_personality
            mini_model = getattr(personality, 'mini_model', None)
            mini_threshold = getattr(personality, 'mini_model_threshold', 1000)
            model_preference = getattr(personality, 'model_preference', None)
            
            # Always start with preferred model
            selected_model = model_preference or default_model or "llama3.2:3b"
            
            # Check if we should use mini model
            has_mini_model = bool(mini_model and isinstance(mini_model, str) and mini_model.strip())
            
            if has_mini_model and max_tokens > mini_threshold:
                DebugLog("🚀 Using mini model '{}' for large context ({} tokens > {} threshold)", 
                        mini_model, max_tokens, mini_threshold)
                return mini_model
            
            # Log which model we're using and why
            if has_mini_model:
                DebugLog("🧠 Using full model '{}' for normal context ({} tokens <= {} threshold)", 
                        selected_model, max_tokens, mini_threshold)
            else:
                DebugLog("🧠 Using full model '{}' (no mini model configured for {})", 
                        selected_model, personality.name)
            
            return selected_model
            
        except Exception as e:
            # If anything goes wrong, fall back to safe defaults
            fallback_model = default_model or "llama3.2:3b"
            print(f"⚠️  Error in choose_model for personality {getattr(self.current_personality, 'name', 'unknown')}: {e}")
            print(f"   Falling back to: {fallback_model}")
            return fallback_model


# Global personality manager instance
personality_manager = PersonalityManager()


def get_personality_manager() -> PersonalityManager:
    """Get the global personality manager"""
    return personality_manager 