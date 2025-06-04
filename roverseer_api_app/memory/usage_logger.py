import json
import re
from datetime import datetime
from pathlib import Path
import os

from config import LOG_DIR, STATS_FILE
from helpers.logging_helper import LoggingHelper

# Re-export logging functions from LoggingHelper for backward compatibility
ensure_log_dir = LoggingHelper.ensure_log_dir
get_log_filename = LoggingHelper.get_log_filename
log_error = LoggingHelper.log_error
log_asr_usage = LoggingHelper.log_asr_usage
log_tts_usage = LoggingHelper.log_tts_usage
log_penphin_mind_usage = LoggingHelper.log_penphin_mind_usage

# Enhanced LLM logging with mood data support
def log_llm_usage(model_name, system_message, user_prompt, response, processing_time=None, voice_id=None, personality=None, mood_data=None):
    """Enhanced LLM usage logging with mood data support"""
    return LoggingHelper.log_llm_usage(model_name, system_message, user_prompt, response, processing_time, voice_id, personality, mood_data)

# Voice training logging function
def log_training_event(voice_identity, event_type, data=None):
    """Log voice training events to a dedicated training log"""
    timestamp = datetime.now().isoformat()
    log_entry = {
        "timestamp": timestamp,
        "voice_identity": voice_identity,
        "event_type": event_type,
        "data": data or {}
    }
    
    ensure_log_dir()
    training_log = LOG_DIR / f"voice_training_{datetime.now().strftime('%Y-%m-%d')}.log"
    
    try:
        with open(training_log, 'a') as f:
            f.write(json.dumps(log_entry) + '\n')
    except Exception as e:
        print(f"Error logging training event: {e}")


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
                        # Extract tags from response if present
                        response_text = entry['llm_reply']
                        extracted_tags = {}
                        
                        try:
                            from cognition.contextual_moods import extract_tags_from_response
                            extracted_tags = extract_tags_from_response(response_text)
                        except:
                            extracted_tags = {"clean_response": response_text}
                        
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
                            'llm_reply': extracted_tags.get("clean_response", response_text),
                            'original_reply': response_text,
                            'mood_data': entry.get('mood_data', {}),
                            'extracted_personality': extracted_tags.get("personality"),
                            'extracted_mood': extracted_tags.get("mood"),
                            'has_tags': bool(extracted_tags.get("personality") or extracted_tags.get("mood")),
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