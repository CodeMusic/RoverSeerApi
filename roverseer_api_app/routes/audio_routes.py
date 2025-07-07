"""
Audio Routes - Enhanced with Network Service Discovery (FastAPI)
TTS and STT endpoints with intelligent satellite node routing
"""

from fastapi import APIRouter, Request, File, UploadFile, Form, HTTPException
from fastapi.responses import JSONResponse, StreamingResponse, FileResponse
from typing import Optional, Dict, Any
import tempfile
import os
import io
from datetime import datetime
import logging

from ..helpers.silicon_gateway import (
    get_silicon_gateway,
    quick_tts,
    quick_stt
)

# Create FastAPI router
router = APIRouter()
logger = logging.getLogger(__name__)

# Get the enhanced silicon gateway
gateway = get_silicon_gateway()


@router.post('/tts')
async def text_to_speech(request: Request):
    """
    Enhanced TTS endpoint with satellite node discovery
    Automatically routes to best available service (MLX-accelerated → fallback)
    """
    try:
        # Get request data
        try:
            data = await request.json()
        except:
            raise HTTPException(status_code=400, detail="Invalid JSON body")
        
        text = data.get('text', '').strip()
        voice = data.get('voice', 'en_US-amy-medium')
        
        if not text:
            raise HTTPException(status_code=400, detail="Text is required")
        
        logger.info(f"🎙️ TTS Request: '{text[:50]}...' using voice '{voice}'")
        
        # Use enhanced gateway with satellite discovery
        success, audio_data, service_info = quick_tts(text, voice)
        
        if success and audio_data:
            logger.info(f"✅ TTS Success via {service_info.get('source')} "
                       f"({service_info.get('acceleration')}, "
                       f"{service_info.get('actual_response_time', 0):.0f}ms)")
            
            # Return audio data as streaming response
            audio_buffer = io.BytesIO(audio_data)
            
            headers = {
                'X-Service-Source': service_info.get('source', 'unknown'),
                'X-Service-Acceleration': service_info.get('acceleration', 'unknown'),
                'X-Response-Time': str(service_info.get('actual_response_time', 0)),
                'X-Node-Type': service_info.get('node_type', 'unknown')
            }
            
            return StreamingResponse(
                io.BytesIO(audio_data),
                media_type='audio/wav',
                headers=headers
            )
        
        else:
            error_msg = service_info.get('error', 'TTS generation failed')
            logger.error(f"❌ TTS Failed: {error_msg}")
            raise HTTPException(
                status_code=503,
                detail={
                    "error": error_msg,
                    "service_info": service_info
                }
            )
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ TTS Error: {e}")
        raise HTTPException(status_code=500, detail=f"TTS processing failed: {str(e)}")


@router.post('/v1/audio/transcriptions')
async def speech_to_text(file: UploadFile = File(...)):
    """
    Enhanced STT endpoint with satellite node discovery (OpenAI compatible)
    Automatically routes to best available service (MLX-accelerated → fallback)
    """
    try:
        if not file:
            raise HTTPException(status_code=400, detail="Audio file is required")
        
        # Read audio data
        audio_data = await file.read()
        
        if not audio_data:
            raise HTTPException(status_code=400, detail="Audio file is empty")
        
        logger.info(f"🎧 STT Request: {len(audio_data)} bytes")
        
        # Use enhanced gateway with satellite discovery
        success, result, service_info = quick_stt(audio_data)
        
        if success and result:
            # Extract transcribed text
            transcription = ""
            if isinstance(result, dict):
                transcription = result.get('text', result.get('transcription', ''))
            elif isinstance(result, str):
                transcription = result
            
            logger.info(f"✅ STT Success via {service_info.get('source')}: '{transcription[:50]}...'")
            
            # Return OpenAI-compatible format
            return JSONResponse(content={
                "text": transcription,
                "service_info": {
                    "source": service_info.get('source'),
                    "acceleration": service_info.get('acceleration'),
                    "response_time": service_info.get('actual_response_time'),
                    "node_type": service_info.get('node_type')
                }
            })
        
        else:
            error_msg = service_info.get('error', 'Speech recognition failed')
            logger.error(f"❌ STT Failed: {error_msg}")
            raise HTTPException(
                status_code=503,
                detail={
                    "error": error_msg,
                    "service_info": service_info
                }
            )
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ STT Error: {e}")
        raise HTTPException(status_code=500, detail=f"STT processing failed: {str(e)}")


