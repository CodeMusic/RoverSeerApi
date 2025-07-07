"""
Summarization Tools - MLX-Powered Content Synthesis

Uses MLX-accelerated language models to synthesize and summarize information
gathered during research workflows. Provides intelligent content condensation
while preserving key insights and maintaining academic rigor.
"""

import logging
import time
from typing import Any, Dict, List
from datetime import datetime

# Set up logger
summarize_logger = logging.getLogger("WorkflowTools.Summarize")
summarize_logger.setLevel(logging.INFO)


async def summarize_content(input_data: Any, context: Dict) -> str:
    """
    Summarize content using MLX-accelerated language models.
    
    This is the primary summarization tool that processes search results,
    articles, or other content into concise, coherent summaries.
    
    Args:
        input_data: Content to summarize (list of search results, text, etc.)
        context: Workflow context containing MLX model and other resources
    
    Returns:
        str: Comprehensive summary of the input content
    """
    summarize_logger.info("🧠 Starting MLX-powered content summarization...")
    
    try:
        # Extract content text from various input formats
        if isinstance(input_data, list):
            # Handle search results
            content_text = _extract_text_from_results(input_data)
            summarize_logger.info(f"📄 Extracted text from {len(input_data)} search results")
        elif isinstance(input_data, str):
            content_text = input_data
        else:
            content_text = str(input_data)
        
        # Check if we have sufficient content
        if len(content_text.strip()) < 50:
            summarize_logger.warning("⚠️ Insufficient content for meaningful summarization")
            return "Insufficient content provided for summarization."
        
        # Prepare summarization prompt
        summary_prompt = _create_summarization_prompt(content_text, context)
        
        # Get MLX model for generation
        model_response = await _generate_with_mlx_model(summary_prompt, context)
        
        # Process and enhance the summary
        enhanced_summary = _enhance_summary(model_response, content_text, context)
        
        # Update context with summarization metadata
        context.update({
            "summarization_performed": True,
            "original_content_length": len(content_text),
            "summary_length": len(enhanced_summary),
            "compression_ratio": len(enhanced_summary) / len(content_text),
            "summarization_timestamp": datetime.now().isoformat()
        })
        
        summarize_logger.info(f"✅ Summarization completed: {len(content_text)} → {len(enhanced_summary)} chars "
                             f"(compression: {(len(enhanced_summary) / len(content_text)):.2f})")
        
        return enhanced_summary
        
    except Exception as e:
        summarize_logger.error(f"❌ Summarization failed: {str(e)}")
        # Return a basic summary on failure
        return _create_fallback_summary(input_data)


async def synthesize_findings(input_data: Any, context: Dict) -> str:
    """
    Synthesize research findings from multiple sources with critical analysis.
    
    This tool goes beyond simple summarization to provide analytical synthesis
    that identifies patterns, contradictions, and insights across sources.
    
    Args:
        input_data: Research findings to synthesize
        context: Workflow context
    
    Returns:
        str: Analytical synthesis of findings
    """
    summarize_logger.info("🔬 Starting research findings synthesis...")
    
    try:
        # Process input data
        if isinstance(input_data, list):
            content_text = _extract_text_from_results(input_data)
            source_count = len(input_data)
        else:
            content_text = str(input_data)
            source_count = 1
        
        # Create synthesis prompt with analytical focus
        synthesis_prompt = _create_synthesis_prompt(content_text, context, source_count)
        
        # Generate synthesis using MLX model
        synthesis_response = await _generate_with_mlx_model(synthesis_prompt, context)
        
        # Enhance synthesis with meta-analysis
        enhanced_synthesis = _enhance_synthesis(synthesis_response, content_text, context)
        
        # Update context
        context.update({
            "synthesis_performed": True,
            "sources_synthesized": source_count,
            "synthesis_length": len(enhanced_synthesis),
            "synthesis_timestamp": datetime.now().isoformat()
        })
        
        summarize_logger.info(f"✅ Synthesis completed: {source_count} sources → {len(enhanced_synthesis)} chars")
        
        return enhanced_synthesis
        
    except Exception as e:
        summarize_logger.error(f"❌ Synthesis failed: {str(e)}")
        return _create_fallback_synthesis(input_data)


def _extract_text_from_results(results: List[Dict]) -> str:
    """Extract and combine text content from search results"""
    
    combined_text = ""
    
    for i, result in enumerate(results):
        # Extract title
        title = result.get("title", "")
        if title:
            combined_text += f"\n\n=== Source {i+1}: {title} ===\n"
        
        # Extract main content
        content_fields = ["snippet", "abstract", "body", "content", "text"]
        content = ""
        
        for field in content_fields:
            if field in result and result[field]:
                content = result[field]
                break
        
        if content:
            combined_text += content + "\n"
        
        # Add URL for reference
        url = result.get("url", "")
        if url:
            combined_text += f"Source: {url}\n"
    
    return combined_text.strip()


def _create_summarization_prompt(content: str, context: Dict) -> str:
    """Create an optimized prompt for content summarization"""
    
    # Get summarization preferences from context
    academic_focus = context.get("academic_focus", True)
    target_length = context.get("summary_target_length", "comprehensive")
    research_topic = context.get("original_request", "the research topic")
    
    prompt = f"""
Please provide a comprehensive summary of the following research content about {research_topic}.

Content to summarize:
{content[:4000]}

Requirements:
- Create a {target_length} summary that captures the essential information
- {"Focus on academic rigor and scholarly findings" if academic_focus else "Focus on practical and accessible insights"}
- Organize information logically with clear sections
- Preserve important details, statistics, and key findings
- Note any contradictions or debates in the literature
- Maintain an objective, scholarly tone

Please structure your summary with clear headings and bullet points where appropriate.
"""
    
    return prompt


