"""
Emergent Narrative Module

Multi-agent storytelling system for autonomous character interactions.
Enhanced with speech synthesis and conscious vocal expression.
"""

__version__ = "1.1.0"

# Import core models
from .models.narrative_models import (
    Character,
    EmergentNarrative,
    CharacterPersonality,
    PersonalityTraits,
    CharacterMemory,
    NarrativeState,
    Scene,
    Act,
    InfluenceVector,
    SavedCharacter,
    CharacterGroup,
    PERSONALITY_TRAIT_CATEGORIES
)

# Import character library management
from .character_library import CharacterLibrary

# Import speech management
from .narrative_speech_manager import (
    NarrativeSpeechManager,
    get_narrative_speech_manager,
    speak_character_line,
    hush_narrative,
    unhush_narrative,
    hush_character_by_id,
    unhush_character_by_id
)

# Convenience exports for easy access
__all__ = [
    # Core models
    'Character',
    'EmergentNarrative', 
    'CharacterPersonality',
    'PersonalityTraits',
    'CharacterMemory',
    'NarrativeState',
    'Scene',
    'Act',
    'InfluenceVector',
    'SavedCharacter',
    'CharacterGroup',
    'PERSONALITY_TRAIT_CATEGORIES',
    
    # Character library
    'CharacterLibrary',
    
    # Speech management
    'NarrativeSpeechManager',
    'get_narrative_speech_manager',
    'speak_character_line',
    'hush_narrative',
    'unhush_narrative',
    'hush_character_by_id',
    'unhush_character_by_id'
] 