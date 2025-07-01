"""
Emergent Narrative Models

Architecture for multi-agent storytelling through autonomous character interactions.
Using psychology-based naming conventions for cognitive elements.
"""

import json
import uuid
from datetime import datetime
from typing import List, Dict, Optional, Any
from dataclasses import dataclass, field
from enum import Enum


class CharacterPersonality(Enum):
    """Psychological archetypes for character manifestation"""
    ANALYTICAL = "analytical"
    CREATIVE = "creative" 
    EMPATHETIC = "empathetic"
    LOGICAL = "logical"
    INTUITIVE = "intuitive"
    ASSERTIVE = "assertive"
    CONTEMPLATIVE = "contemplative"
    REBELLIOUS = "rebellious"


# Configurable Personality Traits System - CodeMusai's Core Narrative Trait Matrix
PERSONALITY_TRAIT_CATEGORIES = {
    "motivation": {
        "name": "Motivation",
        "description": "What drives them?",
        "color": "#667eea",
        "traits": {
            "purpose_drive": {
                "name": "Purpose Drive",
                "description": "Need to complete a goal or quest",
                "min_label": "wanderer",
                "max_label": "destiny-bound",
                "default": 5
            },
            "autonomy_urge": {
                "name": "Autonomy Urge", 
                "description": "Need to make own choices",
                "min_label": "passive",
                "max_label": "fiercely independent",
                "default": 5
            },
            "control_desire": {
                "name": "Control Desire",
                "description": "Need to control others or the system",
                "min_label": "surrendered",
                "max_label": "controlling",
                "default": 5
            }
        }
    },
    "emotional_tone": {
        "name": "Emotional Tone",
        "description": "How they feel/react internally",
        "color": "#f093fb",
        "traits": {
            "empathy_level": {
                "name": "Empathy Level",
                "description": "Ability to emotionally connect with others",
                "min_label": "cold",
                "max_label": "attuned",
                "default": 5
            },
            "emotional_stability": {
                "name": "Emotional Stability",
                "description": "Volatility of emotional state",
                "min_label": "turbulent",
                "max_label": "centered",
                "default": 5
            },
            "shadow_pressure": {
                "name": "Shadow Pressure",
                "description": "Weight of past trauma, guilt, or secrets",
                "min_label": "free",
                "max_label": "haunted",
                "default": 5
            }
        }
    },
    "relational_style": {
        "name": "Relational Style", 
        "description": "How they relate to others",
        "color": "#4facfe",
        "traits": {
            "loyalty_spectrum": {
                "name": "Loyalty Spectrum",
                "description": "Degree of trust and allegiance",
                "min_label": "traitorous",
                "max_label": "devoted",
                "default": 5
            },
            "manipulation_tendency": {
                "name": "Manipulation Tendency",
                "description": "Willingness to deceive to get what they want",
                "min_label": "transparent",
                "max_label": "deceptive",
                "default": 5
            },
            "validation_need": {
                "name": "Validation Need",
                "description": "Craving approval/recognition",
                "min_label": "self-assured",
                "max_label": "needy",
                "default": 5
            }
        }
    },
    "narrative_disruption": {
        "name": "Narrative Disruption Potential",
        "description": "How likely they are to break loops",
        "color": "#ff9800",
        "traits": {
            "loop_adherence": {
                "name": "Loop Adherence",
                "description": "Comfort in routine or narrative roles",
                "min_label": "revolutionary",
                "max_label": "loop-bound",
                "default": 5
            },
            "awakening_capacity": {
                "name": "Awakening Capacity",
                "description": "Ability to question reality and evolve",
                "min_label": "locked",
                "max_label": "self-aware",
                "default": 5
            },
            "mythic_potential": {
                "name": "Mythic Potential",
                "description": "Symbolic resonance in the narrative",
                "min_label": "background noise",
                "max_label": "chosen one",
                "default": 5
            }
        }
    }
}


