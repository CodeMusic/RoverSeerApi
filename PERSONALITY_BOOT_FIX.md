# Personality Boot and Switch Display Fixes

## Issues Fixed

### 1. Personality Name Not Showing on Boot
- Added `refresh_available_models()` call during hardware initialization to ensure personalities are loaded
- This happens before the re-sync attempt, ensuring the personality list is populated
- The device now properly displays the current personality name with emoji on startup

### 2. No Name Scroll When Switching Personality
- Updated `switch_personality()` endpoint to trigger a display update
- When a personality is switched via API, it now automatically scrolls the new personality name
- Shows format: `{emoji} {name}` (e.g., "🍊 Donald Trump")

### 3. RoverCub Compatibility
- Added simple personality endpoints without `/system` prefix:
  - `/personalities` - List all personalities
  - `/personalities/switch` - Switch personality
  - `/personalities/current` - Get current personality
- These mirror the functionality of the `/system/personality/*` endpoints

## Implementation Details

### Files Modified:
1. **roverseer_api_app/embodiment/rainbow_interface.py**
   - Added model refresh before personality sync on boot
   
2. **roverseer_api_app/routes/system_routes.py**
   - Added display update to `switch_personality()`
   - Added RoverCub-compatible endpoints

### Boot Sequence:
1. Hardware initializes
2. Models and personalities are refreshed
3. Current personality is synced
4. Personality name is scrolled on display

### Switch Sequence:
1. API receives switch request
2. Personality is switched
3. Voice and model preferences are updated
4. Display scrolls new personality name

## Result
- Device shows personality name on boot
- Switching personalities triggers immediate visual feedback
- RoverCub can use simplified endpoints
- Consistent behavior across web UI and device 