"""
Research Workflow - Complete Academic Research Pipeline

A comprehensive research workflow that combines CBT-informed clarification,
web search, MLX-powered analysis, and structured academic writing to
produce high-quality research documents.

This workflow integrates:
- ProtoConsciousness for cognitive bias detection
- DuckDuckGo search for information gathering
- MLX models for content synthesis
- Academic structuring and formatting
"""

import logging
from typing import Dict, Any
from .agent_workflow_engine import AgentWorkflow
from .tools.clarify import clarify_request, auto_clarify_research_request
from .tools.search import search_web_info, search_academic
from .tools.summarize import summarize_content, synthesize_findings
from .tools.sections import identify_sections, write_sections, finalize_document

# Set up logger
workflow_logger = logging.getLogger("ResearchWorkflow")
workflow_logger.setLevel(logging.INFO)


def build_research_workflow(context: Dict[str, Any]) -> AgentWorkflow:
    """
    Build the complete research workflow with all cognitive processing steps.
    
    This creates a comprehensive research pipeline that processes a research
    query through cognitive clarification, information gathering, analysis,
    synthesis, and academic writing.
    
    Args:
        context: Workflow context containing models, ProtoConsciousness, and config
    
    Returns:
        AgentWorkflow: Configured research workflow ready for execution
    """
    workflow_logger.info("🔬 Building comprehensive research workflow...")
    
    # Create the main workflow
    workflow = AgentWorkflow("ComprehensiveResearch", context)
    
    # Step 1: Cognitive Clarification (CBT-informed)
    workflow.add_step(
        "Clarify Research Intent",
        auto_clarify_research_request,
        auto=True,
        retry_attempts=2
    )
    
    # Step 2: Information Gathering
    workflow.add_step(
        "Gather Information",
        search_web_info,
        auto=True,
        retry_attempts=3
    )
    
    # Step 3: Content Synthesis
    workflow.add_step(
        "Synthesize Findings",
        synthesize_findings,
        auto=True,
        retry_attempts=2
    )
    
    # Step 4: Structure Identification
    workflow.add_step(
        "Identify Document Structure",
        identify_sections,
        auto=True,
        retry_attempts=2
    )
    
    # Step 5: Content Expansion
    workflow.add_step(
        "Write Detailed Sections",
        write_sections,
        auto=True,
        retry_attempts=2
    )
    
    # Step 6: Final Review and Polish
    workflow.add_step(
        "Finalize Document",
        finalize_document,
        auto=True,
        retry_attempts=1
    )
    
    workflow_logger.info("✅ Research workflow built with 6 cognitive processing steps")
    return workflow


def build_quick_research_workflow(context: Dict[str, Any]) -> AgentWorkflow:
    """
    Build a streamlined research workflow for faster processing.
    
    This creates a simplified version of the research workflow that
    focuses on core functionality while maintaining quality.
    
    Args:
        context: Workflow context
    
    Returns:
        AgentWorkflow: Quick research workflow
    """
    workflow_logger.info("⚡ Building quick research workflow...")
    
    workflow = AgentWorkflow("QuickResearch", context)
    
    # Streamlined steps
    workflow.add_step("Clarify Intent", clarify_request, auto=True)
    workflow.add_step("Search Information", search_web_info, auto=True)
    workflow.add_step("Summarize Content", summarize_content, auto=True)
    async def structure_and_write(data, ctx):
        sections = await identify_sections(data, ctx)
        return await write_sections(sections, ctx)
    workflow.add_step("Structure & Write", structure_and_write, auto=True)
    
    workflow_logger.info("✅ Quick research workflow built with 4 steps")
    return workflow