def _create_synthesis_prompt(content: str, context: Dict, source_count: int) -> str:
    """Create a prompt for analytical synthesis of research findings"""
    
    research_topic = context.get("original_request", "the research topic")
    
    prompt = f"""
Please provide an analytical synthesis of research findings about {research_topic} from {source_count} sources.

Research content to synthesize:
{content[:4000]}

Requirements for synthesis:
1. CONVERGENT FINDINGS: Identify areas where sources agree
2. DIVERGENT FINDINGS: Highlight contradictions or debates
3. PATTERNS & TRENDS: Note recurring themes or patterns
4. EVIDENCE QUALITY: Assess the strength of evidence presented
5. GAPS & LIMITATIONS: Identify what's missing or understudied
6. IMPLICATIONS: Discuss practical and theoretical implications
7. FUTURE DIRECTIONS: Suggest areas for further research

Please provide a critical analysis that goes beyond simple summarization to offer genuine intellectual synthesis of the findings.

Structure your synthesis with clear sections and provide specific examples from the sources.
"""
    
    return prompt


async def _generate_with_mlx_model(prompt: str, context: Dict) -> str:
    """Generate text using MLX model with fallback options"""
    
    try:
        # Check for generation function in context (from the main server)
        if "generate_with_fallback" in context:
            summarize_logger.info("🔥 Using MLX/Ollama generation from context...")
            return await context["generate_with_fallback"](prompt)
        
        # Check for direct model access
        elif "model" in context and hasattr(context["model"], "generate"):
            summarize_logger.info("🔥 Using direct MLX model access...")
            
            model = context["model"]
            start_time = time.time()
            response = model.generate(prompt, max_tokens=1024)
            generation_time = time.time() - start_time
            
            summarize_logger.info(f"🔥 MLX generation completed in {generation_time:.2f}s")
            return response
            
        else:
            summarize_logger.warning("⚠️ No MLX model available, using basic processing...")
            return _create_basic_summary(prompt)
            
    except Exception as e:
        summarize_logger.error(f"❌ MLX generation failed: {str(e)}")
        return _create_basic_summary(prompt)


def _enhance_summary(summary: str, original_content: str, context: Dict) -> str:
    """Enhance the generated summary with additional processing"""
    
    enhanced = summary
    
    # Add meta information
    word_count = len(original_content.split())
    summary_word_count = len(summary.split())
    
    meta_info = f"""

[Summary Metadata]
- Original content: ~{word_count} words
- Summary: ~{summary_word_count} words
- Compression ratio: {(summary_word_count / word_count):.1%}
- Generated: {datetime.now().strftime('%Y-%m-%d %H:%M')}
"""
    
    # Add ProtoConsciousness insights if available
    if "proto_ai" in context:
        proto = context["proto_ai"]
        consciousness_summary = proto.get_consciousness_summary()
        
        if consciousness_summary["metacognitive_insights_count"] > 0:
            meta_info += f"\n- Cognitive bias screening: {consciousness_summary['metacognitive_insights_count']} insights applied"
    
    enhanced += meta_info
    
    return enhanced


def _enhance_synthesis(synthesis: str, original_content: str, context: Dict) -> str:
    """Enhance the research synthesis with additional analysis"""
    
    enhanced = synthesis
    
    # Add synthesis quality indicators
    quality_metrics = f"""

[Synthesis Quality Indicators]
- Sources integrated: {context.get('sources_synthesized', 'Unknown')}
- Content analyzed: ~{len(original_content.split())} words
- Analysis depth: {'Advanced' if len(synthesis) > 1000 else 'Standard'}
- Critical analysis: {'Applied' if any(term in synthesis.lower() for term in ['however', 'contradicts', 'suggests', 'indicates']) else 'Basic'}
- Generated: {datetime.now().strftime('%Y-%m-%d %H:%M')}
"""
    
    enhanced += quality_metrics
    
    return enhanced


def _create_fallback_summary(input_data: Any) -> str:
    """Create a basic fallback summary when advanced processing fails"""
    
    if isinstance(input_data, list):
        return f"Summary of {len(input_data)} research sources: Content processing encountered technical difficulties. Basic information extraction shows multiple sources were found but detailed analysis could not be completed. Please try again or use alternative processing methods."
    else:
        content = str(input_data)
        return f"Content summary: {content[:200]}{'...' if len(content) > 200 else ''} [Note: Advanced summarization unavailable, showing excerpt only]"


def _create_fallback_synthesis(input_data: Any) -> str:
    """Create a basic fallback synthesis when advanced processing fails"""
    
    return "Research synthesis: Technical difficulties prevented detailed analysis of the provided sources. Multiple research findings were identified but could not be properly synthesized. This may be due to model availability or processing constraints. Consider retrying the analysis or using alternative synthesis approaches."


def _create_basic_summary(prompt: str) -> str:
    """Create a very basic summary when no ML models are available"""
    
    return """Basic summary generated without advanced language models:

The content appears to be research-related material that would benefit from detailed analysis. However, advanced summarization capabilities are currently unavailable.

Key points that can be extracted:
- Multiple sources of information were provided
- The content appears to be academic or research-oriented
- Detailed analysis would require MLX model access

For comprehensive summarization, please ensure MLX models are properly configured and available.""" 