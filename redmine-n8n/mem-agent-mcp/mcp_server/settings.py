# Primary memory agent model (env wins, defaults to mem-agent-mlx)
import os
MEMORY_AGENT_NAME = os.getenv("MEM_AGENT_MODEL", "mem-agent-mlx")

# MLX model names (still defined for compatibility but not forced)
MLX_4BIT_MEMORY_AGENT_NAME = "mem-agent-mlx"
MLX_8BIT_MEMORY_AGENT_NAME = "mem-agent-mlx-8bit"
MLX_MEMORY_AGENT_NAME      = os.getenv("LMSTUDIO_MODEL", MEMORY_AGENT_NAME)

# Default fallback (kept for backwards compatibility, but points to the main model)
DEFAULT_MLX_MEMORY_AGENT_NAME = MLX_MEMORY_AGENT_NAME
