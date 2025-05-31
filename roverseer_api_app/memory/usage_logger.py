import json
import re
from datetime import datetime
from pathlib import Path

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


def log_llm_usage(model_name, system_message, user_prompt, response, processing_time=None):
    """Log LLM usage to daily file"""
    ensure_log_dir()
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    
    with open(get_log_filename("llm_usage"), "a", encoding="utf-8") as f:
        f.write(f"[ {model_name} - {timestamp}, {system_message}\n")
        f.write(f"  User: {user_prompt}\n")
        f.write(f"  {model_name}: {response}")
        if processing_time:
            f.write(f" [{processing_time:.2f}s]")
        f.write("\n--\n\n")


def log_penphin_mind_usage(logical_model, creative_model, convergence_model, 
                          system_message, user_prompt, 
                          logical_response, logical_time,
                          creative_response, creative_time,
                          convergence_response, convergence_time):
    """Log PenphinMind bicameral flow to daily file"""
    ensure_log_dir()
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    total_time = logical_time + creative_time + convergence_time
    
    with open(get_log_filename("penphin_mind"), "a", encoding="utf-8") as f:
        f.write(f"[ Logical: {logical_model}, Creative: {creative_model}, Convergence: {convergence_model}\n")
        f.write(f"  {timestamp}, {system_message}\n")
        f.write(f"  User: {user_prompt}\n")
        f.write(f"  \n\nLogical Agent's Reply: {logical_response} [{logical_time:.2f}s]\n")
        f.write(f"  \n\nCreative Agent's Reply: {creative_response} [{creative_time:.2f}s]\n")
        f.write(f"  \n\nConvergence Reply: {convergence_response} [{convergence_time:.2f}s]\n")
        f.write(f"  \n")
        f.write(f"  Total processing time = {total_time:.2f}s\n")
        f.write("]\n\n")


def log_asr_usage(audio_file, transcript, processing_time=None):
    """Log ASR (Automatic Speech Recognition) usage to daily file"""
    ensure_log_dir()
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    
    with open(get_log_filename("asr_usage"), "a", encoding="utf-8") as f:
        f.write(f"[ ASR - {timestamp}\n")
        f.write(f"  Audio: {audio_file}\n")
        f.write(f"  Transcript: {transcript}")
        if processing_time:
            f.write(f" [{processing_time:.2f}s]")
        f.write("\n--\n\n")


def log_tts_usage(voice_model, text, output_file=None, processing_time=None):
    """Log TTS (Text-to-Speech) usage to daily file"""
    ensure_log_dir()
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    
    with open(get_log_filename("tts_usage"), "a", encoding="utf-8") as f:
        f.write(f"[ TTS - {timestamp}\n")
        f.write(f"  Voice: {voice_model}\n")
        f.write(f"  Text: {text}\n")
        if output_file:
            f.write(f"  Output: {output_file}\n")
        if processing_time:
            f.write(f"  Processing time: {processing_time:.2f}s\n")
        f.write("--\n\n")


def get_available_log_dates(log_type):
    """Get list of available dates for a specific log type"""
    ensure_log_dir()
    dates = []
    
    # Look for files matching pattern: {log_type}_{date}.log
    pattern = f"{log_type}_*.log"
    for file in LOG_DIR.glob(pattern):
        # Extract date from filename
        match = re.search(r'(\d{4}-\d{2}-\d{2})\.log$', file.name)
        if match:
            dates.append(match.group(1))
    
    # Sort dates in reverse order (most recent first)
    dates.sort(reverse=True)
    return dates


def parse_log_file(log_type, limit=50, date=None):
    """Parse a log file and return recent entries"""
    if date:
        log_file = LOG_DIR / f"{log_type}_{date}.log"
    else:
        log_file = get_log_filename(log_type)
        
    if not log_file.exists():
        return []
    
    try:
        with open(log_file, "r", encoding="utf-8") as f:
            content = f.read()
        
        # Split entries based on log type
        if log_type == "penphin_mind":
            entries = content.split("]\n\n")
        else:
            entries = content.split("\n--\n")
        
        # Process entries
        parsed_entries = []
        for entry in entries[-limit:]:  # Get last 'limit' entries
            if entry.strip():
                parsed_entries.append(entry.strip())
        
        return list(reversed(parsed_entries))  # Most recent first
    except Exception as e:
        print(f"Error parsing {log_type} log: {e}")
        return [] 