def build_academic_research_workflow(context: Dict[str, Any]) -> AgentWorkflow:
    """
    Build an enhanced academic research workflow with scholarly rigor.
    
    This creates an advanced workflow optimized for academic research
    with enhanced citation support, methodology sections, and rigorous analysis.
    
    Args:
        context: Workflow context
    
    Returns:
        AgentWorkflow: Academic research workflow
    """
    workflow_logger.info("🎓 Building academic research workflow...")
    
    # Set academic context parameters
    context.update({
        "academic_focus": True,
        "academic_level": "graduate",
        "citation_style": "academic",
        "summary_target_length": "comprehensive",
        "advanced_expansion": True
    })
    
    workflow = AgentWorkflow("AcademicResearch", context)
    
    # Enhanced academic steps
    workflow.add_step(
        "CBT-Informed Clarification",
        lambda data, ctx: auto_clarify_research_request(data, ctx),
        auto=True,
        retry_attempts=2
    )
    
    workflow.add_step(
        "Academic Information Gathering", 
        search_academic,
        auto=True,
        retry_attempts=3
    )
    
    workflow.add_step(
        "Scholarly Synthesis",
        synthesize_findings,
        auto=True,
        retry_attempts=2
    )
    
    workflow.add_step(
        "Academic Structure Design",
        identify_sections,
        auto=True,
        retry_attempts=2
    )
    
    workflow.add_step(
        "Scholarly Content Development",
        write_sections,
        auto=True,
        retry_attempts=2
    )
    
    workflow.add_step(
        "Academic Review & Publication Prep",
        finalize_document,
        auto=True,
        retry_attempts=1
    )
    
    workflow_logger.info("✅ Academic research workflow built with enhanced scholarly features")
    return workflow


def build_creative_research_workflow(context: Dict[str, Any]) -> AgentWorkflow:
    """
    Build a creative research workflow for innovative and exploratory research.
    
    This workflow emphasizes creative thinking, broad exploration,
    and innovative connections between ideas.
    
    Args:
        context: Workflow context
    
    Returns:
        AgentWorkflow: Creative research workflow
    """
    workflow_logger.info("🎨 Building creative research workflow...")
    
    # Set creative context parameters
    context.update({
        "academic_focus": False,
        "cognitive_preset": "creative",
        "emotional_preset": "curious",
        "search_scope": "broad",
        "summary_target_length": "exploratory"
    })
    
    workflow = AgentWorkflow("CreativeResearch", context)
    
    # Creative-focused steps
    workflow.add_step(
        "Creative Intent Exploration",
        lambda data, ctx: auto_clarify_research_request(data, ctx),
        auto=True
    )
    
    workflow.add_step(
        "Broad Information Discovery",
        search_web_info,
        auto=True
    )
    
    workflow.add_step(
        "Innovative Synthesis",
        synthesize_findings,
        auto=True
    )
    
    workflow.add_step(
        "Creative Structure Design",
        identify_sections,
        auto=True
    )
    
    workflow.add_step(
        "Expressive Content Creation",
        write_sections,
        auto=True
    )
    
    workflow.add_step(
        "Creative Polish",
        finalize_document,
        auto=True
    )
    
    workflow_logger.info("✅ Creative research workflow built with innovative focus")
    return workflow


def build_technical_research_workflow(context: Dict[str, Any]) -> AgentWorkflow:
    """
    Build a technical research workflow for scientific and technical topics.
    
    This workflow is optimized for technical accuracy, methodological rigor,
    and precise analysis of scientific information.
    
    Args:
        context: Workflow context
    
    Returns:
        AgentWorkflow: Technical research workflow
    """
    workflow_logger.info("🔬 Building technical research workflow...")
    
    # Set technical context parameters
    context.update({
        "academic_focus": True,
        "cognitive_preset": "analytical",
        "emotional_preset": "calm",
        "technical_focus": True,
        "precision_mode": True
    })
    
    workflow = AgentWorkflow("TechnicalResearch", context)
    
    # Technical-focused steps
    workflow.add_step(
        "Technical Specification Clarification",
        auto_clarify_research_request,
        auto=True,
        retry_attempts=2
    )
    
    workflow.add_step(
        "Technical Literature Search",
        search_academic,
        auto=True,
        retry_attempts=3
    )
    
    workflow.add_step(
        "Technical Analysis & Synthesis",
        synthesize_findings,
        auto=True,
        retry_attempts=2
    )
    
    workflow.add_step(
        "Technical Document Structure",
        identify_sections,
        auto=True,
        retry_attempts=2
    )
    
    workflow.add_step(
        "Technical Content Development",
        write_sections,
        auto=True,
        retry_attempts=2
    )
    
    workflow.add_step(
        "Technical Review & Validation",
        finalize_document,
        auto=True,
        retry_attempts=1
    )
    
    workflow_logger.info("✅ Technical research workflow built with scientific rigor")
    return workflow


