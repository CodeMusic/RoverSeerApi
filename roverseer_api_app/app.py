from flask import Flask, redirect
from flask_cors import CORS
from flasgger import Swagger
import atexit

# Import configuration and initialization functions
from config import initialize_config
from embodiment.rainbow_interface import initialize_hardware
from cognition.model_management import initialize_model_list
from expression.sound_orchestration import start_sound_queue_worker, stop_sound_queue_worker

# Import route blueprints
from routes.system_routes import bp as system_bp
from routes.chat_routes import bp as chat_bp
from routes.audio_routes import bp as audio_bp

# Create Flask application
app = Flask(__name__)
CORS(app)

# Configure Swagger
swagger = Swagger(app, template={
    "swagger": "2.0",
    "info": {
        "title": "RoverSeer API",
        "description": "Voice assistant system with hardware integration, speech recognition, text-to-speech, and bicameral AI processing.",
        "version": "2.0.0"
    },
    "basePath": "/",
}, config={
    "headers": [],
    "specs": [
        {
            "endpoint": 'apispec_1',
            "route": '/apispec_1.json',
            "rule_filter": lambda rule: True,
            "model_filter": lambda tag: True,
        }
    ],
    "static_url_path": "/flasgger_static",
    "swagger_ui": True,
    "specs_route": "/docs"
})

# Register blueprints
app.register_blueprint(system_bp)
app.register_blueprint(chat_bp)
app.register_blueprint(audio_bp)

# Root redirect
@app.route('/docs/')
def redirect_docs():
    return redirect("/docs", code=302)


def initialize_application():
    """Initialize all components of the RoverSeer application"""
    print("🚀 Initializing RoverSeer API v2.0...")
    
    # Initialize configuration
    initialize_config()
    print("✅ Configuration initialized")
    
    # Initialize hardware interface
    hardware_success = initialize_hardware()
    if hardware_success:
        print("✅ Rainbow HAT hardware initialized")
    else:
        print("⚠️  Running without hardware (development mode)")
    
    # Start sound queue worker
    start_sound_queue_worker()
    print("✅ Sound orchestration system started")
    
    # Initialize model management
    model_success = initialize_model_list()
    if model_success:
        print("✅ Model management initialized")
    else:
        print("⚠️  Model management using defaults")
    
    print("🎯 RoverSeer API is ready!")


def cleanup_application():
    """Cleanup function called on application shutdown"""
    print("🧹 Cleaning up RoverSeer API...")
    
    # Stop sound queue worker
    stop_sound_queue_worker()
    print("✅ Sound orchestration stopped")
    
    # Turn off all LEDs and clear display
    from embodiment.rainbow_interface import get_rainbow_driver
    from embodiment.display_manager import clear_display
    
    rainbow = get_rainbow_driver()
    if rainbow:
        try:
            # Turn off all LEDs
            for led in ['A', 'B', 'C']:
                rainbow.button_leds[led].off()
            # Clear display
            clear_display()
            print("✅ Hardware cleanup complete")
        except Exception as e:
            print(f"⚠️  Hardware cleanup error: {e}")
    
    print("👋 RoverSeer API shutdown complete")


# Register cleanup function
atexit.register(cleanup_application)

# Initialize on import
initialize_application()

if __name__ == '__main__':
    try:
        print("🌐 Starting Flask server on http://0.0.0.0:5000")
        app.run(host="0.0.0.0", port=5000, debug=False)
    except KeyboardInterrupt:
        print("\n🛑 Server stopped by user")
    except Exception as e:
        print(f"💥 Server error: {e}")
    finally:
        cleanup_application() 