@router.get('/audio/status')
async def get_audio_service_status():
    """
    Get comprehensive status of all audio services across satellite nodes
    Shows discovered nodes, capacities, and routing decisions
    """
    try:
        # Get comprehensive service status
        status = gateway.get_service_status()
        
        # Add audio-specific information
        audio_status = {
            "timestamp": datetime.now().isoformat(),
            "network_discovery": {
                "active": status.get("network_discovery_active", False),
                "total_nodes": status.get("total_nodes", 0),
                "healthy_nodes": status.get("healthy_nodes", 0),
                "local_domain": status.get("local_domain", "localhost")
            },
            "services": {
                "tts": {
                    "available_nodes": status.get("services", {}).get("tts", []),
                    "best_service": status.get("best_services", {}).get("tts", {}),
                    "total_capacity": len(status.get("services", {}).get("tts", []))
                },
                "stt": {
                    "available_nodes": status.get("services", {}).get("stt", []),
                    "best_service": status.get("best_services", {}).get("stt", {}),
                    "total_capacity": len(status.get("services", {}).get("stt", []))
                }
            },
            "performance": {
                "mlx_accelerated_nodes": len([
                    node for service_nodes in status.get("services", {}).values()
                    for node in service_nodes
                    if node.get("acceleration") == "mlx"
                ]),
                "fallback_available": True  # Always true since we have local fallbacks
            }
        }
        
        logger.info(f"📊 Audio Status: {audio_status['network_discovery']['healthy_nodes']} nodes, "
                   f"TTS: {audio_status['services']['tts']['total_capacity']} nodes, "
                   f"STT: {audio_status['services']['stt']['total_capacity']} nodes")
        
        return JSONResponse(content=audio_status)
        
    except Exception as e:
        logger.error(f"❌ Audio Status Error: {e}")
        raise HTTPException(status_code=500, detail=f"Status check failed: {str(e)}")


@router.post('/audio/discovery/refresh')
async def refresh_service_discovery():
    """
    Manually trigger a refresh of the AI service discovery
    Useful for finding new satellite nodes that came online
    """
    try:
        logger.info("🔄 Manual service discovery refresh requested")
        
        # Trigger refresh
        refresh_result = gateway.refresh_discovery()
        
        if "error" in refresh_result:
            raise HTTPException(
                status_code=500,
                detail={
                    "success": False,
                    "error": refresh_result["error"]
                }
            )
        
        # Get updated status
        status = gateway.get_service_status()
        
        response = {
            "success": True,
            "message": f"Discovery refresh complete",
            "discovered": {
                "total_nodes": status.get("total_nodes", 0),
                "healthy_nodes": status.get("healthy_nodes", 0),
                "tts_nodes": len(status.get("services", {}).get("tts", [])),
                "stt_nodes": len(status.get("services", {}).get("stt", []))
            },
            "timestamp": datetime.now().isoformat()
        }
        
        logger.info(f"✅ Discovery refresh: found {response['discovered']['healthy_nodes']} healthy nodes")
        return JSONResponse(content=response)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Discovery refresh error: {e}")
        raise HTTPException(
            status_code=500,
            detail={
                "success": False,
                "error": f"Discovery refresh failed: {str(e)}"
            }
        )


@router.get('/audio/nodes')
async def get_satellite_nodes():
    """
    Get detailed information about all discovered satellite nodes
    """
    try:
        # Get all nodes
        all_nodes = gateway.service_discovery.get_all_nodes()
        
        nodes_info = []
        for node in all_nodes:
            node_info = {
                "id": f"{node.hostname}:{node.port}",
                "hostname": node.hostname,
                "ip_address": node.ip_address,
                "port": node.port,
                "services": node.services,
                "capacity": node.capacity,
                "response_time": node.response_time,
                "node_type": node.node_type,
                "acceleration": node.acceleration,
                "load": node.load,
                "status": node.status,
                "last_seen": node.last_seen.isoformat(),
                "is_healthy": node.is_healthy,
                "overall_capacity": node.overall_capacity,
                "base_url": node.base_url
            }
            nodes_info.append(node_info)
        
        # Sort by overall capacity (best first)
        nodes_info.sort(key=lambda x: x["overall_capacity"], reverse=True)
        
        response = {
            "timestamp": datetime.now().isoformat(),
            "total_nodes": len(nodes_info),
            "healthy_nodes": len([n for n in nodes_info if n["is_healthy"]]),
            "nodes": nodes_info
        }
        
        return JSONResponse(content=response)
        
    except Exception as e:
        logger.error(f"❌ Get nodes error: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to get nodes: {str(e)}")


@router.post('/audio/test/{service_type}')
async def test_audio_service(service_type: str):
    """
    Test a specific audio service to verify satellite node connectivity
    """
    try:
        if service_type not in ['tts', 'stt']:
            raise HTTPException(status_code=400, detail="Invalid service type. Use 'tts' or 'stt'")
        
        if service_type == 'tts':
            # Test TTS with simple message
            test_text = "Testing satellite node connectivity for text to speech."
            success, result, service_info = quick_tts(test_text, "en_US-amy-medium")
            
            test_result = {
                "service": "tts",
                "success": success,
                "service_info": service_info,
                "audio_size": len(result) if result else 0,
                "test_text": test_text
            }
            
        elif service_type == 'stt':
            # For STT testing, we need audio data
            raise HTTPException(
                status_code=400,
                detail={
                    "error": "STT testing requires audio file upload",
                    "hint": "Use the regular /v1/audio/transcriptions endpoint with a test audio file"
                }
            )
        
        logger.info(f"🧪 Audio service test ({service_type}): "
                   f"{'✅ Success' if success else '❌ Failed'} via {service_info.get('source')}")
        
        if success:
            return JSONResponse(content=test_result)
        else:
            raise HTTPException(status_code=503, detail=test_result)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Audio service test error: {e}")
        raise HTTPException(status_code=500, detail=f"Test failed: {str(e)}")