def create_research_context(
    model=None, 
    tokenizer=None, 
    proto_ai=None,
    generate_with_fallback=None,
    **kwargs
) -> Dict[str, Any]:
    """
    Create a properly configured context for research workflows.
    
    This helper function sets up the context dictionary with all necessary
    components for the research workflow to function properly.
    
    Args:
        model: MLX or other language model for generation
        tokenizer: Model tokenizer (optional)
        proto_ai: ProtoConsciousness instance for CBT clarification
        generate_with_fallback: Function for text generation with fallbacks
        **kwargs: Additional context parameters
    
    Returns:
        Dict: Configured workflow context
    """
    workflow_logger.info("🧠 Creating research workflow context...")
    
    context = {
        # Core components
        "model": model,
        "tokenizer": tokenizer,
        "proto_ai": proto_ai,
        
        # Generation function (most important for integration)
        "generate_with_fallback": generate_with_fallback,
        
        # Search parameters
        "search_max_results": 10,
        "arxiv_max_results": 5,
        "search_region": "en-us",
        "search_safesearch": "moderate",
        
        # Academic parameters
        "academic_focus": True,
        "academic_level": "graduate",
        "citation_style": "academic",
        
        # Processing parameters
        "summary_target_length": "comprehensive",
        "advanced_expansion": False,
        "technical_focus": False,
        "precision_mode": False,
        
        # Workflow tracking
        "workflow_steps": [],
        "workflow_metadata": {},
        
        # Additional parameters
        **kwargs
    }
    
    # Import and create ProtoConsciousness if not provided
    if not proto_ai:
        try:
            from .proto_consciousness import ProtoConsciousness
            context["proto_ai"] = ProtoConsciousness()
            workflow_logger.info("🧘 Created new ProtoConsciousness instance")
        except ImportError:
            workflow_logger.warning("⚠️ ProtoConsciousness not available")
    
    workflow_logger.info("✅ Research context created successfully")
    return context


async def run_research_workflow(
    research_query: str,
    workflow_type: str = "comprehensive",
    context: Dict[str, Any] = None,
    **context_kwargs
) -> str:
    """
    Run a complete research workflow with the specified query.
    
    This is a convenience function that sets up the context, builds the
    appropriate workflow, and executes it with the given research query.
    
    Args:
        research_query: The research question or topic to investigate
        workflow_type: Type of workflow ('comprehensive', 'quick', 'academic', 'creative', 'technical')
        context: Pre-configured context (optional)
        **context_kwargs: Additional context parameters
    
    Returns:
        str: Complete research document
    """
    workflow_logger.info(f"🚀 Starting {workflow_type} research workflow...")
    
    # Create context if not provided
    if context is None:
        context = create_research_context(**context_kwargs)
    else:
        # Update context with additional parameters
        context.update(context_kwargs)
    
    # Build appropriate workflow
    if workflow_type == "comprehensive":
        workflow = build_research_workflow(context)
    elif workflow_type == "quick":
        workflow = build_quick_research_workflow(context)
    elif workflow_type == "academic":
        workflow = build_academic_research_workflow(context)
    elif workflow_type == "creative":
        workflow = build_creative_research_workflow(context)
    elif workflow_type == "technical":
        workflow = build_technical_research_workflow(context)
    else:
        workflow_logger.warning(f"⚠️ Unknown workflow type '{workflow_type}', using comprehensive")
        workflow = build_research_workflow(context)
    
    # Execute the workflow
    try:
        result = await workflow.run(research_query)
        
        # Log completion
        performance_metrics = workflow.get_performance_metrics()
        workflow_logger.info(
            f"🎉 Research workflow completed successfully! "
            f"Total executions: {performance_metrics['workflow_metadata']['total_executions']}, "
            f"Success rate: {performance_metrics['workflow_metadata']['successful_executions']}/{performance_metrics['workflow_metadata']['total_executions']}"
        )
        
        return result
        
    except Exception as e:
        workflow_logger.error(f"❌ Research workflow failed: {str(e)}")
        raise


