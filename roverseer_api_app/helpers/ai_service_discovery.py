"""
AI Service Discovery - Network-based discovery of satellite AI nodes
Automatically finds and manages distributed AI services across the network
"""

import socket
import requests
import time
import json
import threading
from typing import Dict, List, Optional, Tuple
from dataclasses import dataclass, asdict
from datetime import datetime, timedelta
import platform
import subprocess
import concurrent.futures

@dataclass
class AIServiceNode:
    """Represents a discovered AI service node"""
    hostname: str
    ip_address: str
    port: int
    services: List[str]  # ['tts', 'stt', 'llm', 'audiocraft']
    capacity: Dict[str, float]  # service_name -> capacity_score (0-1)
    response_time: float  # milliseconds
    last_seen: datetime
    node_type: str  # 'silicon', 'gpu', 'cpu', 'hybrid'
    acceleration: str  # 'mlx', 'cuda', 'cpu'
    load: float  # current load 0-1
    version: str
    status: str  # 'active', 'busy', 'maintenance', 'error'

    @property
    def base_url(self) -> str:
        return f"http://{self.hostname}:{self.port}"
    
    @property
    def is_healthy(self) -> bool:
        return (
            self.status == 'active' and 
            self.last_seen > datetime.now() - timedelta(minutes=2)
        )
    
    @property
    def overall_capacity(self) -> float:
        """Calculate overall node capacity considering load"""
        if not self.capacity:
            return 0.0
        avg_capacity = sum(self.capacity.values()) / len(self.capacity)
        return avg_capacity * (1.0 - self.load)  # Reduce by current load