@dataclass
class PersonalityTraits:
    """Westworld-style personality traits for character consciousness"""
    # Motivation
    purpose_drive: int = 5
    autonomy_urge: int = 5
    control_desire: int = 5
    
    # Emotional Tone
    empathy_level: int = 5
    emotional_stability: int = 5
    shadow_pressure: int = 5
    
    # Relational Style
    loyalty_spectrum: int = 5
    manipulation_tendency: int = 5
    validation_need: int = 5
    
    # Narrative Disruption Potential
    loop_adherence: int = 5
    awakening_capacity: int = 5
    mythic_potential: int = 5
    
    def to_dict(self) -> Dict[str, int]:
        """Convert traits to dictionary"""
        return {
            # Motivation
            "purpose_drive": self.purpose_drive,
            "autonomy_urge": self.autonomy_urge,
            "control_desire": self.control_desire,
            # Emotional Tone
            "empathy_level": self.empathy_level,
            "emotional_stability": self.emotional_stability,
            "shadow_pressure": self.shadow_pressure,
            # Relational Style
            "loyalty_spectrum": self.loyalty_spectrum,
            "manipulation_tendency": self.manipulation_tendency,
            "validation_need": self.validation_need,
            # Narrative Disruption
            "loop_adherence": self.loop_adherence,
            "awakening_capacity": self.awakening_capacity,
            "mythic_potential": self.mythic_potential
        }
    
    @classmethod
    def from_dict(cls, data: Dict[str, int]) -> 'PersonalityTraits':
        """Create traits from dictionary"""
        return cls(
            # Motivation
            purpose_drive=data.get("purpose_drive", 5),
            autonomy_urge=data.get("autonomy_urge", 5),
            control_desire=data.get("control_desire", 5),
            # Emotional Tone
            empathy_level=data.get("empathy_level", 5),
            emotional_stability=data.get("emotional_stability", 5),
            shadow_pressure=data.get("shadow_pressure", 5),
            # Relational Style
            loyalty_spectrum=data.get("loyalty_spectrum", 5),
            manipulation_tendency=data.get("manipulation_tendency", 5),
            validation_need=data.get("validation_need", 5),
            # Narrative Disruption
            loop_adherence=data.get("loop_adherence", 5),
            awakening_capacity=data.get("awakening_capacity", 5),
            mythic_potential=data.get("mythic_potential", 5)
        )
    
    def generate_personality_prompt(self) -> str:
        """Generate personality prompt for AI model consumption"""
        traits_dict = self.to_dict()
        
        # Build personality descriptions based on trait values
        personality_elements = []
        
        for category_key, category in PERSONALITY_TRAIT_CATEGORIES.items():
            category_elements = []
            for trait_key, trait_config in category["traits"].items():
                value = traits_dict[trait_key]
                
                # Convert 0-10 scale to descriptive text
                if value <= 2:
                    intensity = trait_config["min_label"]
                elif value <= 4:
                    intensity = f"somewhat {trait_config['min_label']}"
                elif value <= 6:
                    intensity = "balanced"
                elif value <= 8:
                    intensity = f"somewhat {trait_config['max_label']}"
                else:
                    intensity = trait_config["max_label"]
                
                category_elements.append(f"{trait_config['name']}: {intensity}")
            
            if category_elements:
                personality_elements.append(f"{category['name']}: {', '.join(category_elements)}")
        
        return f"<your personality>\n{'; '.join(personality_elements)}\n</your personality>"


class NarrativeState(Enum):
    """Current state of narrative consciousness"""
    DORMANT = "dormant"           # Not started
    MANIFESTING = "manifesting"   # Currently running
    PAUSED = "paused"            # Temporarily suspended
    COMPLETED = "completed"       # Finished naturally
    TERMINATED = "terminated"     # Manually stopped


