"""
Silicon Gateway - Enhanced with Network Service Discovery
Intelligent routing system for distributed AI services with satellite node discovery
"""

import requests
import time
from typing import Optional, Dict, Any, Tuple
import json
from datetime import datetime, timedelta
import platform
import socket
from .ai_service_discovery import (
    get_service_discovery, 
    get_best_ai_service_url,
    start_ai_service_discovery,
    is_any_ai_service_available,
    AIServiceNode
)


class SiliconGateway:
    """Enhanced gateway with network service discovery and intelligent routing"""
    
    def __init__(self):
        self.service_discovery = get_service_discovery()
        self.health_cache = {}
        self.cache_duration = 30  # seconds
        self.request_timeout = 10
        self.performance_metrics = {}
        
        # Initialize service discovery
        self._initialize_discovery()
        
    def _initialize_discovery(self):
        """Initialize the AI service discovery system"""
        try:
            print("🔍 Initializing AI Service Discovery...")
            start_ai_service_discovery()
            
            # Give it a moment to discover local services
            time.sleep(2)
            
            nodes = self.service_discovery.get_healthy_nodes()
            if nodes:
                print(f"✅ Discovered {len(nodes)} AI service nodes")
                for node in nodes:
                    services_str = ", ".join(node.services)
                    print(f"   🔥 {node.hostname}:{node.port} ({node.acceleration}) - {services_str}")
            else:
                print("⚠️ No satellite nodes found - will use fallback services")
                
        except Exception as e:
            print(f"❌ Service discovery initialization failed: {e}")
    
    def _get_local_domain(self) -> str:
        """Get the appropriate local domain based on current system"""
        try:
            hostname = socket.gethostname()
            
            # On macOS, use .local domain
            if platform.system() == "Darwin":
                if not hostname.endswith(".local"):
                    hostname += ".local"
                return hostname
            
            # On other systems, try to resolve actual hostname
            return hostname
            
        except Exception:
            return "localhost"
    
    def _resolve_service_url(self, base_url: str, service_path: str) -> str:
        """Resolve service URL with proper domain handling"""
        # If base_url contains localhost and we're not on the same machine
        if "localhost" in base_url:
            local_domain = self._get_local_domain()
            if local_domain != "localhost":
                # Replace localhost with actual domain for cross-network access
                base_url = base_url.replace("localhost", local_domain)
        
        return f"{base_url}{service_path}"
    
    def get_best_service_for(self, service_type: str) -> Tuple[Optional[str], Optional[AIServiceNode], Dict[str, Any]]:
        """Get the best available service URL with full node information"""
        
        # Get best node from service discovery
        best_url, best_node = get_best_ai_service_url(service_type)
        
        service_info = {
            "source": "unknown",
            "acceleration": "cpu",
            "response_time": None,
            "capacity": 0.5,
            "load": 0.0,
            "node_type": "fallback"
        }
        
        if best_node:
            service_info.update({
                "source": f"{best_node.hostname}:{best_node.port}",
                "acceleration": best_node.acceleration,
                "response_time": best_node.response_time,
                "capacity": best_node.capacity.get(service_type, 0.5),
                "load": best_node.load,
                "node_type": best_node.node_type
            })
            
            print(f"🔥 Routing {service_type} to {service_info['source']} "
                  f"({service_info['acceleration']}, {service_info['response_time']:.0f}ms)")
        
        return best_url, best_node, service_info
    
    def tts_service(self, text: str, voice: str = "en_US-amy-medium") -> Tuple[bool, Any, Dict[str, Any]]:
        """Get TTS service with intelligent routing"""
        
        best_url, best_node, service_info = self.get_best_service_for("tts")
        
        if best_url:
            # Try satellite/MLX service first
            try:
                start_time = time.time()
                
                url = self._resolve_service_url(best_url, "/api/tts")
                
                response = requests.post(
                    url,
                    json={"text": text, "voice": voice},
                    timeout=self.request_timeout
                )
                
                response_time = (time.time() - start_time) * 1000
                service_info["actual_response_time"] = response_time
                
                if response.status_code == 200:
                    print(f"✅ TTS via {service_info['source']} ({response_time:.0f}ms)")
                    return True, response.content, service_info
                    
            except Exception as e:
                print(f"⚠️ TTS satellite service failed: {e}")
        
        # Fallback to local roverseer service
        try:
            start_time = time.time()
            
            # Determine local domain
            local_domain = self._get_local_domain()
            fallback_url = f"http://{local_domain}:5000/tts"
            
            response = requests.post(
                fallback_url,
                json={"text": text, "voice": voice},
                timeout=self.request_timeout
            )
            
            response_time = (time.time() - start_time) * 1000
            
            service_info.update({
                "source": f"{local_domain}:5000",
                "acceleration": "fallback",
                "actual_response_time": response_time,
                "node_type": "local_fallback"
            })
            
            if response.status_code == 200:
                print(f"✅ TTS via fallback ({response_time:.0f}ms)")
                return True, response.content, service_info
                
        except Exception as e:
            print(f"❌ TTS fallback failed: {e}")
        
        service_info.update({
            "source": "failed",
            "error": "All TTS services unavailable"
        })
        
        return False, None, service_info
    
    def stt_service(self, audio_data: bytes) -> Tuple[bool, Any, Dict[str, Any]]:
        """Get STT service with intelligent routing"""
        
        best_url, best_node, service_info = self.get_best_service_for("stt")
        
        if best_url:
            # Try satellite/MLX service first
            try:
                start_time = time.time()
                
                url = self._resolve_service_url(best_url, "/api/stt")
                
                files = {"audio": ("audio.wav", audio_data, "audio/wav")}
                response = requests.post(
                    url,
                    files=files,
                    timeout=self.request_timeout
                )
                
                response_time = (time.time() - start_time) * 1000
                service_info["actual_response_time"] = response_time
                
                if response.status_code == 200:
                    result = response.json()
                    print(f"✅ STT via {service_info['source']} ({response_time:.0f}ms)")
                    return True, result, service_info
                    
            except Exception as e:
                print(f"⚠️ STT satellite service failed: {e}")
        
        # Fallback to local roverseer service
        try:
            start_time = time.time()
            
            local_domain = self._get_local_domain()
            fallback_url = f"http://{local_domain}:5000/v1/audio/transcriptions"
            
            files = {"file": ("audio.wav", audio_data, "audio/wav")}
            response = requests.post(
                fallback_url,
                files=files,
                timeout=self.request_timeout
            )
            
            response_time = (time.time() - start_time) * 1000
            
            service_info.update({
                "source": f"{local_domain}:5000",
                "acceleration": "fallback",
                "actual_response_time": response_time,
                "node_type": "local_fallback"
            })
            
            if response.status_code == 200:
                result = response.json()
                print(f"✅ STT via fallback ({response_time:.0f}ms)")
                return True, result, service_info
                
        except Exception as e:
            print(f"❌ STT fallback failed: {e}")
        
        service_info.update({
            "source": "failed",
            "error": "All STT services unavailable"
        })
        
        return False, None, service_info
    
    def llm_service(self, prompt: str, model: str = None) -> Tuple[bool, Any, Dict[str, Any]]:
        """Get LLM service with intelligent routing"""
        
        best_url, best_node, service_info = self.get_best_service_for("llm")
        
        if best_url:
            # Try satellite/MLX service first
            try:
                start_time = time.time()
                
                url = self._resolve_service_url(best_url, "/api/generate")
                
                payload = {"prompt": prompt}
                if model:
                    payload["model"] = model
                
                response = requests.post(
                    url,
                    json=payload,
                    timeout=self.request_timeout * 3  # LLM needs more time
                )
                
                response_time = (time.time() - start_time) * 1000
                service_info["actual_response_time"] = response_time
                
                if response.status_code == 200:
                    result = response.json()
                    print(f"✅ LLM via {service_info['source']} ({response_time:.0f}ms)")
                    return True, result, service_info
                    
            except Exception as e:
                print(f"⚠️ LLM satellite service failed: {e}")
        
        # Fallback to local ollama
        try:
            start_time = time.time()
            
            local_domain = self._get_local_domain()
            fallback_url = f"http://{local_domain}:11434/api/generate"
            
            payload = {
                "model": model or "llama3.2",
                "prompt": prompt,
                "stream": False
            }
            
            response = requests.post(
                fallback_url,
                json=payload,
                timeout=self.request_timeout * 3
            )
            
            response_time = (time.time() - start_time) * 1000
            
            service_info.update({
                "source": f"{local_domain}:11434",
                "acceleration": "ollama",
                "actual_response_time": response_time,
                "node_type": "local_ollama"
            })
            
            if response.status_code == 200:
                result = response.json()
                print(f"✅ LLM via Ollama fallback ({response_time:.0f}ms)")
                return True, result, service_info
                
        except Exception as e:
            print(f"❌ LLM fallback failed: {e}")
        
        service_info.update({
            "source": "failed",
            "error": "All LLM services unavailable"
        })
        
        return False, None, service_info
    
    def audiocraft_service(self, prompt: str, duration: int = 10) -> Tuple[bool, Any, Dict[str, Any]]:
        """Get AudioCraft service with intelligent routing"""
        
        best_url, best_node, service_info = self.get_best_service_for("audiocraft")
        
        if best_url:
            # Try satellite AudioCraft service
            try:
                start_time = time.time()
                
                url = self._resolve_service_url(best_url, "/api/audiocraft/generate")
                
                response = requests.post(
                    url,
                    json={"prompt": prompt, "duration": duration},
                    timeout=self.request_timeout * 6  # AudioCraft needs even more time
                )
                
                response_time = (time.time() - start_time) * 1000
                service_info["actual_response_time"] = response_time
                
                if response.status_code == 200:
                    print(f"✅ AudioCraft via {service_info['source']} ({response_time:.0f}ms)")
                    return True, response.content, service_info
                    
            except Exception as e:
                print(f"⚠️ AudioCraft satellite service failed: {e}")
        
        # Fallback to local roverseer audiocraft
        try:
            start_time = time.time()
            
            local_domain = self._get_local_domain()
            fallback_url = f"http://{local_domain}:5000/audiocraft/generate"
            
            response = requests.post(
                fallback_url,
                json={"prompt": prompt, "duration": duration},
                timeout=self.request_timeout * 6
            )
            
            response_time = (time.time() - start_time) * 1000
            
            service_info.update({
                "source": f"{local_domain}:5000",
                "acceleration": "fallback",
                "actual_response_time": response_time,
                "node_type": "local_fallback"
            })
            
            if response.status_code == 200:
                print(f"✅ AudioCraft via fallback ({response_time:.0f}ms)")
                return True, response.content, service_info
                
        except Exception as e:
            print(f"❌ AudioCraft fallback failed: {e}")
        
        service_info.update({
            "source": "failed", 
            "error": "All AudioCraft services unavailable"
        })
        
        return False, None, service_info
    
    def get_service_status(self) -> Dict[str, Any]:
        """Get comprehensive service status across all nodes"""
        
        healthy_nodes = self.service_discovery.get_healthy_nodes()
        all_nodes = self.service_discovery.get_all_nodes()
        
        services_status = {
            "tts": [],
            "stt": [],
            "llm": [],
            "audiocraft": []
        }
        
        # Categorize nodes by service
        for node in healthy_nodes:
            for service in node.services:
                if service in services_status:
                    services_status[service].append({
                        "hostname": node.hostname,
                        "port": node.port,
                        "acceleration": node.acceleration,
                        "capacity": node.capacity.get(service, 0.5),
                        "load": node.load,
                        "response_time": node.response_time,
                        "node_type": node.node_type
                    })
        
        # Get best service for each type
        best_services = {}
        for service_type in services_status.keys():
            best_url, best_node, service_info = self.get_best_service_for(service_type)
            best_services[service_type] = {
                "available": best_url is not None,
                "source": service_info.get("source", "none"),
                "acceleration": service_info.get("acceleration", "none")
            }
        
        return {
            "timestamp": datetime.now().isoformat(),
            "total_nodes": len(all_nodes),
            "healthy_nodes": len(healthy_nodes),
            "services": services_status,
            "best_services": best_services,
            "network_discovery_active": self.service_discovery.scanning,
            "local_domain": self._get_local_domain()
        }
    
    def refresh_discovery(self) -> Dict[str, Any]:
        """Manually refresh service discovery"""
        print("🔄 Manually refreshing service discovery...")
        
        try:
            self.service_discovery.refresh_nodes()
            status = self.get_service_status()
            
            print(f"✅ Discovery refresh complete - found {status['healthy_nodes']} healthy nodes")
            return status
            
        except Exception as e:
            print(f"❌ Discovery refresh failed: {e}")
            return {"error": str(e)}


# Global gateway instance
silicon_gateway = SiliconGateway()


def get_silicon_gateway() -> SiliconGateway:
    """Get the global silicon gateway instance"""
    return silicon_gateway


def quick_tts(text: str, voice: str = "en_US-amy-medium") -> Tuple[bool, Any, Dict[str, Any]]:
    """Quick TTS service access"""
    return silicon_gateway.tts_service(text, voice)


def quick_stt(audio_data: bytes) -> Tuple[bool, Any, Dict[str, Any]]:
    """Quick STT service access"""
    return silicon_gateway.stt_service(audio_data)


def quick_llm(prompt: str, model: str = None) -> Tuple[bool, Any, Dict[str, Any]]:
    """Quick LLM service access"""
    return silicon_gateway.llm_service(prompt, model)


def quick_audiocraft(prompt: str, duration: int = 10) -> Tuple[bool, Any, Dict[str, Any]]:
    """Quick AudioCraft service access"""
    return silicon_gateway.audiocraft_service(prompt, duration) 