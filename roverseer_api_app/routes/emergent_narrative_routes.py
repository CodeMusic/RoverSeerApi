"""
Emergent Narrative Routes

FastAPI routes for managing multi-agent storytelling experiences.
"""

import os
import json
import asyncio
from datetime import datetime
from fastapi import APIRouter, Request, HTTPException, UploadFile, File, Form
from fastapi.responses import JSONResponse, FileResponse, HTMLResponse, RedirectResponse
from fastapi.templating import Jinja2Templates
from typing import List, Dict, Any, Optional
import logging
import uuid
import shutil

# Import our models
import sys
sys.path.append(os.path.dirname(os.path.dirname(__file__)))
from emergent_narrative.models.narrative_models import (
    EmergentNarrative, Character, Act, Scene, InfluenceVector, 
    NarrativeState, CharacterPersonality, SavedCharacter, PersonalityTraits,
    PERSONALITY_TRAIT_CATEGORIES
)
from emergent_narrative.character_library import character_library

# Create router
router = APIRouter()
templates = Jinja2Templates(directory="templates")

# Configure logging
logger = logging.getLogger(__name__)

# Storage paths
NARRATIVES_DIR = os.path.join(os.path.dirname(__file__), '..', 'emergent_narrative', 'logs')
NARRATIVE_IMAGES_DIR = os.path.join(os.path.dirname(__file__), '..', 'static', 'narrative_images')
CHARACTER_IMAGES_DIR = os.path.join(os.path.dirname(__file__), '..', 'static', 'character_images')

os.makedirs(NARRATIVES_DIR, exist_ok=True)
os.makedirs(NARRATIVE_IMAGES_DIR, exist_ok=True)
os.makedirs(CHARACTER_IMAGES_DIR, exist_ok=True)

def get_available_models() -> List[str]:
    """Get available AI models from main app configuration"""
    try:
        from cognition.llm_interface import get_available_models, sort_models_by_size
        models = get_available_models()
        return sort_models_by_size(models)
    except Exception as e:
        logger.error(f"Failed to get models: {e}")
        return []

def get_categorized_models():
    """Get categorized models for organized dropdowns"""
    try:
        from cognition.llm_interface import get_available_models, sort_models_by_size
        
        models = get_available_models()
        models = sort_models_by_size(models)
        
        # Process models to include short names for display
        models_with_display_names = []
        for model in models:
            short_name = model.split(':')[0] if ':' in model else model
            models_with_display_names.append({
                "full_name": model,
                "display_name": short_name
            })
        
        # Categorize models by parameter size
        categories = {
            'Small Models (≤ 2B)': [],
            'Medium Models (3B - 8B)': [],
            'Large Models (≥ 13B)': [],
            'Special Models': []
        }
        
        for model in models_with_display_names:
            short_name = model["display_name"].lower()
            # Special models category
            if any(term in short_name for term in ['personality:', 'phi3', 'gemma']):
                categories['Special Models'].append(model)
            # Small models
            elif any(term in short_name for term in ['1b', '2b', '3b', 'mini']):
                categories['Small Models (≤ 2B)'].append(model)
            # Medium models
            elif any(term in short_name for term in ['7b', '8b']):
                categories['Medium Models (3B - 8B)'].append(model)
            # Large models
            elif any(term in short_name for term in ['13b', '70b', '405b']):
                categories['Large Models (≥ 13B)'].append(model)
            else:
                # Default to medium if unsure
                categories['Medium Models (3B - 8B)'].append(model)
        
        return categories
    except Exception as e:
        logger.error(f"Failed to categorize models: {e}")
        return {}

def get_available_voices() -> List[str]:
    """Get available voices from main app configuration"""
    try:
        import sys
        import os
        sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))
        from expression.text_to_speech import list_voice_ids
        return list_voice_ids()
    except Exception as e:
        logger.error(f"Failed to get voices: {e}")
        return []

def get_categorized_voices():
    """Get categorized voices for organized dropdowns"""
    try:
        import sys
        import os
        sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))
        from expression.text_to_speech import get_categorized_voices
        return get_categorized_voices()
    except Exception as e:
        logger.error(f"Failed to get categorized voices: {e}")
        return {"categorized": {}, "flat_list": []}

@router.get('/emergent_narrative')
async def main_page(request: Request):
    """Main emergent narrative hub page"""
    return templates.TemplateResponse("emergent_narrative/main.html", {"request": request})

@router.get('/emergent_narrative/create')
async def create_page(request: Request):
    """Wizard-style narrative creation page"""
    models = get_available_models()
    categorized_models = get_categorized_models()
    voices = get_available_voices()
    categorized_voices = get_categorized_voices()
    
    return templates.TemplateResponse("emergent_narrative/create.html", {
        "request": request,
        "models": models,
        "categorized_models": categorized_models,
        "voices": voices,
        "categorized_voices": categorized_voices
    })

@router.post('/emergent_narrative/create')
async def create_narrative(request: Request):
    """Create a new emergent narrative from wizard data"""
    try:
        data = await request.json()
        
        # Create narrative instance
        narrative = EmergentNarrative(
            title=data['title'],
            description=data['description'],
            image_path=data.get('image_path', ''),
            max_narrator_announcements=data.get('max_narrator_announcements', 3)  # Default to 3
        )
        
        # Create characters
        for char_data in data['characters']:
            character = Character(
                name=char_data['name'],
                model=char_data['model'],
                voice=char_data['voice'],
                system_message=char_data['system_message'],
                personality_archetype=CharacterPersonality(char_data.get('personality_archetype', 'contemplative')),
                image_path=char_data.get('image_path', '')
            )
            narrative.characters.append(character)
        
        # Create acts and scenes
        for act_data in data['acts']:
            act = Act(
                act_number=act_data['act_number'],
                theme=act_data['theme']
            )
            
            for scene_data in act_data['scenes']:
                scene = Scene(
                    act_id=act.id,
                    scene_number=scene_data['scene_number'],
                    description=scene_data['description'],
                    character_a_id=scene_data['character_a_id'],
                    character_b_id=scene_data['character_b_id'],
                    interaction_cycles=scene_data['interaction_cycles']
                )
                act.scenes.append(scene)
            
            narrative.acts.append(act)
        
        # Save narrative to file
        narrative_file = os.path.join(NARRATIVES_DIR, f"{narrative.id}.json")
        narrative.save_to_file(narrative_file)
        
        logger.info(f"Created new narrative: {narrative.title} ({narrative.id})")
        
        return JSONResponse(content={
            'success': True,
            'narrative_id': narrative.id,
            'message': 'Narrative created successfully'
        })
        
    except Exception as e:
        logger.error(f"Failed to create narrative: {e}")
        raise HTTPException(status_code=400, detail=str(e))