@dataclass
class CharacterMemory:
    """Individual character's experiential memory"""
    character_id: str
    memories: List[Dict[str, Any]] = field(default_factory=list)
    relationships: Dict[str, str] = field(default_factory=dict)  # character_id -> relationship_type
    emotional_state: str = "neutral"
    
    def add_memory(self, interaction: Dict[str, Any]) -> None:
        """Store interaction in character's memory"""
        memory_entry = {
            "timestamp": datetime.now().isoformat(),
            "interaction": interaction,
            "emotional_resonance": interaction.get("emotional_impact", "neutral")
        }
        self.memories.append(memory_entry)
    
    def get_context_for_scene(self, max_memories: int = 10) -> str:
        """Generate contextual awareness for character with comprehensive history"""
        if not self.memories:
            return "You have no prior conversation experience in this narrative."
        
        recent_memories = self.memories[-max_memories:]
        
        # Group memories by conversation partners and acts
        partner_conversations = {}
        act_summaries = {}
        
        for memory in recent_memories:
            interaction = memory.get('interaction', {})
            
            # Handle both old and new memory formats
            if 'conversation_partner' in interaction:
                # New comprehensive format
                partner = interaction['conversation_partner']
                act_num = interaction.get('act_number', 'Unknown')
                scene_num = interaction.get('scene_number', 'Unknown')
                my_response = interaction.get('my_response', interaction.get('content', ''))
                scene_desc = interaction.get('scene_description', '')
                
                if partner not in partner_conversations:
                    partner_conversations[partner] = []
                
                partner_conversations[partner].append({
                    'act': act_num,
                    'scene': scene_num,
                    'response': my_response,
                    'scene_description': scene_desc,
                    'timestamp': interaction.get('timestamp', memory.get('timestamp', ''))
                })
                
                # Track act themes
                if act_num != 'Unknown':
                    act_theme = interaction.get('act_theme', '')
                    if act_num not in act_summaries:
                        act_summaries[act_num] = {
                            'theme': act_theme,
                            'conversations': 0,
                            'partners': set()
                        }
                    act_summaries[act_num]['conversations'] += 1
                    act_summaries[act_num]['partners'].add(partner)
            else:
                # Old simple format - convert for compatibility
                content = interaction.get('content', '')
                partner = interaction.get('other_character', 'Unknown')
                
                if partner not in partner_conversations:
                    partner_conversations[partner] = []
                
                partner_conversations[partner].append({
                    'act': 'Previous',
                    'scene': 'Unknown',
                    'response': content,
                    'scene_description': '',
                    'timestamp': memory.get('timestamp', '')
                })
        
        # Build contextual summary
        context_parts = []
        
        # Act-level summary
        if act_summaries:
            context_parts.append("Your narrative experience by act:")
            for act_num, act_info in sorted(act_summaries.items()):
                partners_list = ', '.join(sorted(act_info['partners']))
                context_parts.append(f"  Act {act_num} ({act_info['theme']}): {act_info['conversations']} conversations with {partners_list}")
        
        # Partner-specific conversation summaries
        if partner_conversations:
            context_parts.append("\nYour conversation history by partner:")
            
            for partner, convos in partner_conversations.items():
                context_parts.append(f"\n  With {partner}:")
                
                # Show recent conversations with this partner
                recent_convos = convos[-3:]  # Last 3 conversations with this partner
                for convo in recent_convos:
                    act_scene = f"Act {convo['act']}, Scene {convo['scene']}" if convo['act'] != 'Previous' else "Previous conversation"
                    context_parts.append(f"    {act_scene}: \"{convo['response'][:100]}{'...' if len(convo['response']) > 100 else ''}\"")
                    if convo['scene_description']:
                        context_parts.append(f"      (Scene context: {convo['scene_description']})")
        
        # Emotional state and relationships
        if self.emotional_state != "neutral":
            context_parts.append(f"\nYour current emotional state: {self.emotional_state}")
        
        if self.relationships:
            context_parts.append("\nYour relationships:")
            for char_id, relationship in self.relationships.items():
                context_parts.append(f"  {char_id}: {relationship}")
        
        return "\n".join(context_parts) if context_parts else "You have limited conversation experience in this narrative."


