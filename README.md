# RoverSeer API

Voice assistant system with hardware integration.

## Recent Updates

### AJAX Chat Interface Improvements
- **User messages appear immediately** - No page reload required
- **Form selections persist** - Output type, model, and voice selections maintained
- **Fixed duplicate messages** - History properly managed server-side
- **Improved refresh button** - Only updates status without resubmitting forms
- **Real-time status indicators** - Shows when RoverSeer is thinking/speaking
- **Prevents multiple submissions** - Disabled submit button during requests

### Hardware Manager Pattern
- Thread-safe managers for Buzzer, Display, LEDs, and Rainbow Strip
- Automatic recovery and cleanup mechanisms
- Centralized hardware control with clean separation from application logic

### UI Enhancements
- iPhone Messages style chat interface
- Collapsible `<think>` sections for AI reasoning
- Simplified status indicators (🔵 idle, 🟢 active with details)
