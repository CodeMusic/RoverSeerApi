"""
Workflow Tools - Cognitive Processing Components

Modular tools for the AgentWorkflow system that handle specific cognitive tasks:
- Clarification: CBT-informed intent clarification using ProtoConsciousness
- Search: Web information gathering via DuckDuckGo
- Summarization: MLX-powered content synthesis
- Sections: Research structure identification and content expansion
- Review: Quality assurance and final polishing

Each tool follows the workflow interface: function(input_data, context) -> output
"""

from .clarify import clarify_request, clarify_with_cbt
from .search import search_web_info, search_arxiv, search_academic
from .summarize import summarize_content, synthesize_findings
from .sections import identify_sections, write_sections, finalize_document, expand_research_sections

__all__ = [
    'clarify_request', 'clarify_with_cbt',
    'search_web_info', 'search_arxiv', 'search_academic',
    'summarize_content', 'synthesize_findings',
    'identify_sections', 'write_sections', 'finalize_document', 'expand_research_sections'
] 