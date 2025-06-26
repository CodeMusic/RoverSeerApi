#!/usr/bin/env python3
"""
AudioCraft Diagnostic Script for RoverSeer
Run this on your Pi to check AudioCraft functionality
"""

import sys
import os
import subprocess
from pathlib import Path

def check_dependency(module_name, import_name=None):
    """Check if a dependency is available"""
    if import_name is None:
        import_name = module_name
    
    try:
        __import__(import_name)
        print(f"✅ {module_name} is available")
        return True
    except ImportError as e:
        print(f"❌ {module_name} is NOT available: {e}")
        return False

def check_file(file_path):
    """Check if a file exists"""
    if os.path.exists(file_path):
        print(f"✅ File exists: {file_path}")
        return True
    else:
        print(f"❌ File missing: {file_path}")
        return False

def test_audiocraft_route():
    """Test AudioCraft route import"""
    try:
        sys.path.insert(0, 'roverseer_api_app')
        from routes.audiocraft_routes import router
        print("✅ AudioCraft routes imported successfully")
        
        # Print available routes
        print("\n📋 Available AudioCraft routes:")
        for route in router.routes:
            print(f"  - {route.methods} {route.path}")
        
        return True
    except Exception as e:
        print(f"❌ AudioCraft routes import failed: {e}")
        return False

def main():
    print("🎵 RoverSeer AudioCraft Diagnostic")
    print("=" * 50)
    
    # Check working directory
    print(f"📁 Current directory: {os.getcwd()}")
    
    # Check critical files
    print("\n🔍 Checking critical files:")
    check_file("roverseer_api_app/routes/audiocraft_routes.py")
    check_file("roverseer_api_app/templates/audiocraft.html")
    check_file("roverseer_api_app/app.py")
    
    # Check dependencies
    print("\n🔍 Checking dependencies:")
    fastapi_ok = check_dependency("FastAPI", "fastapi")
    jinja2_ok = check_dependency("Jinja2", "jinja2")
    check_dependency("PyTorch", "torch")
    check_dependency("AudioCraft", "audiocraft")
    check_dependency("SoX")  # For fallback audio generation
    
    # Test route import
    print("\n🔍 Testing AudioCraft route import:")
    route_ok = test_audiocraft_route()
    
    # Summary
    print("\n📊 Diagnostic Summary:")
    if fastapi_ok and jinja2_ok and route_ok:
        print("✅ AudioCraft should be working!")
        print("🌐 Try accessing: http://roverseer.local:5000/audiocraft")
    else:
        print("❌ Issues found. AudioCraft may not work properly.")
        
        print("\n🔧 Suggested fixes:")
        if not fastapi_ok:
            print("  - Install FastAPI: pip install fastapi")
        if not jinja2_ok:
            print("  - Install Jinja2: pip install jinja2")
        if not route_ok:
            print("  - Check the AudioCraft routes file for syntax errors")
    
    # Test direct route access
    print("\n🧪 Testing direct access (if FastAPI is available):")
    if fastapi_ok:
        try:
            import requests
            response = requests.get("http://localhost:5000/audiocraft", timeout=5)
            print(f"✅ AudioCraft page responds: {response.status_code}")
        except ImportError:
            print("ℹ️  requests module not available for testing")
        except Exception as e:
            print(f"❌ AudioCraft page test failed: {e}")

if __name__ == "__main__":
    main() 