"""
Agent Workflow System - Psychologically-Aware Task Engine

A modular, CBT-informed workflow engine that chains AI cognitive processes
for complex research and analysis tasks. Built for the Silicon Server
cognitive architecture.
"""

from .agent_workflow_engine import AgentWorkflow
from .research_workflow import build_research_workflow

__all__ = ['AgentWorkflow', 'build_research_workflow'] 