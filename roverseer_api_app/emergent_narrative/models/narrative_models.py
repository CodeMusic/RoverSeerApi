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
    memory: CharacterMemory = field(default_factory=lambda: None)
    
    def __post_init__(self):
        if self.memory is None:
            self.memory = CharacterMemory(character_id=self.id)
    
    def to_dict(self) -> Dict[str, Any]:
        """Serialize character consciousness"""
        return {
            "id": self.id,
            "name": self.name,
            "model": self.model,
            "voice": self.voice,
            "system_message": self.system_message,
            "personality_archetype": self.personality_archetype.value,
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
            personality_archetype=CharacterPersonality(data["personality_archetype"])
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
        total_interactions = len(self.interactions)
        required_interactions = self.interaction_cycles * 2  # Each cycle = 2 interactions
        
        # Scene is complete when we have enough total interactions
        is_complete = total_interactions >= required_interactions
        
        return is_complete
    
    def add_interaction(self, character_id: str, content: str, metadata: Dict[str, Any] = None) -> None:
        """Record character interaction in scene"""
        # Calculate which cycle this interaction belongs to
        current_interaction_count = len(self.interactions)
        current_cycle = current_interaction_count // 2
        
        interaction = {
            "id": str(uuid.uuid4()),
            "character_id": character_id,
            "content": content,
            "timestamp": datetime.now().isoformat(),
            "cycle": current_cycle,
            "metadata": metadata or {}
        }
        self.interactions.append(interaction)
        
        # Update completed cycles based on new interaction count
        new_interaction_count = len(self.interactions)
        self.completed_cycles = new_interaction_count // 2


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
    characters: List[Character] = field(default_factory=list)
    acts: List[Act] = field(default_factory=list)
    active_influences: List[InfluenceVector] = field(default_factory=list)
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
    
    def to_dict(self) -> Dict[str, Any]:
        """Serialize complete narrative consciousness"""
        return {
            "id": self.id,
            "title": self.title,
            "description": self.description,
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