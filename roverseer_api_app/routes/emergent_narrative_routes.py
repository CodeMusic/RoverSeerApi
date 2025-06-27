"""
Emergent Narrative Routes

FastAPI routes for managing multi-agent storytelling experiences.
"""

import os
import json
import asyncio
from datetime import datetime
from fastapi import APIRouter, Request, HTTPException
from fastapi.responses import JSONResponse, FileResponse, HTMLResponse
from fastapi.templating import Jinja2Templates
from typing import List, Dict, Any, Optional
import logging

# Import our models
import sys
sys.path.append(os.path.dirname(os.path.dirname(__file__)))
from emergent_narrative.models.narrative_models import (
    EmergentNarrative, Character, Act, Scene, InfluenceVector, 
    NarrativeState, CharacterPersonality
)

# Create router
router = APIRouter()
templates = Jinja2Templates(directory="templates")

# Configure logging
logger = logging.getLogger(__name__)

# Storage paths
NARRATIVES_DIR = os.path.join(os.path.dirname(__file__), '..', 'emergent_narrative', 'logs')
os.makedirs(NARRATIVES_DIR, exist_ok=True)

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
        from expression.text_to_speech import list_voice_ids
        return list_voice_ids()
    except Exception as e:
        logger.error(f"Failed to get voices: {e}")
        return []

