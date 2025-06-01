import json
import re
from datetime import datetime
from pathlib import Path
import os

from config import LOG_DIR, STATS_FILE


def ensure_log_dir():
    """Create the log directory if it doesn't exist"""
    LOG_DIR.mkdir(exist_ok=True)


def get_log_filename(log_type):
    """Get the log filename for today's date"""
    today = datetime.now().strftime("%Y-%m-%d")
    return LOG_DIR / f"{log_type}_{today}.log"


def load_model_stats():
    """Load model statistics from JSON file"""
    ensure_log_dir()
    if STATS_FILE.exists():
        try:
            with open(STATS_FILE, 'r') as f:
                return json.load(f)
        except:
            return {}
    return {}


def save_model_stats(stats):
    """Save model statistics to JSON file"""
    ensure_log_dir()
    with open(STATS_FILE, 'w') as f:
        json.dump(stats, f, indent=2)


def update_model_runtime(model_name, runtime):
    """Update runtime statistics for a model"""
    stats = load_model_stats()
    
    if model_name not in stats:
        stats[model_name] = {
            "total_runtime": 0,
            "run_count": 0,
            "average_runtime": 0,
            "last_runtime": 0,
            "last_run": None
        }
    
    stats[model_name]["total_runtime"] += runtime
    stats[model_name]["run_count"] += 1
    stats[model_name]["average_runtime"] = stats[model_name]["total_runtime"] / stats[model_name]["run_count"]
    stats[model_name]["last_runtime"] = runtime
    stats[model_name]["last_run"] = datetime.now().isoformat()
    
    save_model_stats(stats)
    return stats[model_name]["average_runtime"]


def get_model_runtime(model_name):
    """Get average runtime for a model"""
    stats = load_model_stats()
    if model_name in stats:
        return stats[model_name].get("average_runtime", None)
    return None


def log_llm_usage(model_name, system_message, user_prompt, response, processing_time=None, voice_id=None):
    """Log LLM usage to daily file in JSON format"""
    ensure_log_dir()
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    
    # Infer personality from voice_id
    personality = "default"
    if voice_id:
        # Import config to check if it's a voice with special personality
        from config import VOICE_PERSONALITIES
        if voice_id in VOICE_PERSONALITIES:
            # Extract personality name from voice_id (e.g., "en_US-GlaDOS" -> "GlaDOS")
            parts = voice_id.split('-')
            if len(parts) >= 2:
                personality = parts[-1]  # Get the last part (GlaDOS, jarvis, amy, etc.)
        else:
            personality = "device"  # Default device personality for other voices
    
    log_entry = {
        "timestamp": timestamp,
        "model": model_name,
        "personality": personality,
        "voice_id": voice_id,
        "system_message": system_message,
        "user_prompt": user_prompt,
        "llm_reply": response,
        "runtime": processing_time or 0
    }
    
    with open(get_log_filename("llm_usage"), "a", encoding="utf-8") as f:
        f.write(json.dumps(log_entry) + "\n")


def log_penphin_mind_usage(logical_model, creative_model, convergence_model, 
                          system_message, user_prompt, 
                          logical_response, logical_time,
                          creative_response, creative_time,
                          convergence_response, convergence_time):
    """Log PenphinMind bicameral flow to daily file in JSON format"""
    ensure_log_dir()
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    total_time = logical_time + creative_time + convergence_time
    
    log_entry = {
        "timestamp": timestamp,
        "logical_model": logical_model,
        "creative_model": creative_model,
        "convergence_model": convergence_model,
        "system_message": system_message,
        "original_prompt": user_prompt,
        "logical_response": logical_response,
        "logical_time": logical_time,
        "creative_response": creative_response,
        "creative_time": creative_time,
        "final_synthesis": convergence_response,
        "convergence_time": convergence_time,
        "total_time": total_time
    }
    
    with open(get_log_filename("penphin_mind"), "a", encoding="utf-8") as f:
        f.write(json.dumps(log_entry) + "\n")


def log_asr_usage(audio_file, transcript, processing_time=None):
    """Log ASR (Automatic Speech Recognition) usage to daily file in JSON format"""
    ensure_log_dir()
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    
    log_entry = {
        "timestamp": timestamp,
        "audio_file": audio_file,
        "text": transcript,
        "processing_time": processing_time or 0
    }
    
    with open(get_log_filename("asr_usage"), "a", encoding="utf-8") as f:
        f.write(json.dumps(log_entry) + "\n")


def log_tts_usage(voice_model, text, output_file=None, processing_time=None):
    """Log TTS (Text-to-Speech) usage to daily file in JSON format"""
    ensure_log_dir()
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    
    log_entry = {
        "timestamp": timestamp,
        "voice_id": voice_model,
        "text": text,
        "output_file": output_file,
        "processing_time": processing_time or 0
    }
    
    with open(get_log_filename("tts_usage"), "a", encoding="utf-8") as f:
        f.write(json.dumps(log_entry) + "\n")