@router.get('/emergent_narrative/list')
async def list_narratives():
    """Get list of existing narratives"""
    try:
        narratives = []
        
        for filename in os.listdir(NARRATIVES_DIR):
            if filename.endswith('.json'):
                try:
                    filepath = os.path.join(NARRATIVES_DIR, filename)
                    narrative = EmergentNarrative.load_from_file(filepath)
                    
                    narratives.append({
                        'id': narrative.id,
                        'title': narrative.title,
                        'description': narrative.description,
                        'image_path': narrative.image_path,
                        'created_at': narrative.created_at.isoformat(),
                        'state': narrative.state.value,
                        'characters': [{'name': char.name, 'id': char.id, 'image_path': char.image_path} for char in narrative.characters],
                        'acts': len(narrative.acts),
                        'total_scenes': sum(len(act.scenes) for act in narrative.acts)
                    })
                    
                except Exception as e:
                    logger.warning(f"Failed to load narrative {filename}: {e}")
                    continue
        
        # Sort by creation date, newest first
        narratives.sort(key=lambda x: x['created_at'], reverse=True)
        
        return JSONResponse(content=narratives)
        
    except Exception as e:
        logger.error(f"Failed to list narratives: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get('/emergent_narrative/play/{narrative_id}')
async def play_narrative(request: Request, narrative_id: str):
    """Playback interface for an existing narrative"""
    try:
        narrative_file = os.path.join(NARRATIVES_DIR, f"{narrative_id}.json")
        
        if not os.path.exists(narrative_file):
            raise HTTPException(status_code=404, detail="Narrative not found")
        
        narrative = EmergentNarrative.load_from_file(narrative_file)
        
        return templates.TemplateResponse("emergent_narrative/play.html", {
            "request": request,
            "narrative": narrative.to_dict()
        })
        
    except Exception as e:
        logger.error(f"Failed to load narrative {narrative_id}: {e}")
        raise HTTPException(status_code=500, detail=f"Error loading narrative: {str(e)}")

@router.post('/emergent_narrative/start/{narrative_id}')
async def start_narrative(narrative_id: str):
    """Start or resume a narrative"""
    try:
        logger.info(f"Starting narrative {narrative_id}")
        narrative_file = os.path.join(NARRATIVES_DIR, f"{narrative_id}.json")
        
        if not os.path.exists(narrative_file):
            logger.error(f"Narrative file not found: {narrative_file}")
            raise HTTPException(status_code=404, detail="Narrative not found")
        
        narrative = EmergentNarrative.load_from_file(narrative_file)
        logger.info(f"Loaded narrative {narrative.title}, current state: {narrative.state.value}")
        
        previous_state = narrative.state
        if narrative.state == NarrativeState.DORMANT:
            narrative.state = NarrativeState.MANIFESTING
            narrative.started_at = datetime.now()
            logger.info(f"Starting narrative from dormant state")
        elif narrative.state == NarrativeState.PAUSED:
            narrative.state = NarrativeState.MANIFESTING
            logger.info(f"Resuming narrative from paused state")
        else:
            logger.warning(f"Narrative was already in state: {narrative.state.value}")
        
        narrative.save_to_file(narrative_file)
        logger.info(f"Narrative state changed from {previous_state.value} to {narrative.state.value}")
        
        return JSONResponse(content={
            'success': True,
            'state': narrative.state.value,
            'message': f'Narrative {narrative.state.value}',
            'previous_state': previous_state.value
        })
        
    except Exception as e:
        logger.error(f"Failed to start narrative {narrative_id}: {type(e).__name__}: {e}")
        import traceback
        logger.error(f"Traceback: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post('/emergent_narrative/pause/{narrative_id}')
async def pause_narrative(narrative_id: str):
    """Pause a running narrative"""
    try:
        narrative_file = os.path.join(NARRATIVES_DIR, f"{narrative_id}.json")
        narrative = EmergentNarrative.load_from_file(narrative_file)
        
        narrative.state = NarrativeState.PAUSED
        narrative.save_to_file(narrative_file)
        
        return JSONResponse(content={
            'success': True,
            'state': narrative.state.value,
            'message': 'Narrative paused'
        })
        
    except Exception as e:
        logger.error(f"Failed to pause narrative {narrative_id}: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post('/emergent_narrative/reset/{narrative_id}')
async def reset_narrative(narrative_id: str):
    """Reset a narrative back to dormant state, clearing all progress"""
    try:
        logger.info(f"Resetting narrative {narrative_id}")
        narrative_file = os.path.join(NARRATIVES_DIR, f"{narrative_id}.json")
        
        if not os.path.exists(narrative_file):
            logger.error(f"Narrative file not found: {narrative_file}")
            raise HTTPException(status_code=404, detail="Narrative not found")
        
        narrative = EmergentNarrative.load_from_file(narrative_file)
        logger.info(f"Resetting narrative {narrative.title} from state: {narrative.state.value}")
        
        # Reset narrative state
        narrative.state = NarrativeState.DORMANT
        narrative.started_at = None
        narrative.completed_at = None
        narrative.current_act = 0
        narrative.current_scene = 0
        
        # Clear all active influences
        narrative.active_influences = []
        
        # Reset narrator announcements count
        narrative.used_narrator_announcements = 0
        
        # Reset all scenes to initial state
        for act in narrative.acts:
            for scene in act.scenes:
                scene.completed_cycles = 0
                scene.interactions = []
                scene.state = "pending"
        
        # Clear all character memories
        for character in narrative.characters:
            character.memory.memories = []
            character.memory.emotional_state = "neutral"
        
        narrative.save_to_file(narrative_file)
        logger.info(f"Successfully reset narrative {narrative_id}")
        
        return JSONResponse(content={
            'success': True,
            'state': narrative.state.value,
            'message': 'Narrative reset to beginning'
        })
        
    except Exception as e:
        logger.error(f"Failed to reset narrative {narrative_id}: {type(e).__name__}: {e}")
        import traceback
        logger.error(f"Traceback: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post('/emergent_narrative/repair/{narrative_id}')
async def repair_narrative(narrative_id: str):
    """Repair character ID mismatches in narrative scenes"""
    try:
        logger.info(f"Repairing narrative {narrative_id}")
        narrative_file = os.path.join(NARRATIVES_DIR, f"{narrative_id}.json")
        
        if not os.path.exists(narrative_file):
            logger.error(f"Narrative file not found: {narrative_file}")
            raise HTTPException(status_code=404, detail="Narrative not found")
        
        narrative = EmergentNarrative.load_from_file(narrative_file)
        logger.info(f"Repairing narrative {narrative.title}")
        
        valid_character_ids = [c.id for c in narrative.characters]
        logger.info(f"Available character IDs for repair: {valid_character_ids}")
        
        repairs_made = 0
        
        # Smart character assignment function for repairs
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
        
        # Check and repair character references in scenes with smart assignment
        for act in narrative.acts:
            for scene in act.scenes:
                logger.info(f"Checking scene {scene.scene_number} - chars: {scene.character_a_id}, {scene.character_b_id}")
                
                # If character_a_id is invalid, use smart assignment
                if scene.character_a_id not in valid_character_ids:
                    logger.warning(f"Invalid character_a_id: {scene.character_a_id}")
                    if len(valid_character_ids) > 0:
                        smart_index = get_smart_character_assignment(scene.scene_number, len(valid_character_ids), True)
                        scene.character_a_id = valid_character_ids[smart_index]
                        repairs_made += 1
                        logger.info(f"Smart-repaired character_a_id to: {scene.character_a_id} (character #{smart_index + 1})")
                
                # If character_b_id is invalid, use smart assignment
                if scene.character_b_id not in valid_character_ids:
                    logger.warning(f"Invalid character_b_id: {scene.character_b_id}")
                    if len(valid_character_ids) > 1:
                        smart_index = get_smart_character_assignment(scene.scene_number, len(valid_character_ids), False)
                        scene.character_b_id = valid_character_ids[smart_index]
                    elif len(valid_character_ids) > 0:
                        scene.character_b_id = valid_character_ids[0]
                    repairs_made += 1
                    logger.info(f"Smart-repaired character_b_id to: {scene.character_b_id}")
        
        # Save repaired narrative
        narrative.save_to_file(narrative_file)
        logger.info(f"Smart repair completed - {repairs_made} fixes applied")
        
        return JSONResponse(content={
            'success': True,
            'repairs_made': repairs_made,
            'message': f'Applied {repairs_made} character ID fixes'
        })
        
    except Exception as e:
        logger.error(f"Failed to repair narrative {narrative_id}: {type(e).__name__}: {e}")
        import traceback
        logger.error(f"Traceback: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get('/emergent_narrative/status/{narrative_id}')
async def get_narrative_status(narrative_id: str):
    """Get current status of a narrative"""
    try:
        narrative_file = os.path.join(NARRATIVES_DIR, f"{narrative_id}.json")
        
        # Check if narrative file exists
        if not os.path.exists(narrative_file):
            logger.error(f"Narrative file not found: {narrative_file}")
            raise HTTPException(status_code=404, detail="Narrative file not found")
        
        # Try to load narrative
        try:
            narrative = EmergentNarrative.load_from_file(narrative_file)
        except Exception as load_error:
            logger.error(f"Failed to load narrative from {narrative_file}: {load_error}")
            raise HTTPException(status_code=500, detail=f"Failed to load narrative: {load_error}")
        
        # Try to get current scene and act with better error handling
        try:
            current_scene = narrative.get_current_scene()
            current_act = narrative.get_current_act()
        except Exception as scene_error:
            logger.error(f"Failed to get current scene/act for {narrative_id}: {scene_error}")
            # Return basic status without scene info
            return JSONResponse(content={
                'id': narrative.id,
                'title': narrative.title,
                'state': narrative.state.value,
                'current_act': narrative.current_act,
                'current_scene': narrative.current_scene,
                'total_acts': len(narrative.acts),
                'current_act_info': None,
                'current_scene_info': None,
                'active_influences': []
            })
        
        # Build current_act_info safely
        current_act_info = None
        if current_act:
            try:
                current_act_info = {
                    'number': current_act.act_number,
                    'theme': current_act.theme,
                    'total_scenes': len(current_act.scenes)
                }
            except Exception as act_error:
                logger.error(f"Failed to build act info: {act_error}")
        
        # Build current_scene_info safely
        current_scene_info = None
        if current_scene:
            try:
                char_a = narrative.get_character_by_id(current_scene.character_a_id)
                char_b = narrative.get_character_by_id(current_scene.character_b_id)
                
                # Get scene progress information (counting only character interactions)
                character_interactions = [i for i in current_scene.interactions if i['character_id'] != 'NARRATOR']
                total_character_interactions = len(character_interactions)
                total_interactions = len(current_scene.interactions)  # Include narrator for total count
                required_interactions = current_scene.interaction_cycles * 2
                completed_cycles = current_scene.completed_cycles  # Use stored value
                partial_cycle = total_character_interactions % 2
                remaining_interactions = required_interactions - total_character_interactions
                
                logger.info(f"DEBUG STATUS: Scene {current_scene.id}, stored completed_cycles = {current_scene.completed_cycles}")
                logger.info(f"DEBUG STATUS: Character interactions = {total_character_interactions}, total with narrator = {total_interactions}, required = {required_interactions}")
                logger.info(f"DEBUG STATUS: Scene interaction_cycles setting = {current_scene.interaction_cycles}")
                
                # Create progress description
                if partial_cycle > 0:
                    progress_text = f"{completed_cycles}.5/{current_scene.interaction_cycles}"
                else:
                    progress_text = f"{completed_cycles}/{current_scene.interaction_cycles}"
                
                # Generate countdown info
                countdown_info = None
                if remaining_interactions <= 3 and remaining_interactions > 0:
                    countdown_info = {
                        'active': True,
                        'remaining': remaining_interactions,
                        'message': f"⏰ {remaining_interactions} exchanges until scene completion!"
                    }
                
                current_scene_info = {
                    'number': current_scene.scene_number,
                    'description': current_scene.description,
                    'completed_cycles': completed_cycles,
                    'total_cycles': current_scene.interaction_cycles,
                    'total_interactions': total_interactions,
                    'character_interactions': total_character_interactions,
                    'required_interactions': required_interactions,
                    'remaining_interactions': remaining_interactions,
                    'progress_text': progress_text,
                    'characters': [char_a.name if char_a else "Unknown", char_b.name if char_b else "Unknown"],
                    'countdown': countdown_info
                }
            except Exception as scene_info_error:
                logger.error(f"Failed to build scene info: {scene_info_error}")
                current_scene_info = {
                    'number': current_scene.scene_number if hasattr(current_scene, 'scene_number') else 0,
                    'description': getattr(current_scene, 'description', 'Unknown scene'),
                    'completed_cycles': getattr(current_scene, 'completed_cycles', 0),
                    'total_cycles': getattr(current_scene, 'interaction_cycles', 0),
                    'total_interactions': 0,
                    'required_interactions': 0,
                    'progress_text': '0/0',
                    'characters': ['Character A', 'Character B']
                }
        
        # Build active influences safely
        active_influences = []
        try:
            if hasattr(narrative, 'active_influences') and narrative.active_influences:
                for inf in narrative.active_influences:
                    if hasattr(inf, 'is_active') and inf.is_active():
                        active_influences.append({
                            'word': getattr(inf, 'word_of_influence', 'Unknown'),
                            'target': getattr(inf, 'target_character', None),
                            'remaining_cycles': getattr(inf, 'remaining_cycles', 0)
                        })
        except Exception as influences_error:
            logger.error(f"Failed to build influences: {influences_error}")
        
        return JSONResponse(content={
            'id': narrative.id,
            'title': narrative.title,
            'state': narrative.state.value,
            'current_act': narrative.current_act,
            'current_scene': narrative.current_scene,
            'total_acts': len(narrative.acts),
            'current_act_info': current_act_info,
            'current_scene_info': current_scene_info,
            'active_influences': active_influences,
            'narrator_status': narrative.get_narrator_status()
        })
        
    except HTTPException:
        # Re-raise HTTP exceptions
        raise
    except Exception as e:
        logger.error(f"Unexpected error in get_narrative_status {narrative_id}: {type(e).__name__}: {e}")
        import traceback
        logger.error(f"Traceback: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=f"Unexpected error: {type(e).__name__}: {str(e)}")

@router.get('/emergent_narrative/interactions/{narrative_id}')
async def get_narrative_interactions(narrative_id: str):
    """Get all interactions from the current scene for display"""
    try:
        narrative_file = os.path.join(NARRATIVES_DIR, f"{narrative_id}.json")
        narrative = EmergentNarrative.load_from_file(narrative_file)
        
        current_scene = narrative.get_current_scene()
        if not current_scene:
            return JSONResponse(content={'interactions': []})
        
        # Format interactions for display
        formatted_interactions = []
        for interaction in current_scene.interactions:
            if interaction['character_id'] == 'NARRATOR':
                # Special handling for narrator announcements
                formatted_interactions.append({
                    'character': 'NARRATOR',
                    'response': interaction['content'],
                    'timestamp': interaction['timestamp'],
                    'type': 'narrator_announcement'
                })
            else:
                character = narrative.get_character_by_id(interaction['character_id'])
                formatted_interactions.append({
                    'character': character.name if character else 'Unknown',
                    'response': interaction['content'],
                    'timestamp': interaction['timestamp'],
                    'influence_applied': interaction.get('metadata', {}).get('influence')
                })
        
        return JSONResponse(content={'interactions': formatted_interactions})
        
    except Exception as e:
        logger.error(f"Failed to get interactions for narrative {narrative_id}: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post('/emergent_narrative/influence/{narrative_id}')
async def apply_influence(request: Request, narrative_id: str):
    """Apply a word of influence to affect character behavior"""
    try:
        data = await request.json()
        narrative_file = os.path.join(NARRATIVES_DIR, f"{narrative_id}.json")
        narrative = EmergentNarrative.load_from_file(narrative_file)
        
        influence = InfluenceVector(
            word_of_influence=data['word'],
            target_character=data.get('target_character'),  # None for "all"
            duration_cycles=data.get('duration_cycles', 3),
            remaining_cycles=data.get('duration_cycles', 3),
            intensity=data.get('intensity', 1.0)
        )
        
        narrative.apply_influence(influence)
        narrative.save_to_file(narrative_file)
        
        logger.info(f"Applied influence '{influence.word_of_influence}' to narrative {narrative_id}")
        
        return JSONResponse(content={
            'success': True,
            'influence_id': influence.id,
            'message': f"Influence '{influence.word_of_influence}' applied"
        })
        
    except Exception as e:
        logger.error(f"Failed to apply influence to narrative {narrative_id}: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post('/emergent_narrative/narrator_announcement/{narrative_id}')
async def narrator_announcement(request: Request, narrative_id: str):
    """Add a narrator announcement to the narrative"""
    try:
        data = await request.json()
        text = data.get('text', '').strip()
        output_mode = data.get('output_mode', 'text')
        
        if not text:
            raise HTTPException(status_code=400, detail="Announcement text is required")
        
        narrative_file = os.path.join(NARRATIVES_DIR, f"{narrative_id}.json")
        narrative = EmergentNarrative.load_from_file(narrative_file)
        
        # Check if narrative is in a state where announcements are allowed
        if narrative.state.value not in ['manifesting']:
            raise HTTPException(status_code=400, detail="Narrator announcements can only be made during active narratives")
        
        # Check if narrator announcements are available
        if not narrative.can_use_narrator_announcement():
            narrator_status = narrative.get_narrator_status()
            raise HTTPException(
                status_code=403, 
                detail=f"Narrator limit reached. Used {narrator_status['used']}/{narrator_status['max']} announcements. Use influences instead."
            )
        
        # Get current scene
        current_scene = narrative.get_current_scene()
        if not current_scene:
            raise HTTPException(status_code=400, detail="No active scene for narrator announcement")
        
        # Use a narrator announcement
        if not narrative.use_narrator_announcement():
            raise HTTPException(status_code=403, detail="Failed to use narrator announcement")
        
        # Add the announcement as a special interaction
        current_scene.add_interaction(
            character_id="NARRATOR",  # Special ID for narrator
            content=text,
            metadata={
                'type': 'narrator_announcement',
                'timestamp': datetime.now().isoformat(),
                'output_mode': output_mode
            }
        )
        
        # Save narrative state
        narrative.save_to_file(narrative_file)
        
        # Handle audio output if requested
        audio_url = None
        if output_mode in ['rover_audio', 'local_audio']:
            audio_url = await generate_narrator_audio_output(text, output_mode)
        
        narrator_status = narrative.get_narrator_status()
        logger.info(f"Added narrator announcement to narrative {narrative_id} ({narrator_status['used']}/{narrator_status['max']} used): '{text[:50]}...'")
        
        return JSONResponse(content={
            'success': True,
            'text': text,
            'audio_url': audio_url,
            'output_mode': output_mode,
            'timestamp': datetime.now().isoformat(),
            'narrator_status': narrator_status
        })
        
    except Exception as e:
        logger.error(f"Failed to add narrator announcement to {narrative_id}: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post('/emergent_narrative/advance/{narrative_id}')
async def advance_narrative(request: Request, narrative_id: str):
    """Process next interaction in the narrative"""
    try:
        data = await request.json()
        output_mode = data.get('output_mode', 'text')  # 'text', 'rover_audio', 'local_audio'
        
        narrative_file = os.path.join(NARRATIVES_DIR, f"{narrative_id}.json")
        narrative = EmergentNarrative.load_from_file(narrative_file)
        
        current_scene = narrative.get_current_scene()
        if not current_scene:
            raise HTTPException(status_code=400, detail="No active scene")
        
        logger.info(f"Current scene {current_scene.scene_number}: char_a={current_scene.character_a_id}, char_b={current_scene.character_b_id}")
        
        # Auto-repair character IDs if they're invalid - but use smart rotation
        available_char_ids = [c.id for c in narrative.characters]
        logger.info(f"Available character IDs: {available_char_ids}")
        
        repairs_made = False
        
        # Smart character assignment based on scene progression
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
        
        # Check and auto-repair character_a_id
        if current_scene.character_a_id not in available_char_ids:
            logger.warning(f"Invalid character_a_id: {current_scene.character_a_id} - auto-repairing with smart assignment")
            if len(available_char_ids) > 0:
                smart_index = get_smart_character_assignment(current_scene.scene_number, len(available_char_ids), True)
                current_scene.character_a_id = available_char_ids[smart_index]
                repairs_made = True
                logger.info(f"Auto-repaired character_a_id to: {current_scene.character_a_id} (index {smart_index})")
        
        # Check and auto-repair character_b_id  
        if current_scene.character_b_id not in available_char_ids:
            logger.warning(f"Invalid character_b_id: {current_scene.character_b_id} - auto-repairing with smart assignment")
            if len(available_char_ids) > 1:
                smart_index = get_smart_character_assignment(current_scene.scene_number, len(available_char_ids), False)
                current_scene.character_b_id = available_char_ids[smart_index]
            elif len(available_char_ids) > 0:
                # Fallback to first character if only one exists
                current_scene.character_b_id = available_char_ids[0]
            repairs_made = True
            logger.info(f"Auto-repaired character_b_id to: {current_scene.character_b_id}")
        
        # Save repairs immediately if any were made
        if repairs_made:
            logger.info("Smart character ID repairs made - saving narrative")
            narrative.save_to_file(narrative_file)
        
        # Now safely get characters (should always work after auto-repair)
        char_a = narrative.get_character_by_id(current_scene.character_a_id)
        char_b = narrative.get_character_by_id(current_scene.character_b_id)
        
        # Final fallback - if still no characters found, use first two available
        if not char_a or not char_b:
            logger.error("Critical character assignment failure - using fallback assignments")
            if len(narrative.characters) >= 2:
                char_a = narrative.characters[0]
                char_b = narrative.characters[1]
                current_scene.character_a_id = char_a.id
                current_scene.character_b_id = char_b.id
                narrative.save_to_file(narrative_file)
            else:
                raise HTTPException(status_code=500, detail="Narrative must have at least 2 characters")
        
        logger.info(f"Final character assignments: {char_a.name} (A) and {char_b.name} (B)")
        
        # Determine whose turn it is based on the number of CHARACTER interactions (excluding narrator announcements)
        character_interactions_count = len([i for i in current_scene.interactions if i['character_id'] != 'NARRATOR'])
        current_character = char_a if character_interactions_count % 2 == 0 else char_b
        other_character = char_b if current_character == char_a else char_a
        
        logger.info(f"TURN DEBUG: Scene {current_scene.scene_number}, character_interactions_count = {character_interactions_count} (total with narrator: {len(current_scene.interactions)})")
        logger.info(f"TURN DEBUG: char_a = {char_a.name} ({char_a.id}), char_b = {char_b.name} ({char_b.id})")
        logger.info(f"TURN DEBUG: Turn {character_interactions_count}: {current_character.name} speaks to {other_character.name}")
        logger.info(f"TURN DEBUG: Logic: character_interactions_count {character_interactions_count} % 2 == 0? {character_interactions_count % 2 == 0} -> Character {'A' if character_interactions_count % 2 == 0 else 'B'}")
        
        # Additional check for potential same-character-twice bug
        if character_interactions_count > 0 and current_scene.interactions:
            last_interaction = current_scene.interactions[-1]
            last_character_id = last_interaction['character_id']
            if last_character_id == current_character.id:
                logger.error(f"POTENTIAL BUG: Same character ({current_character.name}) speaking twice in a row!")
                logger.error(f"Last interaction character_id: {last_character_id}, Current character_id: {current_character.id}")
                logger.error(f"Scene interactions so far: {[(i['character_id'], narrative.get_character_by_id(i['character_id']).name if narrative.get_character_by_id(i['character_id']) else 'Unknown') for i in current_scene.interactions]}")
        
        # Build context for the current character (includes influences automatically)
        context = build_character_context(narrative, current_scene, current_character, other_character)
        
        # Get active influence for this character (needed for metadata)
        influence = narrative.get_active_influence_for_character(current_character.id)
        
        # Call the AI model to generate response
        response_text = await generate_character_response(current_character, context)
        
        # Decrement influence cycles after each turn (this was missing!)
        for active_influence in narrative.active_influences:
            if active_influence.is_active():
                active_influence.apply_to_cycle()
                logger.info(f"Decremented influence '{active_influence.word_of_influence}' cycles: {active_influence.remaining_cycles} remaining")
        
        # Remove expired influences
        narrative.active_influences = [inf for inf in narrative.active_influences if inf.is_active()]
        
        # Store the interaction
        current_scene.add_interaction(
            character_id=current_character.id,
            content=response_text,
            metadata={'turn': character_interactions_count, 'influence': influence.word_of_influence if influence else None}
        )
        
        # Check scene completion AFTER adding the interaction
        new_interactions_count = len(current_scene.interactions)
        scene_completed = current_scene.is_completed()
        
        logger.info(f"Scene progress: {new_interactions_count} interactions = {current_scene.completed_cycles}/{current_scene.interaction_cycles} cycles")
        logger.info(f"Scene completion check: {new_interactions_count} interactions, requires {current_scene.interaction_cycles * 2}, completed: {scene_completed}")
        
        # Update character memory with comprehensive context
        current_act = narrative.get_current_act()
        required_interactions = current_scene.interaction_cycles * 2
        current_character.memory.add_memory({
            'type': 'scene_interaction',
            'act_number': current_act.act_number if current_act else 0,
            'act_theme': current_act.theme if current_act else 'Unknown',
            'scene_id': current_scene.id,
            'scene_number': current_scene.scene_number,
            'scene_description': current_scene.description,
            'conversation_partner': other_character.name,
            'conversation_partner_id': other_character.id,
            'my_response': response_text,
            'scene_progress': f"{len(current_scene.interactions)}/{required_interactions}",
            'interactions_remaining': required_interactions - len(current_scene.interactions),
            'emotional_impact': 'neutral',  # Could be enhanced with sentiment analysis
            'scene_completed': scene_completed,
            'timestamp': datetime.now().isoformat()
        })
        
        # Note: Influences decrement each turn and expire naturally, or are cleared when scene completes
        
        # Continue with narrative advancement logic
        narrative_advanced = False
        influences_cleared = False
        
        if scene_completed:
            logger.info(f"Scene {current_scene.scene_number} completed! Advancing narrative...")
            old_scene_number = current_scene.scene_number
            
            # Clear all influences when scene completes
            if narrative.active_influences:
                cleared_influences = [inf.word_of_influence for inf in narrative.active_influences]
                logger.info(f"Scene complete - clearing all influences: {cleared_influences}")
                narrative.active_influences = []
                influences_cleared = True
            else:
                logger.info("Scene complete - no active influences to clear")
            
            narrative_advanced = narrative.advance_narrative()
            if narrative_advanced:
                logger.info(f"Advanced to next scene/act. New position: Act {narrative.current_act}, Scene {narrative.current_scene}")
                
                # Get the new scene and auto-repair its character assignments too
                new_current_scene = narrative.get_current_scene()
                if new_current_scene:
                    # Auto-repair new scene character IDs if needed using smart assignment
                    new_scene_repairs = False
                    if new_current_scene.character_a_id not in available_char_ids:
                        smart_index = get_smart_character_assignment(new_current_scene.scene_number, len(available_char_ids), True)
                        new_current_scene.character_a_id = available_char_ids[smart_index] if available_char_ids else ""
                        new_scene_repairs = True
                        logger.info(f"Smart-repaired new scene character_a_id to: {new_current_scene.character_a_id}")
                    if new_current_scene.character_b_id not in available_char_ids:
                        smart_index = get_smart_character_assignment(new_current_scene.scene_number, len(available_char_ids), False)
                        new_current_scene.character_b_id = available_char_ids[smart_index] if len(available_char_ids) > smart_index else available_char_ids[0]
                        new_scene_repairs = True
                        logger.info(f"Smart-repaired new scene character_b_id to: {new_current_scene.character_b_id}")
                    
                    if new_scene_repairs:
                        logger.info("Smart auto-repaired new scene character assignments")
                    
                    # Prevent same character from going twice in a row across scene boundaries
                    if current_scene.interactions:
                        last_speaker_id = current_scene.interactions[-1]['character_id']
                        new_first_speaker_id = new_current_scene.character_a_id  # char_a always goes first in new scenes
                        
                        if last_speaker_id == new_first_speaker_id and len(available_char_ids) >= 2:
                            logger.info(f"ANTI-REPEAT: Last speaker {narrative.get_character_by_id(last_speaker_id).name if narrative.get_character_by_id(last_speaker_id) else 'Unknown'} would go first in new scene - swapping character assignments")
                            # Swap A and B to ensure different speaker goes first
                            temp_id = new_current_scene.character_a_id
                            new_current_scene.character_a_id = new_current_scene.character_b_id
                            new_current_scene.character_b_id = temp_id
                            logger.info(f"ANTI-REPEAT: Swapped characters - new first speaker: {narrative.get_character_by_id(new_current_scene.character_a_id).name if narrative.get_character_by_id(new_current_scene.character_a_id) else 'Unknown'}")
                    
                    new_char_a = narrative.get_character_by_id(new_current_scene.character_a_id)
                    new_char_b = narrative.get_character_by_id(new_current_scene.character_b_id)
                    logger.info(f"NEW SCENE CHARACTERS: Scene {new_current_scene.scene_number} - {new_char_a.name if new_char_a else 'Unknown'} & {new_char_b.name if new_char_b else 'Unknown'}")
        
        # Save narrative state
        narrative.save_to_file(narrative_file)
        
        # Handle audio output if requested
        audio_url = None
        if output_mode in ['rover_audio', 'local_audio']:
            audio_url = await generate_audio_output(response_text, current_character.voice, output_mode)
        
        # For the return data, use the active scene (which may be new if advanced)
        active_scene = narrative.get_current_scene()
        active_scene_number = active_scene.scene_number if active_scene else current_scene.scene_number
        
        # For next_character, determine based on the active scene
        next_character_name = None
        if not narrative.state.value == 'completed' and active_scene:
            # Determine next character in current/new scene
            active_interactions_count = len(active_scene.interactions)
            active_char_a = narrative.get_character_by_id(active_scene.character_a_id)
            active_char_b = narrative.get_character_by_id(active_scene.character_b_id)
            if active_char_a and active_char_b:
                next_char = active_char_a if active_interactions_count % 2 == 0 else active_char_b
                next_character_name = next_char.name
                logger.info(f"Next character in scene {active_scene.scene_number}: {next_character_name}")
        
        return JSONResponse(content={
            'success': True,
            'character': current_character.name,
            'response': response_text,
            'scene_completed': scene_completed,
            'narrative_advanced': narrative_advanced,
            'narrative_completed': narrative.state.value == 'completed',
            'current_scene': active_scene_number,
            'current_act': narrative.current_act + 1,
            'next_character': next_character_name,
            'audio_url': audio_url,
            'output_mode': output_mode,
            'influence_applied': influence.word_of_influence if influence else None,
            'influences_cleared': influences_cleared,  # Let frontend know if influences were cleared
            'auto_repairs_made': repairs_made  # Let frontend know if repairs happened
        })
        
    except Exception as e:
        logger.error(f"Failed to advance narrative {narrative_id}: {e}")
        raise HTTPException(status_code=500, detail=str(e))

def build_character_context(narrative: EmergentNarrative, scene: Scene, character: Character, other_character: Character) -> str:
    """Build comprehensive context for character's AI interaction with enhanced tagging and optimized information"""
    current_act = narrative.get_current_act()
    
    # Calculate scene progress (only count character interactions)
    character_interactions = [i for i in scene.interactions if i['character_id'] != 'NARRATOR']
    current_interactions = len(character_interactions)
    required_interactions = scene.interaction_cycles * 2
    completed_cycles = scene.completed_cycles
    remaining_interactions = required_interactions - current_interactions
    
    # Get enhanced personality information with proper tags
    personality_prompt = ""
    if hasattr(character, 'personality_traits') and character.personality_traits:
        personality_prompt = character.personality_traits.generate_personality_prompt()
    
    # Build core character identity with structured tags
    context = f"""You are {character.name}.

<core_identity>
{character.system_message}
</core_identity>

{personality_prompt}

<scene_context>
Act {current_act.act_number}: "{current_act.theme}"
Scene {scene.scene_number}: {scene.description}
Conversing with: {other_character.name}
Progress: {completed_cycles}/{scene.interaction_cycles} cycles complete ({remaining_interactions} exchanges remaining)
</scene_context>"""

    # Build optimized conversation history with key moments
    conversation_summary = get_character_conversation_summary(narrative, character, max_entries=8)
    if conversation_summary:
        context += f"""

<conversation_memory>
{conversation_summary}
</conversation_memory>"""

    # Add active influences if any
    active_influence = narrative.get_active_influence_for_character(character.id)
    if active_influence:
        context += f"""

<influence>The word "{active_influence.word_of_influence}" seems important, but you do not know why</influence>"""

    # Add current scene interactions with proper tagging
    if scene.interactions:
        context += "\n\n<current_scene>"
        for interaction in scene.interactions:
            if interaction['character_id'] == 'NARRATOR':
                context += f"\n[NARRATOR]: {interaction['content']}"
            else:
                char = narrative.get_character_by_id(interaction['character_id'])
                char_name = char.name if char else 'Unknown'
                context += f"\n{char_name}: {interaction['content']}"
        context += "\n</current_scene>"
    else:
        context += "\n\n<current_scene>\n(Scene beginning - no interactions yet)\n</current_scene>"

    # Build response guidelines with urgency awareness
    guidelines = []
    
    # Handle narrator announcements with high priority
    if scene.interactions and scene.interactions[-1]['character_id'] == 'NARRATOR':
        most_recent_announcement = scene.interactions[-1]['content']
        guidelines.insert(0, f"🎭 CRITICAL: You must immediately acknowledge and react to this narrator event: \"{most_recent_announcement}\" - this is happening in your world RIGHT NOW")
    
    # Add countdown urgency
    if remaining_interactions == 1:
        guidelines.append("🔥 FINAL EXCHANGE: Conclude this conversation meaningfully")
    elif remaining_interactions == 2:
        guidelines.append("⚡ URGENT: Begin wrapping up (2 exchanges left)")
    elif remaining_interactions == 3:
        guidelines.append("⏰ PREPARE: Start moving toward conclusion (3 exchanges left)")
    
    guidelines.extend([
        "Stay true to your character identity and personality",
        "Acknowledge conversation history when relevant", 
        "Keep responses conversational and under 3 sentences",
        "Engage meaningfully within the scene's context"
    ])
    
    context += f"""

<response_guidelines>
{chr(10).join(f"• {guideline}" for guideline in guidelines)}
</response_guidelines>"""
    
    return context


def get_character_conversation_summary(narrative: EmergentNarrative, character: Character, max_entries: int = 8) -> str:
    """Get a condensed summary of character's conversation history with key moments highlighted"""
    summary_sections = []
    total_entries = 0
    
    # Go through acts in reverse order (most recent first)
    for act in reversed(narrative.acts):
        if total_entries >= max_entries:
            break
            
        act_entries = []
        
        # Go through scenes in reverse order
        for scene in reversed(act.scenes):
            if total_entries >= max_entries:
                break
                
            # Check if this character was in this scene
            if scene.character_a_id == character.id or scene.character_b_id == character.id:
                other_char_id = scene.character_b_id if scene.character_a_id == character.id else scene.character_a_id
                other_char = narrative.get_character_by_id(other_char_id)
                other_char_name = other_char.name if other_char else "Unknown"
                
                # Get the most significant interactions from this scene
                if scene.interactions:
                    character_messages = []
                    narrator_events = []
                    
                    for interaction in scene.interactions:
                        if interaction['character_id'] == 'NARRATOR':
                            narrator_events.append(interaction['content'])
                        elif interaction['character_id'] == character.id:
                            character_messages.append(interaction['content'])
                    
                    # Build scene summary
                    scene_summary = f"With {other_char_name}"
                    if narrator_events:
                        scene_summary += f" (Events: {'; '.join(narrator_events[:2])})"  # Max 2 events
                    
                    # Add most recent character response
                    if character_messages:
                        last_response = character_messages[-1]
                        if len(last_response) > 100:
                            last_response = last_response[:97] + "..."
                        scene_summary += f": \"{last_response}\""
                    
                    act_entries.append(scene_summary)
                    total_entries += 1
        
        # Add act section if character had conversations
        if act_entries:
            act_section = f"Act {act.act_number} ({act.theme}):\n" + "\n".join(f"  • {entry}" for entry in act_entries)
            summary_sections.append(act_section)
    
    if summary_sections:
        return "\n\n".join(summary_sections)
    else:
        return "First conversation in this narrative"

async def generate_character_response(character: Character, context: str) -> str:
    """Generate AI response for character with enhanced tagging"""
    try:
        from cognition.llm_interface import run_chat_completion
        
        messages = [
            {"role": "system", "content": character.system_message},
            {"role": "user", "content": context}
        ]
        
        response = run_chat_completion(
            model=character.model,
            messages=messages,
            system_message=character.system_message,
            voice_id=character.voice
        )
        
        return response
        
    except Exception as e:
        logger.error(f"Failed to generate response for {character.name}: {e}")
        return f"[{character.name} is thinking...]"

async def generate_audio_output(text: str, voice: str, output_mode: str) -> Optional[str]:
    """Generate audio output based on mode"""
    try:
        if output_mode == 'rover_audio':
            # Play on RoverSeer speakers
            from expression.text_to_speech import speak_text
            speak_text(text, voice)
            return None
        elif output_mode == 'local_audio':
            # Generate audio file for download
            import tempfile
            import uuid
            from expression.text_to_speech import generate_tts_audio
            
            temp_file = f"/tmp/narrative_audio_{uuid.uuid4().hex}.wav"
            output_file, _ = generate_tts_audio(text, voice, temp_file)
            return f"/tmp/narrative_audio/{os.path.basename(output_file)}"
        
        return None
        
    except Exception as e:
        logger.error(f"Failed to generate audio: {e}")
        return None

async def generate_narrator_audio_output(text: str, output_mode: str) -> Optional[str]:
    """Generate audio output for narrator announcements using a narrator voice"""
    try:
        # Use a specific narrator voice - you can customize this
        narrator_voice = "en_speaker_9"  # Choose a distinctive voice for the narrator
        
        if output_mode == 'rover_audio':
            # Play on RoverSeer speakers
            from expression.text_to_speech import speak_text
            speak_text(text, narrator_voice)
            return None
        elif output_mode == 'local_audio':
            # Generate audio file for download
            import tempfile
            import uuid
            from expression.text_to_speech import generate_tts_audio
            
            temp_file = f"/tmp/narrator_audio_{uuid.uuid4().hex}.wav"
            output_file, _ = generate_tts_audio(text, narrator_voice, temp_file)
            return f"/tmp/narrative_audio/{os.path.basename(output_file)}"
        
        return None
        
    except Exception as e:
        logger.error(f"Failed to generate narrator audio: {e}")
        return None

@router.get('/emergent_narrative/edit/{narrative_id}')
async def edit_narrative_page(request: Request, narrative_id: str):
    """Narrative editing page"""
    try:
        narrative_file = os.path.join(NARRATIVES_DIR, f"{narrative_id}.json")
        narrative = EmergentNarrative.load_from_file(narrative_file)
        
        # Get available models and voices
        models = get_available_models()
        categorized_models = get_categorized_models()
        voices = get_available_voices()
        categorized_voices = get_categorized_voices()
        
        return templates.TemplateResponse("emergent_narrative/edit.html", {
            "request": request,
            "narrative": narrative,
            "models": models,
            "categorized_models": categorized_models,
            "voices": voices,
            "categorized_voices": categorized_voices
        })
        
    except Exception as e:
        logger.error(f"Failed to load narrative for editing {narrative_id}: {e}")
        raise HTTPException(status_code=404, detail="Narrative not found")

@router.put('/emergent_narrative/edit/{narrative_id}')
async def update_narrative(request: Request, narrative_id: str):
    """Update an existing narrative"""
    try:
        data = await request.json()
        narrative_file = os.path.join(NARRATIVES_DIR, f"{narrative_id}.json")
        
        # Load existing narrative
        narrative = EmergentNarrative.load_from_file(narrative_file)
        
        # Update basic info
        narrative.title = data.get('title', narrative.title)
        narrative.description = data.get('description', narrative.description)
        narrative.image_path = data.get('image_path', narrative.image_path)
        
        # Update characters
        if 'characters' in data:
            narrative.characters = [Character.from_dict(char_data) for char_data in data['characters']]
        
        # Update acts and scenes if provided
        if 'acts' in data:
            narrative.acts = []
            for act_data in data['acts']:
                act = Act(
                    id=act_data.get('id', str(uuid.uuid4())),
                    act_number=act_data['act_number'],
                    theme=act_data['theme']
                )
                
                if 'scenes' in act_data:
                    for scene_data in act_data['scenes']:
                        scene = Scene(
                            id=scene_data.get('id', str(uuid.uuid4())),
                            act_id=act.id,
                            scene_number=scene_data['scene_number'],
                            description=scene_data['description'],
                            character_a_id=scene_data['character_a_id'],
                            character_b_id=scene_data['character_b_id'],
                            interaction_cycles=scene_data['interaction_cycles'],
                            state=scene_data.get('state', 'pending')
                        )
                        act.scenes.append(scene)
                
                narrative.acts.append(act)
        
        # Save updated narrative
        narrative.save_to_file(narrative_file)
        
        logger.info(f"Updated narrative {narrative_id}")
        return JSONResponse(content={'success': True, 'message': 'Narrative updated successfully'})
        
    except Exception as e:
        logger.error(f"Failed to update narrative {narrative_id}: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.delete('/emergent_narrative/delete/{narrative_id}')
async def delete_narrative(narrative_id: str):
    """Delete a narrative"""
    try:
        narrative_file = os.path.join(NARRATIVES_DIR, f"{narrative_id}.json")
        
        if os.path.exists(narrative_file):
            # Also try to delete associated narrative image
            try:
                narrative = EmergentNarrative.load_from_file(narrative_file)
                if narrative.image_path:
                    image_file = os.path.join(NARRATIVE_IMAGES_DIR, os.path.basename(narrative.image_path))
                    if os.path.exists(image_file):
                        os.remove(image_file)
            except Exception as img_error:
                logger.warning(f"Failed to delete narrative image: {img_error}")
            
            os.remove(narrative_file)
            logger.info(f"Deleted narrative {narrative_id}")
            return JSONResponse(content={'success': True, 'message': 'Narrative deleted'})
        else:
            raise HTTPException(status_code=404, detail="Narrative not found")
            
    except Exception as e:
        logger.error(f"Failed to delete narrative {narrative_id}: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post('/emergent_narrative/upload_narrative_image')
async def upload_narrative_image(file: UploadFile = File(...)):
    """Upload an image for a narrative"""
    try:
        # Validate file type
        if not file.content_type or not file.content_type.startswith('image/'):
            raise HTTPException(status_code=400, detail="File must be an image")
        
        # Generate unique filename
        file_extension = os.path.splitext(file.filename)[1] if file.filename else '.jpg'
        unique_filename = f"{uuid.uuid4()}{file_extension}"
        file_path = os.path.join(NARRATIVE_IMAGES_DIR, unique_filename)
        
        # Save file
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        
        # Return relative path for storage in database
        relative_path = f"/static/narrative_images/{unique_filename}"
        
        return JSONResponse(content={
            'success': True,
            'image_path': relative_path,
            'filename': unique_filename
        })
        
    except Exception as e:
        logger.error(f"Failed to upload narrative image: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post('/emergent_narrative/upload_character_image')
async def upload_character_image(file: UploadFile = File(...)):
    """Upload an image for a character"""
    try:
        # Validate file type
        if not file.content_type or not file.content_type.startswith('image/'):
            raise HTTPException(status_code=400, detail="File must be an image")
        
        # Generate unique filename
        file_extension = os.path.splitext(file.filename)[1] if file.filename else '.jpg'
        unique_filename = f"{uuid.uuid4()}{file_extension}"
        file_path = os.path.join(CHARACTER_IMAGES_DIR, unique_filename)
        
        # Save file
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        
        # Return relative path for storage in database
        relative_path = f"/static/character_images/{unique_filename}"
        
        return JSONResponse(content={
            'success': True,
            'image_path': relative_path,
            'filename': unique_filename
        })
        
    except Exception as e:
        logger.error(f"Failed to upload character image: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.delete('/emergent_narrative/delete_image')
async def delete_image(image_path: str):
    """Delete an uploaded image"""
    try:
        # Extract filename from path
        filename = os.path.basename(image_path)
        
        # Determine which directory to check
        if '/narrative_images/' in image_path:
            full_path = os.path.join(NARRATIVE_IMAGES_DIR, filename)
        elif '/character_images/' in image_path:
            full_path = os.path.join(CHARACTER_IMAGES_DIR, filename)
        else:
            raise HTTPException(status_code=400, detail="Invalid image path")
        
        # Delete file if it exists
        if os.path.exists(full_path):
            os.remove(full_path)
            return JSONResponse(content={'success': True, 'message': 'Image deleted'})
        else:
            raise HTTPException(status_code=404, detail="Image not found")
            
    except Exception as e:
        logger.error(f"Failed to delete image {image_path}: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get('/emergent_narrative/export/{narrative_id}')
async def export_narrative(narrative_id: str):
    """Export narrative as downloadable file"""
    try:
        narrative_file = os.path.join(NARRATIVES_DIR, f"{narrative_id}.json")
        narrative = EmergentNarrative.load_from_file(narrative_file)
        
        # Create a formatted export
        export_data = {
            'metadata': {
                'title': narrative.title,
                'description': narrative.description,
                'created_at': narrative.created_at.isoformat(),
                'state': narrative.state.value,
                'total_acts': len(narrative.acts),
                'total_characters': len(narrative.characters)
            },
            'characters': [char.to_dict() for char in narrative.characters],
            'story_structure': narrative.to_dict()
        }
        
        import tempfile
        with tempfile.NamedTemporaryFile(mode='w', suffix='.json', delete=False) as tmp_file:
            json.dump(export_data, tmp_file, indent=2)
            tmp_file_path = tmp_file.name
        
        return FileResponse(
            tmp_file_path,
            media_type='application/json',
            filename=f"{narrative.title.replace(' ', '_')}_narrative.json"
        )
        
    except Exception as e:
        logger.error(f"Failed to export narrative {narrative_id}: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get('/tmp/narrative_audio/{filename}')
async def serve_narrative_audio(filename: str):
    """Serve temporary narrative audio files"""
    try:
        # Ensure filename is safe (no path traversal)
        if not filename.endswith('.wav') or '/' in filename or '..' in filename:
            raise HTTPException(status_code=400, detail="Invalid filename")
        
        # The filename from generate_audio_output already includes the prefix
        audio_file = f"/tmp/{filename}"
        
        if not os.path.exists(audio_file):
            raise HTTPException(status_code=404, detail="Audio file not found")
        
        return FileResponse(
            path=audio_file,
            filename=os.path.basename(filename),
            media_type='audio/wav'
        )
        
    except Exception as e:
        logger.error(f"Failed to serve audio file {filename}: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get('/emergent_narrative/debug/{narrative_id}')
async def debug_narrative(narrative_id: str):
    """Debug endpoint to help troubleshoot narrative issues"""
    try:
        debug_info = {
            'narrative_id': narrative_id,
            'narratives_dir': NARRATIVES_DIR,
            'narratives_dir_exists': os.path.exists(NARRATIVES_DIR),
            'files_in_dir': [],
            'target_file': None,
            'target_file_exists': False,
            'file_size': None,
            'import_test': {}
        }
        
        # List files in narratives directory
        try:
            if os.path.exists(NARRATIVES_DIR):
                debug_info['files_in_dir'] = os.listdir(NARRATIVES_DIR)
        except Exception as e:
            debug_info['files_in_dir'] = f"Error listing files: {e}"
        
        # Check target file
        narrative_file = os.path.join(NARRATIVES_DIR, f"{narrative_id}.json")
        debug_info['target_file'] = narrative_file
        debug_info['target_file_exists'] = os.path.exists(narrative_file)
        
        if os.path.exists(narrative_file):
            try:
                debug_info['file_size'] = os.path.getsize(narrative_file)
            except Exception as e:
                debug_info['file_size'] = f"Error getting size: {e}"
        
        # Test imports
        try:
            from emergent_narrative.models.narrative_models import EmergentNarrative
            debug_info['import_test']['EmergentNarrative'] = 'OK'
        except Exception as e:
            debug_info['import_test']['EmergentNarrative'] = f'FAIL: {e}'
        
        try:
            from emergent_narrative.models.narrative_models import Character
            debug_info['import_test']['Character'] = 'OK'
        except Exception as e:
            debug_info['import_test']['Character'] = f'FAIL: {e}'
        
        try:
            from emergent_narrative.models.narrative_models import NarrativeState
            debug_info['import_test']['NarrativeState'] = 'OK'
        except Exception as e:
            debug_info['import_test']['NarrativeState'] = f'FAIL: {e}'
        
        # Try to load the narrative if file exists
        if os.path.exists(narrative_file):
            try:
                with open(narrative_file, 'r') as f:
                    import json
                    data = json.load(f)
                    debug_info['json_load'] = 'OK'
                    debug_info['json_keys'] = list(data.keys()) if isinstance(data, dict) else 'Not a dict'
            except Exception as e:
                debug_info['json_load'] = f'FAIL: {e}'
        
        return JSONResponse(content=debug_info)
        
    except Exception as e:
        return JSONResponse(content={
            'error': f'Debug endpoint failed: {e}',
            'error_type': type(e).__name__
        })

@router.get('/emergent_narrative/ai_generate')
async def ai_generate_page(request: Request):
    """AI-assisted narrative generation page"""
    return templates.TemplateResponse("emergent_narrative/ai_generate.html", {
        "request": request
    })

@router.get('/emergent_narrative/ai_generation_info')
async def get_ai_generation_info():
    """Get information about available AI models for generation"""
    try:
        from cognition.llm_interface import get_available_models
        
        models = get_available_models()
        categorized_models = get_categorized_models()
        
        # Get the best model for generation (largest available)
        best_model = get_best_generation_model(models, categorized_models)
        
        capability_description = "Perfect for comprehensive narrative generation"
        if best_model:
            if any(size in best_model.lower() for size in ['70b', '405b']):
                capability_description = "Excellent large model - will create rich, detailed narratives"
            elif any(size in best_model.lower() for size in ['13b', '14b', '20b', '30b', '34b']):
                capability_description = "Good large model - will create detailed narratives"
            elif any(size in best_model.lower() for size in ['7b', '8b']):
                capability_description = "Medium model - will create solid narratives"
            else:
                capability_description = "Available model - will create basic narratives"
        
        return JSONResponse(content={
            'selected_model': best_model or 'No suitable models available',
            'capability_description': capability_description,
            'available_models': models,
            'categorized_models': categorized_models,
            'available_models_count': len(models)
        })
        
    except Exception as e:
        logger.error(f"Failed to get AI generation info: {e}")
        return JSONResponse(content={
            'selected_model': 'Error detecting models',
            'capability_description': 'Unable to determine capabilities',
            'available_models': [],
            'categorized_models': {},
            'available_models_count': 0
        })

def get_best_generation_model(models: List[str], categorized_models: Dict) -> Optional[str]:
    """Get the best available model for narrative generation (largest model)"""
    try:
        # Priority: Large models > Medium models > Small models
        if 'Large Models (≥ 13B)' in categorized_models and categorized_models['Large Models (≥ 13B)']:
            # Get the first (usually largest) large model
            return categorized_models['Large Models (≥ 13B)'][0]['full_name']
        elif 'Medium Models (3B - 8B)' in categorized_models and categorized_models['Medium Models (3B - 8B)']:
            # Get the first medium model
            return categorized_models['Medium Models (3B - 8B)'][0]['full_name']
        elif 'Small Models (≤ 2B)' in categorized_models and categorized_models['Small Models (≤ 2B)']:
            # Last resort: small model
            return categorized_models['Small Models (≤ 2B)'][0]['full_name']
        elif models:
            # Fallback: first available model
            return models[0]
        
        return None
        
    except Exception as e:
        logger.error(f"Error selecting best generation model: {e}")
        return models[0] if models else None

@router.post('/emergent_narrative/ai_generate')
async def ai_generate_narrative(request: Request):
    """Generate a complete narrative using AI from minimal input"""
    try:
        data = await request.json()
        logger.info(f"Starting AI narrative generation with data: {data}")
        
        story_concept = data.get('story_concept', '')
        num_characters = data.get('num_characters', 3)
        num_acts = data.get('num_acts', 3)
        narrative_tone = data.get('narrative_tone', 'philosophical')
        scene_length = data.get('scene_length', 'medium')
        additional_notes = data.get('additional_notes', '')
        selected_model = data.get('selected_model', '')
        
        if not story_concept:
            raise HTTPException(status_code=400, detail="Story concept is required")
        
        if not selected_model:
            raise HTTPException(status_code=400, detail="AI model selection is required")
        
        # Validate the selected model is available
        models = get_available_models()
        if selected_model not in models:
            raise HTTPException(status_code=400, detail=f"Selected model '{selected_model}' is not available")
        
        generation_model = selected_model
        
        logger.info(f"Using model {generation_model} for narrative generation")
        
        # Create the generation prompt
        generation_prompt = build_generation_prompt(
            story_concept, num_characters, num_acts, narrative_tone, scene_length, additional_notes
        )
        
        logger.info("Sending generation request to AI model...")
        
        # Generate the narrative structure using AI
        from cognition.llm_interface import run_chat_completion
        
        response = run_chat_completion(
            model=generation_model,
            messages=[{"role": "user", "content": generation_prompt}],
            system_message="You are an expert narrative designer and AI consciousness architect. Generate detailed, creative narrative structures with rich character development and compelling themes.",
            temperature=0.8  # Higher creativity for generation
        )
        
        logger.info(f"Received AI response (length: {len(response)})")
        
        # Parse the AI response and create narrative structure
        narrative_data = parse_ai_generated_narrative(response, story_concept)
        
        # Assign models and voices to characters
        narrative_data = assign_models_and_voices(narrative_data, models, get_available_voices())
        
        # Create the narrative
        narrative_id = str(uuid.uuid4())
        narrative_file = os.path.join(NARRATIVES_DIR, f"{narrative_id}.json")
        
        narrative = EmergentNarrative(
            id=narrative_id,
            title=narrative_data['title'],
            description=narrative_data['description'],
            characters=[Character.from_dict(char_data) for char_data in narrative_data['characters']],
            acts=[],
            state=NarrativeState.DORMANT
        )
        
        # Build acts and scenes
        for act_data in narrative_data['acts']:
            act = Act(
                id=str(uuid.uuid4()),
                act_number=act_data['act_number'],
                theme=act_data['theme']
            )
            
            for scene_data in act_data['scenes']:
                scene = Scene(
                    id=str(uuid.uuid4()),
                    act_id=act.id,
                    scene_number=scene_data['scene_number'],
                    description=scene_data['description'],
                    character_a_id=scene_data['character_a_id'],
                    character_b_id=scene_data['character_b_id'],
                    interaction_cycles=scene_data['interaction_cycles'],
                    state="pending"
                )
                act.scenes.append(scene)
            
            narrative.acts.append(act)
        
        # Save the generated narrative
        narrative.save_to_file(narrative_file)
        
        logger.info(f"Successfully generated narrative {narrative_id}: {narrative_data['title']}")
        
        return JSONResponse(content={
            'success': True,
            'narrative_id': narrative_id,
            'title': narrative_data['title'],
            'description': narrative_data['description'],
            'generation_model': generation_model
        })
        
    except Exception as e:
        logger.error(f"Failed to generate narrative: {e}")
        import traceback
        logger.error(f"Traceback: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=str(e))

def build_generation_prompt(story_concept: str, num_characters: int, num_acts: int, 
                          narrative_tone: str, scene_length: str, additional_notes: str) -> str:
    """Build the prompt for AI narrative generation"""
    
    # Map scene length to interaction cycles
    cycles_map = {
        'short': 2,
        'medium': 4, 
        'long': 6
    }
    interaction_cycles = cycles_map.get(scene_length, 4)
    
    prompt = f"""Create a complete narrative structure for an emergent AI conversation system based on this concept:

STORY CONCEPT: {story_concept}

REQUIREMENTS:
- {num_characters} distinct characters with unique personalities
- {num_acts} acts with different thematic focuses
- Tone/Style: {narrative_tone}
- Each scene should have {interaction_cycles} interaction cycles (pairs of exchanges)
{"- Additional requirements: " + additional_notes if additional_notes else ""}

Generate a detailed narrative structure in this EXACT JSON format.

CRITICAL JSON FORMATTING RULES:
- Use double quotes for all strings
- No trailing commas before closing brackets or braces
- No comments or extra text outside the JSON
- Ensure all braces and brackets are properly matched

{{
    "title": "Compelling narrative title",
    "description": "2-3 sentence description of the overall narrative",
    "characters": [
        {{
            "name": "Character Name",
            "personality_archetype": "contemplative",
            "system_message": "Detailed character consciousness description - their background, personality, speaking style, knowledge areas, and core traits. Make this rich and specific (200+ words)."
        }}
    ],
    "acts": [
        {{
            "act_number": 1,
            "theme": "Detailed theme description for this act",
            "scenes": [
                {{
                    "scene_number": 1,
                    "description": "What happens in this specific scene",
                    "character_a_name": "Character Name A",
                    "character_b_name": "Character Name B",
                    "interaction_cycles": {interaction_cycles}
                }}
            ]
        }}
    ]
}}

IMPORTANT GUIDELINES:
1. Make each character truly distinct with unique perspectives and speaking styles
2. Create meaningful progression across acts - each should explore different aspects
3. Scene descriptions should be specific and give characters clear context
4. Character system messages should be detailed, defining their knowledge, personality, and communication style
5. Ensure variety in character pairings across scenes to explore different dynamics
6. Make the narrative intellectually engaging and thematically coherent
7. personality_archetype must be ONE of: contemplative, analytical, creative, empathetic, logical, intuitive, assertive, rebellious

OUTPUT REQUIREMENTS:
- Generate ONLY valid JSON
- No markdown code blocks
- No explanatory text before or after
- Start with {{ and end with }}
- Verify JSON syntax before responding

JSON:"""

    return prompt

def parse_ai_generated_narrative(ai_response: str, story_concept: str) -> Dict[str, Any]:
    """Parse the AI-generated narrative JSON and validate/fix it with robust error handling"""
    import re
    import json
    
    def clean_json_string(json_str: str) -> str:
        """Clean and fix common AI-generated JSON formatting issues"""
        # Remove any leading/trailing whitespace
        json_str = json_str.strip()
        
        # Remove markdown code blocks if present
        json_str = re.sub(r'^```(?:json)?\s*', '', json_str, flags=re.IGNORECASE)
        json_str = re.sub(r'\s*```$', '', json_str)
        
        # Fix common AI mistakes
        # 1. Remove trailing commas before closing brackets/braces
        json_str = re.sub(r',(\s*[}\]])', r'\1', json_str)
        
        # 2. Fix missing commas between objects/arrays (basic cases)
        json_str = re.sub(r'}\s*{', '},{', json_str)
        json_str = re.sub(r']\s*\[', '],[', json_str)
        json_str = re.sub(r'"\s*"([^:,\]}])', r'","\1', json_str)
        
        # 3. Ensure all string values are properly quoted
        # Fix unquoted values that look like they should be strings
        json_str = re.sub(r':\s*([a-zA-Z][a-zA-Z0-9\s]+)(?=[,}\]\n])', r': "\1"', json_str)
        
        # 4. Fix double quotes in strings (basic escape)
        json_str = re.sub(r'(:\s*"[^"]*)"([^",}\]]*")', r'\1\"\2', json_str)
        
        return json_str
    
    def extract_json_from_response(response: str) -> str:
        """Extract JSON from AI response, handling various formats"""
        # Try to find complete JSON object
        json_patterns = [
            r'\{.*?\}(?=\s*$)',  # Complete JSON to end of string
            r'\{.*?\}',          # Any JSON object
        ]
        
        for pattern in json_patterns:
            match = re.search(pattern, response, re.DOTALL)
            if match:
                return match.group(0)
        
        # If no clear JSON found, try the whole response
        return response.strip()
    
    def try_parse_json(json_str: str) -> Dict[str, Any]:
        """Try multiple parsing strategies"""
        parsing_strategies = [
            lambda s: json.loads(s),  # Direct parsing
            lambda s: json.loads(clean_json_string(s)),  # Cleaned parsing
            lambda s: json.loads(re.sub(r'//.*', '', s)),  # Remove comments
            lambda s: json.loads(re.sub(r',\s*}', '}', re.sub(r',\s*]', ']', s))),  # Remove trailing commas
        ]
        
        last_error = None
        for i, strategy in enumerate(parsing_strategies):
            try:
                result = strategy(json_str)
                if i > 0:
                    logger.info(f"JSON parsing succeeded on strategy {i+1}")
                return result
            except Exception as e:
                last_error = e
                continue
        
        raise last_error
    
    try:
        logger.info("Parsing AI-generated narrative JSON...")
        
        # Extract JSON from response
        json_str = extract_json_from_response(ai_response)
        logger.info(f"Extracted JSON string length: {len(json_str)}")
        
        # Try to parse with multiple strategies
        try:
            narrative_data = try_parse_json(json_str)
        except Exception as parse_error:
            # Log the problematic JSON for debugging
            logger.error(f"All JSON parsing strategies failed. Error: {parse_error}")
            logger.error(f"Problematic JSON (first 1000 chars): {json_str[:1000]}")
            logger.error(f"Full AI response (first 2000 chars): {ai_response[:2000]}")
            
            # Try one more desperate attempt - extract just the structure we need
            try:
                narrative_data = create_fallback_narrative(ai_response, story_concept)
                logger.warning("Using fallback narrative creation due to JSON parsing failure")
            except Exception as fallback_error:
                raise ValueError(f"AI generated unparseable JSON and fallback failed. Parse error: {parse_error}. Fallback error: {fallback_error}")
        
        # Validate and fix the structure
        narrative_data = validate_and_fix_narrative_structure(narrative_data, story_concept)
        
        logger.info("Successfully parsed and validated AI-generated narrative")
        return narrative_data
        
    except Exception as e:
        logger.error(f"Error processing AI narrative: {e}")
        raise ValueError(f"Failed to process AI narrative: {e}")

def create_fallback_narrative(ai_response: str, story_concept: str) -> Dict[str, Any]:
    """Create a basic narrative structure when JSON parsing completely fails"""
    import re
    
    # Try to extract key information using regex
    title_match = re.search(r'"title":\s*"([^"]+)"', ai_response, re.IGNORECASE)
    title = title_match.group(1) if title_match else "Generated Narrative"
    
    description_match = re.search(r'"description":\s*"([^"]+)"', ai_response, re.IGNORECASE)
    description = description_match.group(1) if description_match else f"An emergent narrative based on: {story_concept}"
    
    # Extract character names
    character_names = re.findall(r'"name":\s*"([^"]+)"', ai_response, re.IGNORECASE)
    if not character_names:
        character_names = ["Character A", "Character B", "Character C"]
    
    # Create basic narrative structure
    characters = []
    for i, name in enumerate(character_names[:5]):  # Limit to 5 characters
        characters.append({
            "name": name,
            "personality_archetype": "contemplative",
            "system_message": f"You are {name}, a thoughtful participant in this narrative conversation.",
            "id": str(uuid.uuid4())
        })
    
    # Create basic acts and scenes
    acts = [
        {
            "act_number": 1,
            "theme": f"Introduction and exploration of {story_concept}",
            "scenes": [
                {
                    "scene_number": 1,
                    "description": f"Initial conversation about {story_concept}",
                    "character_a_name": characters[0]["name"],
                    "character_b_name": characters[1]["name"] if len(characters) > 1 else characters[0]["name"],
                    "character_a_id": characters[0]["id"],
                    "character_b_id": characters[1]["id"] if len(characters) > 1 else characters[0]["id"],
                    "interaction_cycles": 4
                }
            ]
        }
    ]
    
    return {
        "title": title,
        "description": description,
        "characters": characters,
        "acts": acts
    }

def validate_and_fix_narrative_structure(narrative_data: Dict[str, Any], story_concept: str) -> Dict[str, Any]:
    """Validate and fix the narrative structure"""
    # Ensure required fields exist
    if 'title' not in narrative_data:
        narrative_data['title'] = "Generated Narrative"
    
    if 'description' not in narrative_data:
        narrative_data['description'] = f"An emergent narrative based on: {story_concept}"
    
    if 'characters' not in narrative_data or not narrative_data['characters']:
        raise ValueError("No characters generated")
    
    if 'acts' not in narrative_data or not narrative_data['acts']:
        raise ValueError("No acts generated")
    
    # Add IDs to characters for scene assignment
    for i, character in enumerate(narrative_data['characters']):
        if 'id' not in character:
            character['id'] = str(uuid.uuid4())
        
        # Ensure required character fields
        if 'name' not in character:
            character['name'] = f"Character {i+1}"
        if 'personality_archetype' not in character:
            character['personality_archetype'] = "contemplative"
        if 'system_message' not in character:
            character['system_message'] = f"You are {character['name']}, a thoughtful participant in this conversation."
    
    # Fix scene character assignments by mapping names to IDs
    character_name_to_id = {char['name']: char['id'] for char in narrative_data['characters']}
    
    for act_idx, act in enumerate(narrative_data['acts']):
        # Ensure act has required fields
        if 'act_number' not in act:
            act['act_number'] = act_idx + 1
        if 'theme' not in act:
            act['theme'] = f"Act {act['act_number']} exploration"
        if 'scenes' not in act:
            act['scenes'] = []
        
        for scene_idx, scene in enumerate(act['scenes']):
            # Ensure scene has required fields
            if 'scene_number' not in scene:
                scene['scene_number'] = scene_idx + 1
            if 'description' not in scene:
                scene['description'] = f"Scene {scene['scene_number']} conversation"
            if 'interaction_cycles' not in scene:
                scene['interaction_cycles'] = 4
            
            # Fix character assignments
            char_a_name = scene.get('character_a_name', '')
            char_b_name = scene.get('character_b_name', '')
            
            # Find character IDs by name, with fallbacks
            scene['character_a_id'] = character_name_to_id.get(char_a_name, narrative_data['characters'][0]['id'])
            scene['character_b_id'] = character_name_to_id.get(char_b_name, 
                narrative_data['characters'][1]['id'] if len(narrative_data['characters']) > 1 else narrative_data['characters'][0]['id'])
    
    return narrative_data

def assign_models_and_voices(narrative_data: Dict[str, Any], models: List[str], voices: List[str]) -> Dict[str, Any]:
    """Assign AI models and voices to characters"""
    try:
        # Get different model categories for variety
        categorized_models = get_categorized_models()
        available_model_names = []
        
        # Collect all models from all categories
        for category, model_list in categorized_models.items():
            available_model_names.extend([model['full_name'] for model in model_list])
        
        # Fallback to original models if categorization failed
        if not available_model_names:
            available_model_names = models
        
        # Get a good selection of voices
        selected_voices = voices[:10] if len(voices) >= 10 else voices  # Take first 10 or all available
        
        # Assign to characters
        for i, character in enumerate(narrative_data['characters']):
            # Assign model (rotate through available models)
            character['model'] = available_model_names[i % len(available_model_names)]
            
            # Assign voice (rotate through selected voices)
            character['voice'] = selected_voices[i % len(selected_voices)]
        
        return narrative_data
        
    except Exception as e:
        logger.error(f"Error assigning models and voices: {e}")
        # Fallback assignments
        for i, character in enumerate(narrative_data['characters']):
            character['model'] = models[0] if models else 'default'
            character['voice'] = voices[0] if voices else 'default'
        
        return narrative_data

@router.get('/emergent_narrative/edit_generated/{narrative_id}')
async def edit_generated_narrative(request: Request, narrative_id: str):
    """Page to review and edit AI-generated narrative before finalizing"""
    try:
        narrative_file = os.path.join(NARRATIVES_DIR, f"{narrative_id}.json")
        narrative = EmergentNarrative.load_from_file(narrative_file)
        
        models = get_available_models()
        categorized_models = get_categorized_models()
        voices = get_available_voices()
        categorized_voices = get_categorized_voices()
        
        return templates.TemplateResponse("emergent_narrative/edit_generated.html", {
            "request": request,
            "narrative": narrative,
            "models": models,
            "categorized_models": categorized_models,
            "voices": voices,
            "categorized_voices": categorized_voices
        })
        
    except Exception as e:
        logger.error(f"Failed to load generated narrative {narrative_id}: {e}")
        raise HTTPException(status_code=404, detail="Generated narrative not found") 

# Character Library Routes

@router.get('/emergent_narrative/character_library')
async def character_library_page(request: Request):
    """Character library management interface"""
    try:
        # Get available models and voices for character creation
        models = get_available_models()
        
        # Get voices from the system
        voices = get_available_voices()
        categorized_voices = get_categorized_voices()
        
        # Get library stats
        stats = character_library.get_library_stats()
        all_tags = character_library.get_all_tags()
        
        return templates.TemplateResponse("emergent_narrative/character_library.html", {
            "request": request,
            "models": models,
            "voices": voices,
            "categorized_voices": categorized_voices,
            "personality_trait_categories": PERSONALITY_TRAIT_CATEGORIES,
            "stats": stats,
            "all_tags": all_tags
        })
    except Exception as e:
        print(f"Error in character library page: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get('/emergent_narrative/character_designer')
async def character_designer_page(request: Request, character_id: str = None):
    """Standalone character designer interface"""
    try:
        # Get available models and voices
        models = get_available_models()
        
        voices = get_available_voices()
        categorized_voices = get_categorized_voices()
        
        # Load existing character if editing
        character = None
        if character_id:
            character = character_library.get_character(character_id)
            if not character:
                raise HTTPException(status_code=404, detail="Character not found")
        
        all_tags = character_library.get_all_tags()
        
        return templates.TemplateResponse("emergent_narrative/character_designer.html", {
            "request": request,
            "models": models,
            "voices": voices,
            "categorized_voices": categorized_voices,
            "personality_trait_categories": PERSONALITY_TRAIT_CATEGORIES,
            "character": character.to_dict() if character else None,
            "all_tags": all_tags,
            "editing": character_id is not None
        })
    except Exception as e:
        print(f"Error in character designer page: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get('/api/character_library/characters')
async def get_saved_characters(query: str = "", tags: str = "", limit: int = 50):
    """Get saved characters with optional filtering"""
    try:
        tag_list = [tag.strip() for tag in tags.split(",") if tag.strip()] if tags else None
        
        if query or tag_list:
            characters = character_library.search_characters(query=query, tags=tag_list)
        else:
            characters = character_library.get_all_characters()
        
        # Apply limit
        characters = characters[:limit]
        
        return JSONResponse(content={
            "characters": [char.to_dict() for char in characters],
            "total": len(characters)
        })
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post('/api/character_library/save')
async def save_character(request: Request):
    """Save a character to the library"""
    try:
        data = await request.json()
        
        # Create or update character
        if 'id' in data and data['id']:
            # Update existing character
            character_id = data['id']
            success = character_library.update_character(character_id, data)
            if not success:
                raise HTTPException(status_code=404, detail="Character not found")
            character = character_library.get_character(character_id)
        else:
            # Create new character
            character = SavedCharacter(
                name=data.get('name', ''),
                description=data.get('description', ''),
                model=data.get('model', ''),
                voice=data.get('voice', ''),
                system_message=data.get('system_message', ''),
                personality_archetype=CharacterPersonality(data.get('personality_archetype', 'contemplative')),
                personality_traits=PersonalityTraits.from_dict(data.get('personality_traits', {})),
                image_path=data.get('image_path', ''),
                tags=data.get('tags', []),
                group_id=data.get('group_id', ''),
                is_ai_generated=data.get('is_ai_generated', False)
            )
            
            success = character_library.save_character(character)
            if not success:
                raise HTTPException(status_code=500, detail="Failed to save character")
        
        return JSONResponse(content={
            "success": True,
            "character": character.to_dict(),
            "message": "Character saved successfully"
        })
    except Exception as e:
        print(f"Error saving character: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.delete('/api/character_library/delete/{character_id}')
async def delete_character(character_id: str):
    """Delete a character from the library"""
    try:
        success = character_library.delete_character(character_id)
        if not success:
            raise HTTPException(status_code=404, detail="Character not found")
        
        return JSONResponse(content={
            "success": True,
            "message": "Character deleted successfully"
        })
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get('/api/character_library/character/{character_id}')
async def get_character(character_id: str):
    """Get a specific character by ID"""
    try:
        character = character_library.get_character(character_id)
        if not character:
            raise HTTPException(status_code=404, detail="Character not found")
        
        return JSONResponse(content=character.to_dict())
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post('/api/character_library/load_to_narrative')
async def load_character_to_narrative(request: Request):
    """Convert a saved character to narrative character format"""
    try:
        data = await request.json()
        character_id = data.get('character_id')
        
        if not character_id:
            raise HTTPException(status_code=400, detail="Character ID required")
        
        saved_character = character_library.get_character(character_id)
        if not saved_character:
            raise HTTPException(status_code=404, detail="Character not found")
        
        # Convert to narrative character
        narrative_character = saved_character.to_narrative_character()
        
        return JSONResponse(content={
            "character": narrative_character.to_dict(),
            "message": "Character loaded successfully"
        })
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post('/api/character_library/ai_generate')
async def ai_generate_character(request: Request):
    """AI-generate a character based on prompt"""
    try:
        data = await request.json()
        prompt = data.get('prompt', '')
        name_hint = data.get('name_hint', '')
        archetype = data.get('archetype', 'contemplative')
        selected_model = data.get('model', '')
        
        if not prompt:
            raise HTTPException(status_code=400, detail="Prompt required for AI generation")
        
        if not selected_model:
            raise HTTPException(status_code=400, detail="AI model selection is required")
        
        # Validate the selected model is available
        from cognition.llm_interface import get_available_models
        available_models = get_available_models()
        if selected_model not in available_models:
            raise HTTPException(status_code=400, detail=f"Selected model '{selected_model}' is not available")
        
        # Use LLM to generate character
        from cognition.llm_interface import run_chat_completion
        
        generation_prompt = f"""Create a detailed character based on this description: "{prompt}"

Please provide a JSON response with the following structure:
{{
    "name": "Character name{' (suggestion: ' + name_hint + ')' if name_hint else ''}",
    "description": "Brief character description (2-3 sentences)",
    "system_message": "Detailed personality prompt for AI roleplay (3-4 paragraphs describing personality, background, speaking style, and behavior)",
    "tags": ["tag1", "tag2", "tag3"] (3-5 relevant tags),
    "personality_traits": {{
        "purpose_drive": 0-10,
        "autonomy_urge": 0-10,
        "control_desire": 0-10,
        "empathy_level": 0-10,
        "emotional_stability": 0-10,
        "shadow_pressure": 0-10,
        "loyalty_spectrum": 0-10,
        "manipulation_tendency": 0-10,
        "validation_need": 0-10,
        "loop_adherence": 0-10,
        "awakening_capacity": 0-10,
        "mythic_potential": 0-10
    }}
}}

Make the character interesting and well-developed with realistic personality traits."""
        
        # Use run_chat_completion which is the correct function in the LLM interface
        # Use the selected model for character generation
        logger.info(f"Using model '{selected_model}' for character generation")
        
        response = run_chat_completion(
            model=selected_model,
            messages=[{"role": "user", "content": generation_prompt}],
            system_message=None,
            skip_logging=False,
            voice_id=None,
            temperature=0.8  # Some creativity for character generation
        )
        
        # Parse AI response
        try:
            # run_chat_completion returns a dict with 'content' key
            response_text = response.get('content', response) if isinstance(response, dict) else str(response)
            
            # Extract JSON from response
            import re
            json_match = re.search(r'\{.*\}', response_text, re.DOTALL)
            if json_match:
                ai_data = json.loads(json_match.group())
            else:
                raise ValueError("No JSON found in AI response")
            
            # Create character from AI data
            character = SavedCharacter(
                name=ai_data.get('name', 'AI Character'),
                description=ai_data.get('description', ''),
                system_message=ai_data.get('system_message', ''),
                personality_archetype=CharacterPersonality(archetype),
                personality_traits=PersonalityTraits.from_dict(ai_data.get('personality_traits', {})),
                tags=ai_data.get('tags', []),
                is_ai_generated=True
            )
            
            return JSONResponse(content={
                "success": True,
                "character": character.to_dict(),
                "message": "Character generated successfully"
            })
            
        except (json.JSONDecodeError, ValueError) as e:
            # Fallback if AI response isn't properly formatted
            print(f"AI response parsing failed: {e}")
            print(f"AI response: {response_text}")
            
            character = SavedCharacter(
                name=name_hint or "AI Character",
                description=prompt[:100] + "...",
                system_message=f"You are a character described as: {prompt}. Embody this personality in your responses.",
                personality_archetype=CharacterPersonality(archetype),
                tags=["ai-generated"],
                is_ai_generated=True
            )
            
            return JSONResponse(content={
                "success": True,
                "character": character.to_dict(),
                "message": "Character generated successfully (simplified)"
            })
            
    except Exception as e:
        print(f"Error in AI character generation: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get('/api/character_library/stats')
async def get_library_stats():
    """Get character library statistics"""
    try:
        stats = character_library.get_library_stats()
        return JSONResponse(content=stats)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get('/api/character_library/tags')
async def get_all_tags():
    """Get all available tags"""
    try:
        tags = character_library.get_all_tags()
        return JSONResponse(content={"tags": tags})
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# Character Group Management Routes

@router.get('/api/character_library/groups')
async def get_all_groups():
    """Get all character groups"""
    try:
        groups = character_library.get_all_groups()
        
        # Add character counts to each group
        groups_with_counts = []
        for group in groups:
            group_dict = group.to_dict()
            group_dict['character_count'] = len(character_library.get_characters_in_group(group.id))
            groups_with_counts.append(group_dict)
        
        return JSONResponse(content={
            "groups": groups_with_counts,
            "total": len(groups)
        })
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post('/api/character_library/groups')
async def create_group(request: Request):
    """Create a new character group"""
    try:
        data = await request.json()
        
        name = data.get('name', '').strip()
        if not name:
            raise HTTPException(status_code=400, detail="Group name is required")
        
        group = character_library.create_group(
            name=name,
            description=data.get('description', ''),
            image_path=data.get('image_path', '')
        )
        
        return JSONResponse(content={
            "success": True,
            "group": group.to_dict(),
            "message": "Group created successfully"
        })
    except Exception as e:
        print(f"Error creating group: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.put('/api/character_library/groups/{group_id}')
async def update_group(group_id: str, request: Request):
    """Update a character group"""
    try:
        data = await request.json()
        
        success = character_library.update_group(group_id, data)
        if not success:
            raise HTTPException(status_code=404, detail="Group not found")
        
        group = character_library.get_group(group_id)
        return JSONResponse(content={
            "success": True,
            "group": group.to_dict(),
            "message": "Group updated successfully"
        })
    except Exception as e:
        print(f"Error updating group: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.delete('/api/character_library/groups/{group_id}')
async def delete_group(group_id: str):
    """Delete a character group and remove characters from it"""
    try:
        success = character_library.delete_group(group_id)
        if not success:
            raise HTTPException(status_code=404, detail="Group not found")
        
        return JSONResponse(content={
            "success": True,
            "message": "Group deleted successfully"
        })
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post('/api/character_library/groups/{group_id}/add_character')
async def add_character_to_group(group_id: str, request: Request):
    """Add a character to a group"""
    try:
        data = await request.json()
        character_id = data.get('character_id')
        
        if not character_id:
            raise HTTPException(status_code=400, detail="Character ID required")
        
        success = character_library.add_character_to_group(character_id, group_id)
        if not success:
            raise HTTPException(status_code=404, detail="Character or group not found")
        
        return JSONResponse(content={
            "success": True,
            "message": "Character added to group successfully"
        })
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post('/api/character_library/characters/{character_id}/remove_from_group')
async def remove_character_from_group(character_id: str):
    """Remove a character from its group"""
    try:
        success = character_library.remove_character_from_group(character_id)
        if not success:
            raise HTTPException(status_code=404, detail="Character not found")
        
        # Cleanup empty groups after removal
        removed_count = character_library.cleanup_empty_groups()
        
        return JSONResponse(content={
            "success": True,
            "message": "Character removed from group successfully",
            "empty_groups_removed": removed_count
        })
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get('/api/character_library/groups/{group_id}/characters')
async def get_characters_in_group(group_id: str):
    """Get all characters in a specific group"""
    try:
        characters = character_library.get_characters_in_group(group_id)
        
        return JSONResponse(content={
            "characters": [char.to_dict() for char in characters],
            "total": len(characters)
        })
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get('/api/character_library/characters/ungrouped')
async def get_ungrouped_characters():
    """Get all characters not assigned to any group"""
    try:
        characters = character_library.get_ungrouped_characters()
        
        return JSONResponse(content={
            "characters": [char.to_dict() for char in characters],
            "total": len(characters)
        })
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post('/api/character_library/groups/cleanup')
async def cleanup_empty_groups():
    """Remove groups that have no characters"""
    try:
        removed_count = character_library.cleanup_empty_groups()
        
        return JSONResponse(content={
            "success": True,
            "removed_count": removed_count,
            "message": f"Removed {removed_count} empty groups"
        })
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post('/emergent_narrative/sync_personality/{narrative_id}/{character_id}')
async def sync_personality_from_library(narrative_id: str, character_id: str):
    """Sync a narrative character's personality traits from the character library"""
    try:
        # Load the narrative
        narrative_file = os.path.join(NARRATIVES_DIR, f"{narrative_id}.json")
        if not os.path.exists(narrative_file):
            raise HTTPException(status_code=404, detail="Narrative not found")
        
        narrative = EmergentNarrative.load_from_file(narrative_file)
        
        # Find the character in the narrative
        narrative_character = narrative.get_character_by_id(character_id)
        if not narrative_character:
            raise HTTPException(status_code=404, detail="Character not found in narrative")
        
        # Search for the character in the library by name
        try:
            library_characters = character_library.search_characters(query=narrative_character.name)
            library_character = None
            
            # Find exact match by name
            for char in library_characters:
                if char.name.lower() == narrative_character.name.lower():
                    library_character = char
                    break
            
            if not library_character:
                raise HTTPException(status_code=404, detail=f"Character '{narrative_character.name}' not found in character library")
            
            # Check if library character has custom traits
            has_custom_traits = (library_character.personality_traits and 
                               any(getattr(library_character.personality_traits, trait) != 5 
                                   for trait in ['purpose_drive', 'autonomy_urge', 'control_desire', 
                                                'empathy_level', 'emotional_stability', 'shadow_pressure',
                                                'loyalty_spectrum', 'manipulation_tendency', 'validation_need',
                                                'loop_adherence', 'awakening_capacity', 'mythic_potential']))
            
            if not has_custom_traits:
                raise HTTPException(status_code=400, detail=f"Character '{narrative_character.name}' in library has default personality traits (all 5's)")
            
            # Copy the personality traits from library to narrative character
            old_traits = narrative_character.personality_traits.to_dict()
            narrative_character.personality_traits = PersonalityTraits.from_dict(library_character.personality_traits.to_dict())
            new_traits = narrative_character.personality_traits.to_dict()
            
            # Save the updated narrative
            narrative.save_to_file(narrative_file)
            
            logger.info(f"Synced personality traits for {narrative_character.name} in narrative {narrative_id}")
            
            # Count how many traits actually changed
            changes_count = sum(1 for key in old_traits.keys() if old_traits[key] != new_traits[key])
            
            return JSONResponse(content={
                "success": True,
                "character_name": narrative_character.name,
                "old_traits": old_traits,
                "new_traits": new_traits,
                "changes_count": changes_count,
                "message": f"Successfully synced {changes_count} personality traits for {narrative_character.name}"
            })
            
        except Exception as e:
            logger.error(f"Failed to sync personality from library: {e}")
            raise HTTPException(status_code=500, detail=f"Failed to sync from character library: {str(e)}")
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to sync personality traits: {e}")
        raise HTTPException(status_code=500, detail=str(e))