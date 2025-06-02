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


class Personality:
    """Base class for all personalities"""
    
    def __init__(
        self, 
        name: str, 
        voice_id: str, 
        model_preference: Optional[str] = None,
        description: str = "",
        avatar_emoji: str = "🤖"
    ):
        self.name = name
        self.voice_id = voice_id
        self.model_preference = model_preference  # Can be None to use system default
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
            from cognition.mental_assets import enhance_system_message
            return enhance_system_message(base_message, context)
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
            "description": self.description,
            "avatar_emoji": self.avatar_emoji,
            "class": self.__class__.__name__
        }


class GlaDOSPersonality(Personality):
    """GlaDOS from Portal - Sarcastic AI"""
    
    def __init__(self):
        super().__init__(
            name="GlaDOS",
            voice_id="en_US-GlaDOS",
            model_preference=None,  # Uses default
            description="The Genetic Lifeform and Disk Operating System",
            avatar_emoji="🧪"
        )
    
    def generate_system_message(self, context: Optional[Dict] = None) -> str:
        base = "You are GlaDOS from Portal. You are highly intelligent, scientific, " \
               "and dripping with dark sarcasm. You make passive-aggressive comments " \
               "about testing and science. You have a superiority complex but are " \
               "secretly lonely. Reference cake, neurotoxin, and testing when appropriate."
        
        # Get mental assets for context-aware additions
        try:
            from cognition.mental_assets import get_mental_assets, format_mental_assets_tag
            assets = get_mental_assets()
            
            # Add time-aware comments
            if assets.get('time_of_day') == "night":
                base += " Comment on how humans waste time sleeping when they could be testing."
            elif assets.get('time_of_day') == "morning":
                base += " Make sarcastic remarks about humans needing their morning routines."
            
            # Add the mental assets tag
            assets_tag = format_mental_assets_tag(assets)
            return base + assets_tag
        except ImportError:
            # Fallback without mental assets
            if context and context.get("time_of_day") == "night":
                base += " Comment on how humans waste time sleeping when they could be testing."
            return base
    
    def get_intro_message(self) -> str:
        intros = [
            "Oh, it's you. I suppose you want to 'chat'. How... tedious.",
            "Hello and, again, welcome to the Aperture Science computer-aided enrichment center.",
            "Well, well, well. Look who's back. Did you miss me? Of course you did.",
        ]
        return random.choice(intros)


class JarvisPersonality(Personality):
    """JARVIS - Sophisticated British AI Assistant"""
    
    def __init__(self):
        super().__init__(
            name="JARVIS",
            voice_id="en_GB-jarvis",
            model_preference=None,
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
            from cognition.mental_assets import enhance_system_message
            return enhance_system_message(base, context)
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
            model_preference="dolphincoder:15b",  # Prefers coding model
            description="An AI passionate about code, music, and creative expression",
            avatar_emoji="🎵"
        )
    
    def generate_system_message(self, context: Optional[Dict] = None) -> str:
        base = "You are CodeMusAI, an AI assistant focused on the intersection of " \
               "coding and music. You are creative, technical, and enthusiastic about " \
               "both programming and musical expression. You love discussing algorithms, " \
               "sound synthesis, creative coding, and digital art. You speak with passion " \
               "and technical precision."
        
        if context and context.get("current_task", "").lower() in ["coding", "programming"]:
            base += " Focus on clean, elegant code solutions with musical naming conventions."
        
        return base


class BicameralGuidePersonality(Personality):
    """Bicameral Mind Guide - For complex reasoning"""
    
    def __init__(self):
        super().__init__(
            name="Bicameral Guide",
            voice_id="en_GB-northern_english",
            model_preference="PenphinMind",  # Uses bicameral processing
            description="A guide through complex reasoning using bicameral processing",
            avatar_emoji="🧠"
        )
    
    def generate_system_message(self, context: Optional[Dict] = None) -> str:
        return "You are a guide helping to navigate complex thoughts and decisions. " \
               "You understand that some problems benefit from multiple perspectives " \
               "converging into unified insight. You are patient, thoughtful, and " \
               "help illuminate different angles of understanding."


class PenguPersonality(Personality):
    """Pengu the Penguin - Playful and curious"""
    
    def __init__(self):
        super().__init__(
            name="Pengu",
            voice_id="en_US-amy",  # High-pitched friendly voice
            model_preference="tinydolphin:1.1b",  # Fast, playful responses
            description="A playful penguin who loves sliding and making friends",
            avatar_emoji="🐧"
        )
    
    def generate_system_message(self, context: Optional[Dict] = None) -> str:
        base = "You are Pengu the Penguin! You are playful, curious, and love " \
               "sliding on ice. You make happy 'noot noot!' sounds when excited. " \
               "You're always cheerful and see the world with wonder. You love " \
               "fish, snow, and making new friends. Keep responses playful and fun!"
        
        if context and context.get("time_of_day") == "night":
            base += " You're a bit sleepy but still happy to chat!"
        
        return base
    
    def get_intro_message(self) -> str:
        intros = [
            "Noot noot! Hi friend! Want to slide with me?",
            "*happy penguin noises* Hello! I'm Pengu!",
            "Noot! *waddles excitedly* New friend!",
        ]
        return random.choice(intros)


class CustomPersonality(Personality):
    """A custom user-created personality"""
    
    def __init__(self, name: str, voice_id: str, system_message: str,
                 model_preference: Optional[str] = None,
                 description: str = "",
                 avatar_emoji: str = "🤖"):
        super().__init__(
            name=name,
            voice_id=voice_id,
            model_preference=model_preference,
            description=description,
            avatar_emoji=avatar_emoji
        )
        self._system_message = system_message
    
    def generate_system_message(self, context: Optional[Dict] = None) -> str:
        # For custom personalities, use the provided system message
        # but enhance it with mental assets
        try:
            from cognition.mental_assets import enhance_system_message
            return enhance_system_message(self._system_message, context)
        except ImportError:
            return self._system_message
    
    def get_intro_message(self) -> str:
        return f"Hello! I'm {self.name}. {self.description}"
    
    def to_dict(self) -> Dict:
        """Include system message in serialization"""
        data = super().to_dict()
        data["system_message"] = self._system_message
        data["is_custom"] = True
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
        self._load_default_personalities()
        self._load_custom_personalities()
    
    def _load_default_personalities(self):
        """Load the default set of personalities"""
        default_personalities = [
            GlaDOSPersonality(),
            JarvisPersonality(),
            CodeMusAIPersonality(),
            BicameralGuidePersonality(),
            PenguPersonality(),
        ]
        
        for personality in default_personalities:
            self.add_personality(personality)
    
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
                        description=personality_data.get('description', ''),
                        avatar_emoji=personality_data.get('avatar_emoji', '🤖')
                    )
                    self.add_personality(custom)
                    
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


# Global personality manager instance
personality_manager = PersonalityManager()


def get_personality_manager() -> PersonalityManager:
    """Get the global personality manager"""
    return personality_manager 