def parse_log_file(log_type, date=None):
    """Parse a specific log file and return structured entries for expandable display"""
    if date is None:
        date = datetime.now().strftime('%Y-%m-%d')
    
    # Handle error logs specially
    if log_type == 'errors':
        log_file = LOG_DIR / f"errors_{date}.log"
    else:
        log_file = LOG_DIR / f"{log_type}_{date}.log"
    
    if not log_file.exists():
        return []
    
    entries = []
    try:
        with open(log_file, 'r') as f:
            for line in f:
                try:
                    entry = json.loads(line.strip())
                    
                    if log_type == 'llm_usage':
                        # Return structured data for expandable view
                        entries.append({
                            'type': 'llm_usage',
                            'timestamp': entry['timestamp'],
                            'model': entry['model'],
                            'personality': entry.get('personality', 'default'),
                            'voice_id': entry.get('voice_id'),
                            'runtime': entry['runtime'],
                            'system_message': entry['system_message'],
                            'user_prompt': entry['user_prompt'],
                            'llm_reply': entry['llm_reply'],
                            'id': f"{entry['timestamp']}_{entry['model']}"  # Unique ID for expansion
                        })
                        
                    elif log_type == 'asr_usage':
                        entries.append({
                            'type': 'asr_usage',
                            'timestamp': entry['timestamp'],
                            'processing_time': entry['processing_time'],
                            'text': entry['text'],
                            'id': f"{entry['timestamp']}_asr"
                        })
                        
                    elif log_type == 'tts_usage':
                        entries.append({
                            'type': 'tts_usage',
                            'timestamp': entry['timestamp'],
                            'voice_id': entry['voice_id'],
                            'processing_time': entry['processing_time'],
                            'text': entry['text'],
                            'id': f"{entry['timestamp']}_{entry['voice_id']}"
                        })
                        
                    elif log_type == 'penphin_mind':
                        entries.append({
                            'type': 'penphin_mind',
                            'timestamp': entry['timestamp'],
                            'total_time': entry['total_time'],
                            'original_prompt': entry['original_prompt'],
                            'final_synthesis': entry['final_synthesis'],
                            'logical_response': entry.get('logical_response', ''),
                            'creative_response': entry.get('creative_response', ''),
                            'id': f"{entry['timestamp']}_penphin"
                        })
                        
                    elif log_type == 'errors':
                        entries.append({
                            'type': 'errors',
                            'timestamp': entry['timestamp'],
                            'error_type': entry['type'],
                            'message': entry['message'],
                            'context': entry.get('context', {}),
                            'id': f"{entry['timestamp']}_error"
                        })
                        
                except json.JSONDecodeError:
                    continue
                    
    except Exception as e:
        print(f"Error parsing {log_type} log: {e}")
        return []
    
    # Return entries in reverse order (newest first)
    return entries[::-1]


def get_available_log_dates(log_type):
    """Get list of available dates for a specific log type"""
    dates = []
    
    # Handle error logs specially
    if log_type == 'errors':
        pattern = f"errors_*.log"
    else:
        pattern = f"{log_type}_*.log"
    
    for file in LOG_DIR.glob(pattern):
        # Extract date from filename
        if log_type == 'errors':
            match = re.match(r'errors_(\d{4}-\d{2}-\d{2})\.log', file.name)
        else:
            # Build the pattern dynamically without f-string
            pattern = log_type + r'_(\d{4}-\d{2}-\d{2})\.log'
            match = re.match(pattern, file.name)
        
        if match:
            dates.append(match.group(1))
    
    return sorted(dates, reverse=True)  # Most recent first


# -------- ERROR LOGGING -------- #
def log_error(error_type, error_message, context=None):
    """Log an error to a dedicated error log file"""
    error_file = LOG_DIR / f"errors_{datetime.now().strftime('%Y-%m-%d')}.log"
    
    timestamp = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
    log_entry = {
        "timestamp": timestamp,
        "type": error_type,
        "message": error_message,
        "context": context or {}
    }
    
    try:
        # Append to error log file
        with open(error_file, 'a') as f:
            f.write(json.dumps(log_entry) + '\n')
    except Exception as e:
        print(f"Failed to log error: {e}")


def get_recent_errors(limit=50):
    """Get the most recent errors from today's log"""
    error_file = LOG_DIR / f"errors_{datetime.now().strftime('%Y-%m-%d')}.log"
    errors = []
    
    if error_file.exists():
        try:
            with open(error_file, 'r') as f:
                for line in f:
                    try:
                        errors.append(json.loads(line.strip()))
                    except:
                        pass
        except Exception as e:
            print(f"Error reading error log: {e}")
    
    # Return most recent errors first
    return errors[-limit:][::-1]


def get_error_log_dates():
    """Get list of dates that have error logs"""
    dates = []
    for file in LOG_DIR.glob("errors_*.log"):
        match = re.match(r'errors_(\d{4}-\d{2}-\d{2})\.log', file.name)
        if match:
            dates.append(match.group(1))
    return sorted(dates, reverse=True)  # Most recent first 