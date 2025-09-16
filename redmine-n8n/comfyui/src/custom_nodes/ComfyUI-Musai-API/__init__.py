# __init__.py
import traceback

NODE_CLASS_MAPPINGS = {}
NODE_DISPLAY_NAME_MAPPINGS = {}

try:
    from .musai_api_nodes import NODE_CLASS_MAPPINGS as _M, NODE_DISPLAY_NAME_MAPPINGS as _DM
    NODE_CLASS_MAPPINGS.update(_M)
    NODE_DISPLAY_NAME_MAPPINGS.update(_DM)
except Exception as e:
    print("[ComfyUI-Musai-API] Failed to import:", e)
    traceback.print_exc()

def get_category():
    return "Audio • Musai API"