# Workflow templates for specific research domains

def build_psychology_research_workflow(context: Dict[str, Any]) -> AgentWorkflow:
    """Build a workflow optimized for psychology research with CBT awareness"""
    
    context.update({
        "academic_focus": True,
        "emotional_preset": "empathetic", 
        "cognitive_preset": "balanced",
        "research_domain": "psychology",
        "cbt_enhanced": True
    })
    
    return build_academic_research_workflow(context)


def build_technology_research_workflow(context: Dict[str, Any]) -> AgentWorkflow:
    """Build a workflow optimized for technology and computer science research"""
    
    context.update({
        "academic_focus": True,
        "cognitive_preset": "analytical",
        "emotional_preset": "calm",
        "research_domain": "technology",
        "technical_focus": True
    })
    
    return build_technical_research_workflow(context)


def build_business_research_workflow(context: Dict[str, Any]) -> AgentWorkflow:
    """Build a workflow optimized for business and management research"""
    
    context.update({
        "academic_focus": False,
        "cognitive_preset": "analytical",
        "emotional_preset": "curious",
        "research_domain": "business",
        "practical_focus": True
    })
    
    return build_research_workflow(context)


def build_medical_research_workflow(context: Dict[str, Any]) -> AgentWorkflow:
    """Build a workflow optimized for medical and health research"""
    
    context.update({
        "academic_focus": True,
        "cognitive_preset": "analytical",
        "emotional_preset": "calm",
        "research_domain": "medical",
        "precision_mode": True,
        "evidence_based": True
    })
    
    return build_technical_research_workflow(context)


# Workflow registry for easy access
WORKFLOW_REGISTRY = {
    "comprehensive": build_research_workflow,
    "quick": build_quick_research_workflow,
    "academic": build_academic_research_workflow,
    "creative": build_creative_research_workflow,
    "technical": build_technical_research_workflow,
    "psychology": build_psychology_research_workflow,
    "technology": build_technology_research_workflow,
    "business": build_business_research_workflow,
    "medical": build_medical_research_workflow
}


def get_available_workflows() -> Dict[str, str]:
    """Get a list of all available workflow types with descriptions"""
    
    return {
        "comprehensive": "Complete research workflow with all steps and CBT awareness",
        "quick": "Streamlined workflow for faster processing with core functionality",
        "academic": "Enhanced workflow for scholarly research with citation support",
        "creative": "Innovative workflow emphasizing creative thinking and broad exploration",
        "technical": "Scientific workflow for technical accuracy and methodological rigor",
        "psychology": "Specialized workflow for psychology research with CBT enhancement",
        "technology": "Optimized workflow for computer science and technology research",
        "business": "Business-focused workflow for management and organizational research",
        "medical": "Medical research workflow with evidence-based precision"
    }


def build_workflow_by_name(workflow_name: str, context: Dict[str, Any]) -> AgentWorkflow:
    """
    Build a workflow by name using the workflow registry.
    
    Args:
        workflow_name: Name of the workflow to build
        context: Workflow context
    
    Returns:
        AgentWorkflow: Built workflow
    
    Raises:
        ValueError: If workflow name is not recognized
    """
    if workflow_name not in WORKFLOW_REGISTRY:
        available = ", ".join(WORKFLOW_REGISTRY.keys())
        raise ValueError(f"Unknown workflow '{workflow_name}'. Available: {available}")
    
    return WORKFLOW_REGISTRY[workflow_name](context) 