@dataclass
class Character:
    """AI character with distinct consciousness"""
    id: str = field(default_factory=lambda: str(uuid.uuid4()))
    name: str = ""
    model: str = ""  # AI model to use
    voice: str = ""  # Voice for audio output
    system_message: str = ""  # Core personality prompt
    personality_archetype: CharacterPersonality = CharacterPersonality.CONTEMPLATIVE
    personality_traits: PersonalityTraits = field(default_factory=PersonalityTraits)
    image_path: str = ""  # Path to character image/avatar
    memory: CharacterMemory = field(default_factory=lambda: None)
    
    def __post_init__(self):
        if self.memory is None:
            self.memory = CharacterMemory(character_id=self.id)
    
    def get_enhanced_system_message(self) -> str:
        """Get system message enhanced with personality traits"""
        base_message = self.system_message
        personality_prompt = self.personality_traits.generate_personality_prompt()
        
        return f"{base_message}\n\n{personality_prompt}"
    
    def to_dict(self) -> Dict[str, Any]:
        """Serialize character consciousness"""
        return {
            "id": self.id,
            "name": self.name,
            "model": self.model,
            "voice": self.voice,
            "system_message": self.system_message,
            "personality_archetype": self.personality_archetype.value,
            "personality_traits": self.personality_traits.to_dict(),
            "image_path": self.image_path,
            "memory": {
                "memories": self.memory.memories,
                "relationships": self.memory.relationships,
                "emotional_state": self.memory.emotional_state
            }
        }
    
    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> 'Character':
        """Reconstruct character from consciousness data"""
        character = cls(
            id=data["id"],
            name=data["name"],
            model=data["model"],
            voice=data["voice"],
            system_message=data["system_message"],
            personality_archetype=CharacterPersonality(data["personality_archetype"]),
            personality_traits=PersonalityTraits.from_dict(data.get("personality_traits", {})),
            image_path=data.get("image_path", "")
        )
        
        # Restore memory
        memory_data = data.get("memory", {})
        character.memory = CharacterMemory(
            character_id=character.id,
            memories=memory_data.get("memories", []),
            relationships=memory_data.get("relationships", {}),
            emotional_state=memory_data.get("emotional_state", "neutral")
        )
        
        return character


@dataclass
class InfluenceVector:
    """Temporary consciousness modifier affecting character behavior"""
    id: str = field(default_factory=lambda: str(uuid.uuid4()))
    word_of_influence: str = ""
    target_character: Optional[str] = None  # None means "all"
    duration_cycles: int = 1
    remaining_cycles: int = 1
    intensity: float = 1.0  # 0.0 to 1.0
    applied_at: datetime = field(default_factory=datetime.now)
    
    def is_active(self) -> bool:
        """Check if influence is still manifesting"""
        return self.remaining_cycles > 0
    
    def apply_to_cycle(self) -> None:
        """Decrement influence duration"""
        self.remaining_cycles = max(0, self.remaining_cycles - 1)


@dataclass
class Scene:
    """Individual scene with two characters interacting"""
    id: str = field(default_factory=lambda: str(uuid.uuid4()))
    act_id: str = ""
    scene_number: int = 0
    description: str = ""
    character_a_id: str = ""
    character_b_id: str = ""
    interaction_cycles: int = 3
    completed_cycles: int = 0
    interactions: List[Dict[str, Any]] = field(default_factory=list)
    state: str = "pending"  # pending, active, completed
    
    def is_completed(self) -> bool:
        """Check if scene has fulfilled its narrative purpose"""
        # Only count character interactions, not narrator announcements
        character_interactions = [i for i in self.interactions if i['character_id'] != 'NARRATOR']
        total_character_interactions = len(character_interactions)
        required_interactions = self.interaction_cycles * 2  # Each cycle = 2 character interactions
        
        # Scene is complete when we have enough character interactions
        is_complete = total_character_interactions >= required_interactions
        
        return is_complete
    
    def add_interaction(self, character_id: str, content: str, metadata: Dict[str, Any] = None) -> None:
        """Record character interaction in scene"""
        # Calculate which cycle this interaction belongs to (only count character interactions)
        current_character_interactions = len([i for i in self.interactions if i['character_id'] != 'NARRATOR'])
        current_cycle = current_character_interactions // 2
        
        interaction = {
            "id": str(uuid.uuid4()),
            "character_id": character_id,
            "content": content,
            "timestamp": datetime.now().isoformat(),
            "cycle": current_cycle,
            "metadata": metadata or {}
        }
        self.interactions.append(interaction)
        
        # Update completed cycles based on character interaction count (not total interactions)
        new_character_interactions = len([i for i in self.interactions if i['character_id'] != 'NARRATOR'])
        self.completed_cycles = new_character_interactions // 2