@router.get('/voices')
async def list_voices():
    """
    List available TTS voices from all discovered satellite nodes
    """
    try:
        # Get all nodes that support TTS
        all_nodes = gateway.service_discovery.get_all_nodes()
        tts_nodes = [node for node in all_nodes if "tts" in node.services]
        
        voices_info = {
            "local_voices": [],  # Fallback voices
            "satellite_voices": {},  # Per-node voices
            "recommended_voice": "en_US-amy-medium",
            "total_nodes": len(tts_nodes),
            "nodes_status": []
        }
        
        # Add node status information
        for node in tts_nodes:
            node_status = {
                "hostname": node.hostname,
                "port": node.port,
                "acceleration": node.acceleration,
                "capacity": node.capacity.get("tts", 0.5),
                "response_time": node.response_time,
                "is_healthy": node.is_healthy
            }
            voices_info["nodes_status"].append(node_status)
        
        # Get local fallback voices
        try:
            from ..expression.text_to_speech import list_voice_ids
            voices_info["local_voices"] = list_voice_ids()
        except Exception as e:
            logger.warning(f"Could not get local voices: {e}")
            voices_info["local_voices"] = ["en_US-amy-medium"]  # Default fallback
        
        return JSONResponse(content=voices_info)
        
    except Exception as e:
        logger.error(f"❌ List voices error: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to list voices: {str(e)}")


# Legacy endpoint for compatibility
@router.post('/v1/audio/chat_voice')
async def transcribe_chat_voice(
    file: UploadFile = File(...),
    model: Optional[str] = Form("llama3.2"),
    voice: Optional[str] = Form("en_US-amy-medium"),
    speak: Optional[bool] = Form(True)
):
    """
    Transcribe audio, get LLM response, and either speak or return audio (with satellite routing)
    """
    try:
        if not file:
            raise HTTPException(status_code=400, detail="Missing audio file")
        
        # Read audio data
        audio_data = await file.read()
        
        # 1. Transcribe using satellite nodes
        stt_success, stt_result, stt_info = quick_stt(audio_data)
        
        if not stt_success or not stt_result:
            raise HTTPException(status_code=503, detail="Speech recognition failed")
        
        # Extract transcript
        transcript = ""
        if isinstance(stt_result, dict):
            transcript = stt_result.get('text', stt_result.get('transcription', ''))
        elif isinstance(stt_result, str):
            transcript = stt_result
        
        # 2. Get LLM response using satellite nodes
        from ..helpers.silicon_gateway import quick_llm
        llm_success, llm_result, llm_info = quick_llm(transcript, model)
        
        if not llm_success or not llm_result:
            # Fallback to local LLM
            from ..cognition.llm_interface import run_chat_completion
            messages = [{"role": "user", "content": transcript}]
            reply = run_chat_completion(model, messages, "You are a helpful AI assistant.", voice_id=voice)
            llm_info = {"source": "local_fallback", "acceleration": "cpu"}
        else:
            # Extract reply from satellite response
            if isinstance(llm_result, dict):
                reply = llm_result.get('response', llm_result.get('text', str(llm_result)))
            else:
                reply = str(llm_result)
        
        if speak:
            # 3. Generate TTS using satellite nodes
            tts_success, tts_audio, tts_info = quick_tts(reply, voice)
            
            if tts_success and tts_audio:
                # Return audio response
                return StreamingResponse(
                    io.BytesIO(tts_audio),
                    media_type='audio/wav',
                    headers={
                        'X-Transcript': transcript,
                        'X-Reply': reply[:100] + '...' if len(reply) > 100 else reply,
                        'X-STT-Source': stt_info.get('source', 'unknown'),
                        'X-LLM-Source': llm_info.get('source', 'unknown'),
                        'X-TTS-Source': tts_info.get('source', 'unknown')
                    }
                )
            else:
                # TTS failed, return text response
                return JSONResponse(content={
                    "transcript": transcript,
                    "reply": reply,
                    "voice": voice,
                    "model": model,
                    "service_info": {
                        "stt": stt_info,
                        "llm": llm_info,
                        "tts": {"error": "TTS failed"}
                    }
                })
        else:
            # Return text only
            return JSONResponse(content={
                "transcript": transcript,
                "reply": reply,
                "voice": voice,
                "model": model,
                "service_info": {
                    "stt": stt_info,
                    "llm": llm_info
                }
            })
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Chat voice error: {e}")
        raise HTTPException(status_code=500, detail=f"Chat voice processing failed: {str(e)}") 