from fastapi import FastAPI, Request
from fastapi.responses import RedirectResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
import asyncio
import uvicorn
import atexit

# Import configuration and initialization functions
from config import initialize_config
from embodiment.rainbow_interface import initialize_hardware
from cognition.model_management import initialize_model_list

# Import route modules (converted to FastAPI)
from routes.system_routes import router as system_router
from routes.chat_routes import router as chat_router
from routes.audio_routes import router as audio_router
from routes.audiocraft_routes import router as audiocraft_router
from routes.emergent_narrative_routes import router as emergent_narrative_router

# Create minimal routers for other routes to maintain compatibility
from fastapi import APIRouter
voice_training_router = APIRouter() 

# Create FastAPI application
app = FastAPI(
    title="🤖 RoverSeer Neural Interface API",
    description="Advanced voice assistant system with hardware integration, speech recognition, text-to-speech, and bicameral AI processing with neural personality management.",
    version="2.0.0",
    docs_url="/api/docs",
    redoc_url="/api/redoc",
    openapi_url="/api/openapi.json"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure as needed for security
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Setup templates and static files
templates = Jinja2Templates(directory="templates")
app.mount("/static", StaticFiles(directory="static"), name="static")

# Include routers (FastAPI equivalent of Flask blueprints)
app.include_router(system_router, tags=["system"])
app.include_router(chat_router, tags=["chat"])
app.include_router(audio_router, tags=["audio"])
app.include_router(voice_training_router, prefix="/neural-voice", tags=["voice-training"])
app.include_router(audiocraft_router, tags=["audiocraft"])
app.include_router(emergent_narrative_router, tags=["emergent-narrative"])

# Root redirect
@app.get('/docs/')
async def redirect_docs():
    return RedirectResponse("/api/docs", status_code=302)


async def initialize_application():
    """Initialize all components of the RoverSeer application (async version)"""
    print("🚀 Initializing RoverSeer FastAPI v2.0...")
    
    try:
        # Initialize configuration
        initialize_config()
        print("✅ Configuration initialized")
    except Exception as e:
        print(f"⚠️  Configuration initialization failed: {e}")
        print("⚠️  Continuing with defaults...")
    
    try:
        # Initialize personality system FIRST (before model list)
        from cognition.personality import get_personality_manager
        personality_manager = get_personality_manager()
        print(f"✅ Personality system initialized with {len(personality_manager.personalities)} personalities")
        
        if personality_manager.current_personality:
            print(f"✅ Current personality loaded: {personality_manager.current_personality.name}")
        else:
            print("ℹ️  No current personality set")
    except Exception as e:
        print(f"⚠️  Personality system initialization failed: {e}")
        print("⚠️  Continuing without personality system...")
        personality_manager = None
    
    try:
        # Initialize hardware interface
        hardware_success = initialize_hardware()
        if hardware_success:
            print("✅ Rainbow HAT hardware initialized")
        else:
            print("⚠️  Running without hardware (development mode)")
    except Exception as e:
        print(f"⚠️  Hardware initialization failed: {e}")
        print("⚠️  Continuing without hardware...")
        hardware_success = False
    
    try:
        # Initialize model management (now personalities are available)
        model_success = initialize_model_list()
        if model_success:
            print("✅ Model management initialized")
        else:
            print("⚠️  Model management using defaults")
    except Exception as e:
        print(f"⚠️  Model management initialization failed: {e}")
        print("⚠️  Continuing with basic model setup...")
        model_success = False
    
    # Enhanced device synchronization with current personality
    try:
        if personality_manager and personality_manager.current_personality:
            print(f"🎯 Syncing device to current personality: {personality_manager.current_personality.name}")
            
            # Ensure the personality's voice is immediately available
            if personality_manager.current_personality.voice_id:
                try:
                    # Update DEFAULT_VOICE in config module directly
                    import config
                    config.DEFAULT_VOICE = personality_manager.current_personality.voice_id
                    print(f"✅ Default voice set to personality voice: {personality_manager.current_personality.voice_id}")
                except Exception as e:
                    print(f"⚠️  Failed to set default voice: {e}")
            
            # Find the personality in the available models list
            personality_entry = f"PERSONALITY:{personality_manager.current_personality.name}"
            try:
                import config
                personality_index = config.available_models.index(personality_entry)
                config.selected_model_index = personality_index
                print(f"✅ Device set to personality {personality_manager.current_personality.name} (index {personality_index})")
            except (ValueError, AttributeError, IndexError) as e:
                print(f"⚠️  Personality {personality_manager.current_personality.name} not found in device list: {e}")
                
                # If personality has a model preference, try to find that
                try:
                    if personality_manager.current_personality.model_preference:
                        import config
                        model_index = config.available_models.index(personality_manager.current_personality.model_preference)
                        config.selected_model_index = model_index
                        print(f"✅ Device set to personality's preferred model {personality_manager.current_personality.model_preference} (index {model_index})")
                except (ValueError, AttributeError, IndexError) as e:
                    print(f"⚠️  Personality's preferred model not available: {e}")
        else:
            print("⚠️  No current personality found during startup - this may cause device issues")
            print("⚠️  Device may require manual voice/model selection to function properly")
    except Exception as e:
        print(f"⚠️  Device synchronization failed: {e}")
        print("⚠️  Continuing with default device settings...")
    
    print("🎯 RoverSeer FastAPI is ready!")


def cleanup_application():
    """Cleanup function called on application shutdown"""
    print("🧹 Cleaning up RoverSeer API...")
    
    try:
        # Turn off all LEDs and clear display
        from embodiment.rainbow_interface import get_rainbow_driver
        
        rainbow = get_rainbow_driver()
        if rainbow:
            try:
                # Use LED manager to stop all LEDs
                if hasattr(rainbow, 'button_led_manager'):
                    rainbow.button_led_manager.stop_all_leds()
                # Clear display
                rainbow.clear_display()
                print("✅ Hardware cleanup complete")
            except Exception as e: 
                print(f"⚠️  Hardware cleanup error: {e}")
    except Exception as e:
        print(f"⚠️  Cleanup import error: {e}")
    
    print("👋 RoverSeer API shutdown complete")


# FastAPI startup and shutdown events
@app.on_event("startup")
async def startup_event():
    """FastAPI startup event"""
    try:
        await initialize_application()
    except Exception as e:
        print(f"❌ CRITICAL: Application initialization failed: {e}")
        print("❌ Some features may not work properly")
        print("❌ Check the error above and restart the application")

@app.on_event("shutdown")
async def shutdown_event():
    """FastAPI shutdown event"""
    cleanup_application()

# Register cleanup function for non-FastAPI shutdown
atexit.register(cleanup_application)

if __name__ == '__main__':
    try:
        print("🌐 Starting FastAPI server on http://0.0.0.0:5000")
        print("🚀 Performance upgrade: Now using FastAPI instead of Flask!")
        print("📊 API documentation available at: http://0.0.0.0:5000/api/docs")
        
        uvicorn.run(
            app,
            host="0.0.0.0",
            port=5000,
            reload=False,  # Set to True for development
            access_log=True,
            log_level="info"
        )
    except KeyboardInterrupt:
        print("\n🛑 Server stopped by user")
    except Exception as e:
        print(f"💥 Server error: {e}")
        import traceback
        traceback.print_exc()
        traceback.print_exc()
    finally:
        try:
            cleanup_application() 
        except Exception as cleanup_error:
            print(f"⚠️  Cleanup failed: {cleanup_error}") 