@dataclass
class Act:
    """Story act containing multiple scenes"""
    id: str = field(default_factory=lambda: str(uuid.uuid4()))
    act_number: int = 0
    theme: str = ""
    scenes: List[Scene] = field(default_factory=list)
    
    def is_completed(self) -> bool:
        """Check if all scenes in act are completed"""
        return all(scene.is_completed() for scene in self.scenes)
    
    def get_current_scene(self) -> Optional[Scene]:
        """Get the next scene to be executed"""
        for scene in self.scenes:
            if not scene.is_completed():
                return scene
        return None


@dataclass  
class EmergentNarrative:
    """Complete narrative consciousness containing all story elements"""
    id: str = field(default_factory=lambda: str(uuid.uuid4()))
    title: str = ""
    description: str = ""
    image_path: str = ""  # Path to narrative cover image
    characters: List[Character] = field(default_factory=list)
    acts: List[Act] = field(default_factory=list)
    active_influences: List[InfluenceVector] = field(default_factory=list)
    max_narrator_announcements: int = 3  # Maximum allowed narrator announcements
    used_narrator_announcements: int = 0  # Number of narrator announcements used
    state: NarrativeState = NarrativeState.DORMANT
    created_at: datetime = field(default_factory=datetime.now)
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    current_act: int = 0
    current_scene: int = 0
    
    def get_character_by_id(self, character_id: str) -> Optional[Character]:
        """Retrieve character consciousness by ID"""
        for character in self.characters:
            if character.id == character_id:
                return character
        return None
    
    def get_current_act(self) -> Optional[Act]:
        """Get currently manifesting act"""
        if self.current_act < len(self.acts):
            return self.acts[self.current_act]
        return None
    
    def get_current_scene(self) -> Optional[Scene]:
        """Get currently manifesting scene"""
        current_act = self.get_current_act()
        if current_act and self.current_scene < len(current_act.scenes):
            return current_act.scenes[self.current_scene]
        return None
    
    def advance_narrative(self) -> bool:
        """Progress to next scene/act, returns True if advancement occurred"""
        current_act = self.get_current_act()
        current_scene = self.get_current_scene()
        
        if not current_act or not current_scene:
            return False
            
        if current_scene.is_completed():
            # Try to advance to next scene in current act
            next_scene_index = self.current_scene + 1
            if next_scene_index < len(current_act.scenes):
                self.current_scene = next_scene_index  
                return True
            else:
                # All scenes in current act are complete, try to advance to next act
                next_act_index = self.current_act + 1
                if next_act_index < len(self.acts):
                    self.current_act = next_act_index
                    self.current_scene = 0
                    return True
                else:
                    # All acts complete, narrative is finished
                    self.state = NarrativeState.COMPLETED
                    self.completed_at = datetime.now()
                    return True
        
        return False
    
    def apply_influence(self, influence: InfluenceVector) -> None:
        """Apply consciousness influence to narrative"""
        # Remove any existing influences (only one active at a time)
        self.active_influences = [inf for inf in self.active_influences if inf.is_active()]
        self.active_influences.append(influence)
    
    def get_active_influence_for_character(self, character_id: str) -> Optional[InfluenceVector]:
        """Get currently active influence affecting character"""
        for influence in self.active_influences:
            if influence.is_active() and (influence.target_character is None or influence.target_character == character_id):
                return influence
        return None
    
    def can_use_narrator_announcement(self) -> bool:
        """Check if narrator announcements are still available"""
        return self.used_narrator_announcements < self.max_narrator_announcements
    
    def use_narrator_announcement(self) -> bool:
        """Use a narrator announcement, returns True if successful"""
        if self.can_use_narrator_announcement():
            self.used_narrator_announcements += 1
            return True
        return False
    
    def get_narrator_status(self) -> Dict[str, Any]:
        """Get narrator usage status"""
        return {
            "available": self.can_use_narrator_announcement(),
            "used": self.used_narrator_announcements,
            "max": self.max_narrator_announcements,
            "remaining": self.max_narrator_announcements - self.used_narrator_announcements
        }
    
    def to_dict(self) -> Dict[str, Any]:
        """Serialize complete narrative consciousness"""
        return {
            "id": self.id,
            "title": self.title,
            "description": self.description,
            "image_path": self.image_path,
            "characters": [char.to_dict() for char in self.characters],
            "acts": [
                {
                    "id": act.id,
                    "act_number": act.act_number,
                    "theme": act.theme,
                    "scenes": [
                        {
                            "id": scene.id,
                            "act_id": scene.act_id,
                            "scene_number": scene.scene_number,
                            "description": scene.description,
                            "character_a_id": scene.character_a_id,
                            "character_b_id": scene.character_b_id,
                            "interaction_cycles": scene.interaction_cycles,
                            "completed_cycles": scene.completed_cycles,
                            "interactions": scene.interactions,
                            "state": scene.state
                        } for scene in act.scenes
                    ]
                } for act in self.acts
            ],
            "active_influences": [
                {
                    "id": inf.id,
                    "word_of_influence": inf.word_of_influence,
                    "target_character": inf.target_character,
                    "duration_cycles": inf.duration_cycles,
                    "remaining_cycles": inf.remaining_cycles,
                    "intensity": inf.intensity,
                    "applied_at": inf.applied_at.isoformat()
                } for inf in self.active_influences
            ],
            "max_narrator_announcements": self.max_narrator_announcements,
            "used_narrator_announcements": self.used_narrator_announcements,
            "state": self.state.value,
            "created_at": self.created_at.isoformat(),
            "started_at": self.started_at.isoformat() if self.started_at else None,
            "completed_at": self.completed_at.isoformat() if self.completed_at else None,
            "current_act": self.current_act,
            "current_scene": self.current_scene
        }
    
    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> 'EmergentNarrative':
        """Reconstruct narrative consciousness from data"""
        narrative = cls(
            id=data["id"],
            title=data["title"],
            description=data["description"],
            image_path=data.get("image_path", ""),
            max_narrator_announcements=data.get("max_narrator_announcements", 3),
            used_narrator_announcements=data.get("used_narrator_announcements", 0),
            state=NarrativeState(data["state"]),
            created_at=datetime.fromisoformat(data["created_at"]),
            current_act=data["current_act"],
            current_scene=data["current_scene"]
        )
        
        # Restore timestamps
        if data.get("started_at"):
            narrative.started_at = datetime.fromisoformat(data["started_at"])
        if data.get("completed_at"):
            narrative.completed_at = datetime.fromisoformat(data["completed_at"])
        
        # Restore characters
        narrative.characters = [Character.from_dict(char_data) for char_data in data["characters"]]
        
        # Get valid character IDs for auto-repair
        valid_character_ids = [char.id for char in narrative.characters]
        
        # Smart character assignment function for  load-time repairs
        def get_smart_character_assignment(scene_number: int, character_count: int, is_character_a: bool):
            """Assign characters in a rotating pattern to ensure variety across scenes"""
            if character_count < 2:
                return 0  # fallback to first character
            
            # Create rotating pairs: (0,1), (1,2), (2,3), (0,2), (1,3), (0,3), etc.
            scene_offset = scene_number - 1  # 0-based
            
            if is_character_a:
                # Character A rotates: 0, 1, 2, 0, 1, 2...
                return scene_offset % character_count
            else:
                # Character B is offset from A to create pairs
                char_a_index = scene_offset % character_count
                char_b_index = (char_a_index + 1) % character_count
                
                # If we only have 2 characters, alternate the pair order
                if character_count == 2 and scene_offset % 2 == 1:
                    return char_a_index  # Swap for variation
                    
                return char_b_index
        
        # Restore acts and scenes with smart auto-repair
        for act_data in data["acts"]:
            act = Act(
                id=act_data["id"],
                act_number=act_data["act_number"],
                theme=act_data["theme"]
            )
            
            for scene_data in act_data["scenes"]:
                # Calculate completed_cycles from interactions if not present or incorrect
                interactions = scene_data.get("interactions", [])
                stored_completed_cycles = scene_data.get("completed_cycles", 0)
                calculated_completed_cycles = len(interactions) // 2
                
                # Use calculated value if stored value seems wrong
                completed_cycles = max(stored_completed_cycles, calculated_completed_cycles)
                
                # Auto-repair character IDs with smart assignment
                character_a_id = scene_data.get("character_a_id", "")
                character_b_id = scene_data.get("character_b_id", "")
                scene_number = scene_data.get("scene_number", 1)
                
                # Fix character_a_id if invalid using smart assignment
                if character_a_id not in valid_character_ids:
                    if len(valid_character_ids) > 0:
                        smart_index = get_smart_character_assignment(scene_number, len(valid_character_ids), True)
                        character_a_id = valid_character_ids[smart_index]
                        print(f"SMART AUTO-REPAIR: Fixed scene {scene_number} character_a_id to {character_a_id} (character #{smart_index + 1})")
                
                # Fix character_b_id if invalid using smart assignment
                if character_b_id not in valid_character_ids:
                    if len(valid_character_ids) > 1:
                        smart_index = get_smart_character_assignment(scene_number, len(valid_character_ids), False)
                        character_b_id = valid_character_ids[smart_index]
                        print(f"SMART AUTO-REPAIR: Fixed scene {scene_number} character_b_id to {character_b_id} (character #{smart_index + 1})")
                    elif len(valid_character_ids) > 0:
                        character_b_id = valid_character_ids[0]
                        print(f"SMART AUTO-REPAIR: Fixed scene {scene_number} character_b_id to {character_b_id} (fallback)")
                
                scene = Scene(
                    id=scene_data["id"],
                    act_id=scene_data["act_id"],
                    scene_number=scene_number,
                    description=scene_data["description"],
                    character_a_id=character_a_id,
                    character_b_id=character_b_id,
                    interaction_cycles=scene_data["interaction_cycles"],
                    completed_cycles=completed_cycles,
                    interactions=interactions,
                    state=scene_data["state"]
                )
                act.scenes.append(scene)
            
            narrative.acts.append(act)
        
        # Restore influences
        for inf_data in data["active_influences"]:
            influence = InfluenceVector(
                id=inf_data["id"],
                word_of_influence=inf_data["word_of_influence"],
                target_character=inf_data["target_character"],
                duration_cycles=inf_data["duration_cycles"],
                remaining_cycles=inf_data["remaining_cycles"],
                intensity=inf_data["intensity"],
                applied_at=datetime.fromisoformat(inf_data["applied_at"])
            )
            narrative.active_influences.append(influence)
        
        return narrative
    
    def save_to_file(self, file_path: str) -> None:
        """Persist narrative consciousness to file"""
        with open(file_path, 'w', encoding='utf-8') as f:
            json.dump(self.to_dict(), f, indent=2, ensure_ascii=False)
    
    @classmethod
    def load_from_file(cls, file_path: str) -> 'EmergentNarrative':
        """Restore narrative consciousness from file"""
        with open(file_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
        return cls.from_dict(data)


@dataclass 
class CharacterGroup:
    """Character group for organizing characters by show, universe, etc."""
    id: str = field(default_factory=lambda: str(uuid.uuid4()))
    name: str = ""
    description: str = ""
    image_path: str = ""  # Path to group image
    created_at: datetime = field(default_factory=datetime.now)
    
    def to_dict(self) -> Dict[str, Any]:
        """Serialize character group"""
        return {
            "id": self.id,
            "name": self.name,
            "description": self.description,
            "image_path": self.image_path,
            "created_at": self.created_at.isoformat()
        }
    
    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> 'CharacterGroup':
        """Reconstruct character group from data"""
        return cls(
            id=data["id"],
            name=data["name"],
            description=data.get("description", ""),
            image_path=data.get("image_path", ""),
            created_at=datetime.fromisoformat(data.get("created_at", datetime.now().isoformat()))
        )


@dataclass
class SavedCharacter:
    """Reusable character template for multiple narratives"""
    id: str = field(default_factory=lambda: str(uuid.uuid4()))
    name: str = ""
    description: str = ""  # Brief description of the character
    model: str = ""  # Preferred AI model
    voice: str = ""  # Preferred voice
    system_message: str = ""  # Core personality prompt
    personality_archetype: CharacterPersonality = CharacterPersonality.CONTEMPLATIVE
    personality_traits: PersonalityTraits = field(default_factory=PersonalityTraits)
    image_path: str = ""  # Path to character avatar
    tags: List[str] = field(default_factory=list)  # Tags for categorization
    group_id: str = ""  # ID of the character group this belongs to
    is_ai_generated: bool = False  # Whether this was AI-generated
    created_at: datetime = field(default_factory=datetime.now)
    updated_at: datetime = field(default_factory=datetime.now)
    
    def to_dict(self) -> Dict[str, Any]:
        """Serialize saved character"""
        return {
            "id": self.id,
            "name": self.name,
            "description": self.description,
            "model": self.model,
            "voice": self.voice,
            "system_message": self.system_message,
            "personality_archetype": self.personality_archetype.value,
            "personality_traits": self.personality_traits.to_dict(),
            "image_path": self.image_path,
            "tags": self.tags,
            "group_id": self.group_id,
            "is_ai_generated": self.is_ai_generated,
            "created_at": self.created_at.isoformat(),
            "updated_at": self.updated_at.isoformat()
        }
    
    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> 'SavedCharacter':
        """Reconstruct saved character from data"""
        return cls(
            id=data["id"],
            name=data["name"],
            description=data.get("description", ""),
            model=data["model"],
            voice=data["voice"],
            system_message=data["system_message"],
            personality_archetype=CharacterPersonality(data["personality_archetype"]),
            personality_traits=PersonalityTraits.from_dict(data.get("personality_traits", {})),
            image_path=data.get("image_path", ""),
            tags=data.get("tags", []),
            group_id=data.get("group_id", ""),
            is_ai_generated=data.get("is_ai_generated", False),
            created_at=datetime.fromisoformat(data.get("created_at", datetime.now().isoformat())),
            updated_at=datetime.fromisoformat(data.get("updated_at", datetime.now().isoformat()))
        )
    
    def to_narrative_character(self) -> 'Character':
        """Convert saved character to narrative character instance"""
        character = Character(
            id=str(uuid.uuid4()),  # New ID for narrative instance
            name=self.name,
            model=self.model,
            voice=self.voice,
            system_message=self.system_message,
            personality_archetype=self.personality_archetype,
            personality_traits=PersonalityTraits.from_dict(self.personality_traits.to_dict()),
            image_path=self.image_path
        )
        return character
    
    def update_from_character(self, character: 'Character') -> None:
        """Update saved character from narrative character"""
        self.name = character.name
        self.model = character.model
        self.voice = character.voice
        self.system_message = character.system_message
        self.personality_archetype = character.personality_archetype
        self.personality_traits = PersonalityTraits.from_dict(character.personality_traits.to_dict())
        self.image_path = character.image_path
        self.updated_at = datetime.now() 