class AIServiceDiscovery:
    """Discovers and manages AI service nodes across the network"""
    
    def __init__(self, scan_interval: int = 60, timeout: float = 5.0):
        self.nodes: Dict[str, AIServiceNode] = {}
        self.scan_interval = scan_interval
        self.timeout = timeout
        self.scanning = False
        self.scan_thread = None
        
        # Default ports to scan for AI services
        self.default_ports = [8080, 8000, 7860, 5000, 3000, 11434]
        
        # Service discovery endpoints
        self.discovery_endpoints = [
            "/status",           # Silicon server style
            "/health",           # Generic health check
            "/api/v1/models",    # Ollama style
            "/api/status",       # Custom status
            "/docs"              # FastAPI docs (indicates AI service)
        ]
        
        self.local_hostname = self._get_local_hostname()
        
    def _get_local_hostname(self) -> str:
        """Get the local hostname/domain"""
        try:
            # Try to get the local hostname
            hostname = socket.gethostname()
            
            # On Mac, add .local if not present
            if platform.system() == "Darwin" and not hostname.endswith(".local"):
                hostname += ".local"
                
            return hostname
        except Exception:
            return "localhost"
    
    def _get_network_range(self) -> str:
        """Get the local network range for scanning"""
        try:
            # Get local IP address
            s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
            s.connect(("8.8.8.8", 80))
            local_ip = s.getsockname()[0]
            s.close()
            
            # Convert to network range (assume /24)
            ip_parts = local_ip.split('.')
            network_base = '.'.join(ip_parts[:3])
            return network_base
            
        except Exception:
            return "192.168.1"  # Default fallback
    
    def _scan_host(self, hostname: str, port: int) -> Optional[AIServiceNode]:
        """Scan a specific host and port for AI services"""
        try:
            start_time = time.time()
            
            # Try each discovery endpoint
            for endpoint in self.discovery_endpoints:
                try:
                    url = f"http://{hostname}:{port}{endpoint}"
                    response = requests.get(url, timeout=self.timeout)
                    
                    if response.status_code == 200:
                        response_time = (time.time() - start_time) * 1000
                        return self._parse_service_info(
                            hostname, 
                            self._resolve_hostname_to_ip(hostname), 
                            port, 
                            response, 
                            response_time
                        )
                        
                except requests.RequestException:
                    continue
                    
        except Exception as e:
            print(f"Error scanning {hostname}:{port} - {e}")
            
        return None
    
    def _resolve_hostname_to_ip(self, hostname: str) -> str:
        """Resolve hostname to IP address"""
        try:
            return socket.gethostbyname(hostname)
        except Exception:
            return hostname
    
    def _parse_service_info(
        self, 
        hostname: str, 
        ip_address: str, 
        port: int, 
        response: requests.Response, 
        response_time: float
    ) -> AIServiceNode:
        """Parse service information from response"""
        
        try:
            data = response.json()
        except Exception:
            data = {}
        
        # Detect service type and capabilities
        services = []
        capacity = {}
        node_type = "cpu"
        acceleration = "cpu"
        load = 0.0
        version = "unknown"
        status = "active"
        
        # Silicon server detection
        if "mlx_acceleration" in data or "silicon" in str(data).lower():
            services.extend(["tts", "stt", "llm"])
            node_type = "silicon"
            acceleration = "mlx"
            capacity = {"tts": 0.9, "stt": 0.9, "llm": 0.8}
            
            if "mlx_acceleration" in data:
                mlx_info = data["mlx_acceleration"]
                if mlx_info.get("enabled", False):
                    capacity = {"tts": 0.95, "stt": 0.95, "llm": 0.9}
                    
        # Ollama detection
        elif "models" in data or port == 11434:
            services.append("llm")
            node_type = "hybrid"
            capacity = {"llm": 0.7}
            
        # AudioCraft detection
        elif "audiocraft" in str(data).lower() or port == 7860:
            services.append("audiocraft")
            capacity = {"audiocraft": 0.8}
            
        # Generic AI service
        else:
            services = ["llm"]  # Assume basic LLM capability
            capacity = {"llm": 0.5}
        
        # Extract additional info if available
        if isinstance(data, dict):
            load = data.get("load", data.get("cpu_usage", 0.0))
            version = data.get("version", "unknown")
            status = data.get("status", "active")
            
            # Parse capacity information
            if "capacity" in data:
                capacity.update(data["capacity"])
                
            if "services" in data:
                services = data["services"]
        
        return AIServiceNode(
            hostname=hostname,
            ip_address=ip_address,
            port=port,
            services=services,
            capacity=capacity,
            response_time=response_time,
            last_seen=datetime.now(),
            node_type=node_type,
            acceleration=acceleration,
            load=load,
            version=version,
            status=status
        )
    
    def discover_local_services(self) -> List[AIServiceNode]:
        """Discover AI services on the local machine"""
        discovered = []
        
        # Scan localhost/local hostname
        for hostname in ["localhost", self.local_hostname]:
            for port in self.default_ports:
                node = self._scan_host(hostname, port)
                if node:
                    discovered.append(node)
                    
        return discovered
    
    def discover_network_services(self) -> List[AIServiceNode]:
        """Discover AI services on the local network"""
        discovered = []
        network_base = self._get_network_range()
        
        # Generate hostnames to scan
        hosts_to_scan = []
        
        # Scan common device names
        common_names = [
            "roverseer", "rover", "ai-server", "mac", "macbook", 
            "pi", "raspberry", "gpu-server", "workstation"
        ]
        
        for name in common_names:
            hosts_to_scan.extend([
                f"{name}.local",
                f"{name}"
            ])
        
        # Scan IP range (limited to avoid network flooding)
        for i in [1, 10, 20, 50, 100, 150, 200, 254]:  # Common IPs
            hosts_to_scan.append(f"{network_base}.{i}")
        
        # Parallel scanning for speed
        with concurrent.futures.ThreadPoolExecutor(max_workers=20) as executor:
            futures = []
            
            for hostname in hosts_to_scan:
                for port in self.default_ports:
                    future = executor.submit(self._scan_host, hostname, port)
                    futures.append(future)
            
            # Collect results with timeout
            for future in concurrent.futures.as_completed(futures, timeout=30):
                try:
                    node = future.result()
                    if node:
                        discovered.append(node)
                except Exception as e:
                    continue  # Skip failed scans
        
        return discovered
    
    def start_continuous_discovery(self):
        """Start continuous network scanning"""
        if self.scanning:
            return
            
        self.scanning = True
        self.scan_thread = threading.Thread(target=self._scan_loop, daemon=True)
        self.scan_thread.start()
        
        print(f"🔍 Started AI service discovery (scanning every {self.scan_interval}s)")
    
    def stop_discovery(self):
        """Stop continuous scanning"""
        self.scanning = False
        if self.scan_thread:
            self.scan_thread.join(timeout=5)
    
    def _scan_loop(self):
        """Continuous scanning loop"""
        while self.scanning:
            try:
                self.refresh_nodes()
                time.sleep(self.scan_interval)
            except Exception as e:
                print(f"❌ Discovery scan error: {e}")
                time.sleep(10)  # Wait before retrying
    
    def refresh_nodes(self):
        """Refresh the list of available nodes"""
        print("🔍 Scanning for AI service nodes...")
        
        # Discover services
        local_services = self.discover_local_services()
        network_services = self.discover_network_services()
        
        all_discovered = local_services + network_services
        
        # Update nodes dict, removing duplicates
        new_nodes = {}
        
        for node in all_discovered:
            node_id = f"{node.hostname}:{node.port}"
            
            # If we already know this node, update it
            if node_id in self.nodes:
                # Preserve historical data but update current info
                old_node = self.nodes[node_id]
                node.last_seen = datetime.now()
            
            new_nodes[node_id] = node
        
        # Remove stale nodes (not seen for 5 minutes)
        cutoff_time = datetime.now() - timedelta(minutes=5)
        
        for node_id, node in list(new_nodes.items()):
            if node.last_seen < cutoff_time:
                print(f"🗑️ Removing stale node: {node_id}")
                del new_nodes[node_id]
        
        self.nodes = new_nodes
        
        if self.nodes:
            print(f"✅ Found {len(self.nodes)} AI service nodes:")
            for node_id, node in self.nodes.items():
                services_str = ", ".join(node.services)
                print(f"   🔥 {node_id} ({node.acceleration}) - {services_str} - {node.response_time:.0f}ms")
        else:
            print("⚠️ No AI service nodes found")
    
    def get_best_node_for_service(self, service: str) -> Optional[AIServiceNode]:
        """Get the best available node for a specific service"""
        candidates = [
            node for node in self.nodes.values() 
            if service in node.services and node.is_healthy
        ]
        
        if not candidates:
            return None
        
        # Sort by capacity * (1 - load) * response_time_factor
        def score_node(node: AIServiceNode) -> float:
            service_capacity = node.capacity.get(service, 0.5)
            load_factor = 1.0 - node.load
            response_factor = 1.0 / (1.0 + node.response_time / 1000.0)  # Favor faster responses
            
            # Bonus for MLX acceleration
            acceleration_bonus = 1.5 if node.acceleration == "mlx" else 1.0
            
            return service_capacity * load_factor * response_factor * acceleration_bonus
        
        best_node = max(candidates, key=score_node)
        return best_node
    
    def get_all_nodes(self) -> List[AIServiceNode]:
        """Get all discovered nodes"""
        return list(self.nodes.values())
    
    def get_healthy_nodes(self) -> List[AIServiceNode]:
        """Get only healthy nodes"""
        return [node for node in self.nodes.values() if node.is_healthy]
    
    def get_node_by_id(self, node_id: str) -> Optional[AIServiceNode]:
        """Get a specific node by ID (hostname:port)"""
        return self.nodes.get(node_id)
    
    def export_nodes_config(self) -> Dict:
        """Export current nodes configuration"""
        return {
            "timestamp": datetime.now().isoformat(),
            "nodes": [asdict(node) for node in self.nodes.values()],
            "total_nodes": len(self.nodes),
            "healthy_nodes": len(self.get_healthy_nodes())
        }


# Global service discovery instance
service_discovery = AIServiceDiscovery()


def get_service_discovery() -> AIServiceDiscovery:
    """Get the global service discovery instance"""
    return service_discovery


def start_ai_service_discovery():
    """Start the AI service discovery system"""
    service_discovery.refresh_nodes()  # Initial scan
    service_discovery.start_continuous_discovery()


def get_best_ai_service_url(service: str) -> Tuple[Optional[str], Optional[AIServiceNode]]:
    """Get the best available service URL and node info"""
    best_node = service_discovery.get_best_node_for_service(service)
    
    if best_node:
        return best_node.base_url, best_node
    
    return None, None


def is_any_ai_service_available() -> bool:
    """Check if any AI services are available"""
    return len(service_discovery.get_healthy_nodes()) > 0 