def get_categorized_voices():
    """Get categorized voices for organized dropdowns"""
    try:
        from expression.text_to_speech import get_categorized_voices
        return get_categorized_voices()
    except Exception as e:
        logger.error(f"Failed to get categorized voices: {e}")
        return {"categorized": {}, "all": []}

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
            description=data['description']
        )
        
        # Create characters
        for char_data in data['characters']:
            character = Character(
                name=char_data['name'],
                model=char_data['model'],
                voice=char_data['voice'],
                system_message=char_data['system_message'],
                personality_archetype=CharacterPersonality(char_data.get('personality_archetype', 'contemplative'))
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
                        'created_at': narrative.created_at.isoformat(),
                        'state': narrative.state.value,
                        'characters': [{'name': char.name, 'id': char.id} for char in narrative.characters],
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
        
        # Get valid character IDs
        valid_character_ids = [char.id for char in narrative.characters]
        logger.info(f"Valid character IDs: {valid_character_ids}")
        
        repairs_made = 0
        
        # Check and repair character references in scenes
        for act in narrative.acts:
            for scene in act.scenes:
                logger.info(f"Checking scene {scene.scene_number} - chars: {scene.character_a_id}, {scene.character_b_id}")
                
                # If character_a_id is invalid, assign first character
                if scene.character_a_id not in valid_character_ids:
                    logger.warning(f"Invalid character_a_id: {scene.character_a_id}")
                    if len(valid_character_ids) > 0:
                        scene.character_a_id = valid_character_ids[0]
                        repairs_made += 1
                        logger.info(f"Repaired character_a_id to: {scene.character_a_id}")
                
                # If character_b_id is invalid, assign second character (or first if only one exists)
                if scene.character_b_id not in valid_character_ids:
                    logger.warning(f"Invalid character_b_id: {scene.character_b_id}")
                    if len(valid_character_ids) > 1:
                        scene.character_b_id = valid_character_ids[1]
                    elif len(valid_character_ids) > 0:
                        scene.character_b_id = valid_character_ids[0]
                    repairs_made += 1
                    logger.info(f"Repaired character_b_id to: {scene.character_b_id}")
        
        # Save repaired narrative
        narrative.save_to_file(narrative_file)
        logger.info(f"Repair completed - {repairs_made} fixes applied")
        
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
                
                # Get scene progress information
                total_interactions = len(current_scene.interactions)
                required_interactions = current_scene.interaction_cycles * 2
                completed_cycles = current_scene.completed_cycles  # Use stored value
                partial_cycle = total_interactions % 2
                
                logger.info(f"DEBUG STATUS: Scene {current_scene.id}, stored completed_cycles = {current_scene.completed_cycles}")
                logger.info(f"DEBUG STATUS: Total interactions = {total_interactions}, required = {required_interactions}")
                logger.info(f"DEBUG STATUS: Scene interaction_cycles setting = {current_scene.interaction_cycles}")
                
                # Create progress description
                if partial_cycle > 0:
                    progress_text = f"{completed_cycles}.5/{current_scene.interaction_cycles}"
                else:
                    progress_text = f"{completed_cycles}/{current_scene.interaction_cycles}"
                
                current_scene_info = {
                    'number': current_scene.scene_number,
                    'description': current_scene.description,
                    'completed_cycles': completed_cycles,
                    'total_cycles': current_scene.interaction_cycles,
                    'total_interactions': total_interactions,
                    'required_interactions': required_interactions,
                    'progress_text': progress_text,
                    'characters': [char_a.name if char_a else "Unknown", char_b.name if char_b else "Unknown"]
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
            'active_influences': active_influences
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
        
        # Get characters for this scene with better error reporting
        char_a = narrative.get_character_by_id(current_scene.character_a_id)
        char_b = narrative.get_character_by_id(current_scene.character_b_id)
        
        # More detailed character validation
        available_char_ids = [c.id for c in narrative.characters]
        logger.info(f"Available character IDs: {available_char_ids}")
        
        if not char_a:
            logger.error(f"Character A not found: {current_scene.character_a_id}")
            raise HTTPException(status_code=400, 
                detail=f"Character A not found: {current_scene.character_a_id}. Available: {available_char_ids}")
        
        if not char_b:
            logger.error(f"Character B not found: {current_scene.character_b_id}")
            raise HTTPException(status_code=400, 
                detail=f"Character B not found: {current_scene.character_b_id}. Available: {available_char_ids}")
        
        logger.info(f"Found characters: {char_a.name} and {char_b.name}")
        
        # Determine whose turn it is based on the number of interactions in the scene
        # Count interactions in current scene to determine turn
        interactions_count = len(current_scene.interactions)
        current_character = char_a if interactions_count % 2 == 0 else char_b
        other_character = char_b if current_character == char_a else char_a
        
        logger.info(f"Turn {interactions_count}: {current_character.name} speaks to {other_character.name}")
        
        # Build context for the current character
        context = build_character_context(narrative, current_scene, current_character, other_character)
        
        # Apply any active influences
        influence = narrative.get_active_influence_for_character(current_character.id)
        if influence:
            context += f"\n\nCurrent influence affecting you: '{influence.word_of_influence}' - let this subtly affect your response."
        
        # Call the AI model to generate response
        response_text = await generate_character_response(current_character, context)
        
        # Store the interaction
        current_scene.add_interaction(
            character_id=current_character.id,
            content=response_text,
            metadata={'turn': interactions_count, 'influence': influence.word_of_influence if influence else None}
        )
        
        # Update character memory
        current_character.memory.add_memory({
            'type': 'interaction',
            'scene_id': current_scene.id,
            'other_character': other_character.name,
            'content': response_text,
            'emotional_impact': 'neutral'  # Could be enhanced with sentiment analysis
        })
        
        # Process influence countdown
        if influence:
            influence.apply_to_cycle()
            if not influence.is_active():
                narrative.active_influences = [inf for inf in narrative.active_influences if inf.is_active()]
        
        # Completed cycles are now updated in add_interaction method
        new_interactions_count = len(current_scene.interactions)
        
        logger.info(f"Scene progress: {new_interactions_count} interactions = {current_scene.completed_cycles}/{current_scene.interaction_cycles} cycles")
        logger.info(f"DEBUG: Scene {current_scene.id}, completed_cycles field = {current_scene.completed_cycles}")
        logger.info(f"DEBUG: Interaction IDs in scene: {[i.get('id', 'no-id') for i in current_scene.interactions]}")
        logger.info(f"DEBUG: About to save narrative to {narrative_file}")
        
        # Check if scene/act is complete and advance if needed
        scene_completed = current_scene.is_completed()
        narrative_advanced = False
        
        logger.info(f"Scene completion check: {new_interactions_count} interactions, requires {current_scene.interaction_cycles * 2}, completed: {scene_completed}")
        
        if scene_completed:
            logger.info(f"Scene {current_scene.scene_number} completed! Advancing narrative...")
            narrative_advanced = narrative.advance_narrative()
            if narrative_advanced:
                logger.info(f"Advanced to next scene/act. New position: Act {narrative.current_act}, Scene {narrative.current_scene}")
        
        # Save narrative state
        narrative.save_to_file(narrative_file)
        
        # Handle audio output if requested
        audio_url = None
        if output_mode in ['rover_audio', 'local_audio']:
            audio_url = await generate_audio_output(response_text, current_character.voice, output_mode)
        
        return JSONResponse(content={
            'success': True,
            'character': current_character.name,
            'response': response_text,
            'scene_completed': scene_completed,
            'narrative_advanced': narrative_advanced,
            'narrative_completed': narrative.state.value == 'completed',
            'current_scene': current_scene.scene_number,
            'current_act': narrative.current_act + 1,
            'next_character': other_character.name if not scene_completed else None,
            'audio_url': audio_url,
            'output_mode': output_mode,
            'influence_applied': influence.word_of_influence if influence else None
        })
        
    except Exception as e:
        logger.error(f"Failed to advance narrative {narrative_id}: {e}")
        raise HTTPException(status_code=500, detail=str(e))

def build_character_context(narrative: EmergentNarrative, scene: Scene, character: Character, other_character: Character) -> str:
    """Build context for character's AI interaction"""
    current_act = narrative.get_current_act()
    
    context = f"""You are {character.name}. {character.system_message}

CURRENT SITUATION:
- You are in Act {current_act.act_number}: {current_act.theme}
- Scene {scene.scene_number}: {scene.description}
- You are interacting with {other_character.name}

YOUR MEMORY:
{character.memory.get_context_for_scene()}

RECENT SCENE INTERACTIONS:
"""
    
    # Add recent interactions from this scene
    recent_interactions = scene.interactions[-6:]  # Last 6 interactions
    for interaction in recent_interactions:
        char = narrative.get_character_by_id(interaction['character_id'])
        context += f"\n{char.name}: {interaction['content']}"
    
    context += f"\n\nRespond as {character.name}. Keep your response conversational and in-character. Do not exceed 3 sentences."
    
    return context

async def generate_character_response(character: Character, context: str) -> str:
    """Generate AI response for character"""
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

@router.delete('/emergent_narrative/delete/{narrative_id}')
async def delete_narrative(narrative_id: str):
    """Delete a narrative"""
    try:
        narrative_file = os.path.join(NARRATIVES_DIR, f"{narrative_id}.json")
        
        if os.path.exists(narrative_file):
            os.remove(narrative_file)
            logger.info(f"Deleted narrative {narrative_id}")
            return JSONResponse(content={'success': True, 'message': 'Narrative deleted'})
        else:
            raise HTTPException(status_code=404, detail="Narrative not found")
            
    except Exception as e:
        logger.error(f"Failed to delete narrative {narrative_id}: {e}")
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