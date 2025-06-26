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
            from .contextual_moods import enhance_system_message
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
        # For custom personalities, append contextual mood influences to the base message
        try:
            # Start with base system message  
            base_message = self._system_message
            
            # Store mood data for potential logging
            self._last_mood_data = None
            
            # Try to add contextual mood influences to the end
            try:
                from .contextual_moods import generate_mood_context_with_details
                
                if context:
                    # Generate mood-influenced context with detailed data
                    mood_influences, mood_data = generate_mood_context_with_details(self.name, context)
                    
                    # Store the detailed mood data for logging
                    self._last_mood_data = mood_data
                    
                    if mood_influences:
                        base_message += " " + mood_influences
                        DebugLog("Added mood influences to {}: {}", self.name, mood_influences[:100])
                        DebugLog("Mood activation details: {} moods checked, {} activated", 
                                len(mood_data.get("moods_checked", [])), 
                                len(mood_data.get("moods_activated", [])))
                        
            except ImportError:
                pass  # Contextual moods system not available
            
            # Enhance with mental assets
            from .contextual_moods import enhance_system_message
            return enhance_system_message(base_message, context, personality=self)
        except ImportError:
            return self._system_message
    
    def get_intro_message(self) -> str:
        # Use configured intro messages if available
        if self._intro_messages:
            return random.choice(self._intro_messages)
        
        # Final fallback
        return f"Hello! I'm {self.name}. {self.description}"
    
    def to_dict(self) -> Dict:
        """Include system message in serialization"""
        data = super().to_dict()
        data["system_message"] = self._system_message
        data["is_custom"] = True
        if self._intro_messages:
            data["intro_messages"] = self._intro_messages
        return data

    def get_last_mood_data(self) -> Optional[Dict]:
        """Get the mood data from the last system message generation for logging"""
        return getattr(self, '_last_mood_data', None)
    
    def add_personality_mood_tags_to_response(self, response: str) -> str:
        """Add personality and mood tags to a response for this personality"""
        try:
            from .contextual_moods import add_personality_mood_tags
            mood_data = self.get_last_mood_data() or {}
            return add_personality_mood_tags(response, self.name, mood_data)
        except ImportError:
            return response


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
        self._load_default_personalities_from_file()
        self._load_custom_personalities()
        self._load_current_personality()  # Load saved current personality
    
    def _load_default_personalities_from_file(self):
        """Load all personalities from the default personalities file"""
        if os.path.exists(self.default_personalities_file):
            try:
                with open(self.default_personalities_file, 'r') as f:
                    default_data = json.load(f)
                    
                for personality_data in default_data:
                    # Create as CustomPersonality since they're all file-based now
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
                    print(f"✅ Loaded personality from file: {custom.name}")
                    
                print(f"✅ Loaded {len(default_data)} personalities from default file")
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
        """Return list of all personalities with enhanced model availability info"""
        personality_list = []
        for personality in self.personalities.values():
            personality_dict = personality.to_dict()
            
            # Add model availability status
            try:
                from cognition.llm_interface import get_available_models
                available_models = get_available_models()
                
                model_available = True
                fallback_model = None
                
                if personality.model_preference:
                    model_available = personality.model_preference in available_models
                    if not model_available:
                        # Show what fallback would be used
                        fallback_model = self._choose_random_available_model(available_models, personality.model_preference)
                
                personality_dict.update({
                    'model_available': model_available,
                    'fallback_model': fallback_model,
                    'status': 'ready' if model_available else 'fallback_ready'
                })
                
            except Exception as e:
                # Don't let model checking prevent personality from showing
                DebugLog("⚠️ Error checking model availability for {}: {}", personality.name, e)
                personality_dict.update({
                    'model_available': True,  # Assume available to prevent hiding
                    'fallback_model': None,
                    'status': 'unknown'
                })
            
            personality_list.append(personality_dict)
        
        return personality_list
    
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
        Enhanced with random fallback when preferred models aren't available
        
        Args:
            max_tokens: Total input context size (user message + conversation history)
            default_model: Fallback model if personality has no preferences
            
        Returns:
            Model name to use for the task
        """
        try:
            # Get available models for validation
            from cognition.llm_interface import get_available_models
            available_models = get_available_models()
            
            if not self.current_personality:
                fallback_model = self._choose_random_available_model(available_models, default_model)
                DebugLog("🔧 No current personality, using fallback model: {}", fallback_model)
                return fallback_model
            
            # Safely check for mini model attributes with fallbacks
            personality = self.current_personality
            mini_model = getattr(personality, 'mini_model', None)
            mini_threshold = getattr(personality, 'mini_model_threshold', 1000)
            model_preference = getattr(personality, 'model_preference', None)
            
            # Check if we should use mini model first
            has_mini_model = bool(mini_model and isinstance(mini_model, str) and mini_model.strip())
            
            if has_mini_model and max_tokens > mini_threshold:
                # Try mini model first if context is large
                if mini_model in available_models:
                    DebugLog("🚀 Using mini model '{}' for large context ({} tokens > {} threshold)", 
                            mini_model, max_tokens, mini_threshold)
                    return mini_model
                else:
                    DebugLog("⚠️ Mini model '{}' not available, falling back to full model", mini_model)
            
            # Try personality's preferred model
            if model_preference and model_preference in available_models:
                DebugLog("🧠 Using personality's preferred model '{}'", model_preference)
                return model_preference
            elif model_preference:
                DebugLog("⚠️ Personality's preferred model '{}' not available, choosing random fallback", model_preference)
            
            # If preferred model not available, choose intelligently from available models
            fallback_model = self._choose_random_available_model(available_models, default_model)
            DebugLog("🎲 Chosen random fallback model '{}' for personality '{}'", fallback_model, personality.name)
            return fallback_model
            
        except Exception as e:
            # If anything goes wrong, fall back to safe defaults
            fallback_model = default_model or "llama3.2:3b"
            print(f"⚠️  Error in choose_model for personality {getattr(self.current_personality, 'name', 'unknown')}: {e}")
            print(f"   Falling back to: {fallback_model}")
            return fallback_model
    
    def _choose_random_available_model(self, available_models: List[str], default_model: Optional[str] = None) -> str:
        """
        Intelligently choose a random model from available models with preference hierarchy
        
        Args:
            available_models: List of available model names
            default_model: Preferred default model
            
        Returns:
            Selected model name
        """
        if not available_models:
            return default_model or "llama3.2:3b"
        
        # Priority order for random selection
        # 1. Default model if available
        if default_model and default_model in available_models:
            return default_model
        
        # 2. Filter out personality entries and system models for cleaner selection
        clean_models = [m for m in available_models if not m.startswith("PERSONALITY:")]
        
        if not clean_models:
            # Fallback to first available if no clean models
            return available_models[0]
        
        # 3. Prefer smaller, more responsive models for personalities
        preferred_patterns = ["llama3.2:3b", "llama3.2:1b", "qwen", "phi", "gemma"]
        
        for pattern in preferred_patterns:
            matching_models = [m for m in clean_models if pattern.lower() in m.lower()]
            if matching_models:
                selected = random.choice(matching_models)
                DebugLog("🎯 Selected preferred pattern '{}' model: {}", pattern, selected)
                return selected
        
        # 4. If no preferred patterns, choose randomly from available
        selected = random.choice(clean_models)
        DebugLog("🎲 Randomly selected model from {} available: {}", len(clean_models), selected)
        return selected


# Global personality manager instance
personality_manager = PersonalityManager()


def get_personality_manager() -> PersonalityManager:
    """Get the global personality manager"""
    return personality_manager 