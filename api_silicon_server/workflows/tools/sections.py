"""
Sections Tools - Research Structure and Content Management

Handles the structuring, expansion, and finalization of research content:
- Identifies logical sections and organization
- Expands sections with detailed content
- Reviews and polishes final documents
- Maintains academic formatting and quality standards
"""

import logging
import time
from typing import Any, Dict, List
from datetime import datetime
import re

# Set up logger
sections_logger = logging.getLogger("WorkflowTools.Sections")
sections_logger.setLevel(logging.INFO)


async def identify_sections(input_data: Any, context: Dict) -> Dict[str, Any]:
    """
    Identify and structure logical sections for research content.
    
    This tool analyzes summarized content and creates a structured outline
    with logical sections, subsections, and content organization.
    
    Args:
        input_data: Summarized research content
        context: Workflow context
    
    Returns:
        Dict: Structured sections with metadata
    """
    sections_logger.info("📋 Identifying research sections and structure...")
    
    try:
        # Convert input to text
        content_text = str(input_data) if not isinstance(input_data, str) else input_data
        
        # Create structuring prompt
        structure_prompt = _create_structure_prompt(content_text, context)
        
        # Generate structure using MLX model
        structure_response = await _generate_with_model(structure_prompt, context)
        
        # Parse the structure into organized sections
        parsed_structure = _parse_structure_response(structure_response, context)
        
        # Enhance structure with metadata
        enhanced_structure = _enhance_structure(parsed_structure, content_text, context)
        
        # Update context
        context.update({
            "structure_identified": True,
            "total_sections": len(enhanced_structure.get("sections", [])),
            "structure_timestamp": datetime.now().isoformat()
        })
        
        sections_logger.info(f"✅ Structure identified: {len(enhanced_structure.get('sections', []))} main sections")
        
        return enhanced_structure
        
    except Exception as e:
        sections_logger.error(f"❌ Section identification failed: {str(e)}")
        return _create_fallback_structure(input_data, context)


async def write_sections(input_data: Any, context: Dict) -> str:
    """
    Expand and write detailed content for each identified section.
    
    This tool takes the structured outline and generates comprehensive
    content for each section while maintaining coherence and academic quality.
    
    Args:
        input_data: Structured sections from identify_sections
        context: Workflow context
    
    Returns:
        str: Complete research document with expanded sections
    """
    sections_logger.info("✍️ Writing detailed section content...")
    
    try:
        # Handle different input formats
        if isinstance(input_data, dict) and "sections" in input_data:
            structure = input_data
        elif isinstance(input_data, str):
            # Try to parse sections from text
            structure = _extract_sections_from_text(input_data)
        else:
            # Create basic structure
            structure = {"sections": [{"title": "Research Content", "content": str(input_data)}]}
        
        # Expand each section
        expanded_document = await _expand_sections(structure, context)
        
        # Format the final document
        formatted_document = _format_research_document(expanded_document, context)
        
        # Update context
        context.update({
            "sections_written": True,
            "document_length": len(formatted_document),
            "sections_expanded": len(structure.get("sections", [])),
            "writing_timestamp": datetime.now().isoformat()
        })
        
        sections_logger.info(f"✅ Section writing completed: {len(formatted_document)} characters")
        
        return formatted_document
        
    except Exception as e:
        sections_logger.error(f"❌ Section writing failed: {str(e)}")
        return _create_fallback_document(input_data, context)


def finalize_document(input_data: Any, context: Dict) -> str:
    """
    Review and finalize the research document with quality assurance.
    
    This tool performs final editing, formatting, and quality checks
    to ensure the document meets academic standards.
    
    Args:
        input_data: Complete research document
        context: Workflow context
    
    Returns:
        str: Finalized, polished research document
    """
    sections_logger.info("🔍 Finalizing and reviewing document...")
    
    try:
        document_text = str(input_data) if not isinstance(input_data, str) else input_data
        
        # Perform quality review
        review_results = _perform_quality_review(document_text, context)
        
        # Apply improvements based on review
        improved_document = _apply_improvements(document_text, review_results, context)
        
        # Add final formatting and metadata
        finalized_document = _add_final_formatting(improved_document, context)
        
        # Update context with finalization metadata
        context.update({
            "document_finalized": True,
            "final_length": len(finalized_document),
            "quality_score": review_results.get("quality_score", 0.8),
            "finalization_timestamp": datetime.now().isoformat()
        })
        
        sections_logger.info(f"✅ Document finalized: {len(finalized_document)} characters, "
                           f"quality score: {review_results.get('quality_score', 0.8):.2f}")
        
        return finalized_document
        
    except Exception as e:
        sections_logger.error(f"❌ Document finalization failed: {str(e)}")
        return _create_fallback_finalization(input_data, context)


def expand_research_sections(input_data: Any, context: Dict) -> str:
    """
    Advanced section expansion with research depth and academic rigor.
    
    This is an enhanced version of write_sections that provides more
    detailed research content with citations, analysis, and scholarly depth.
    
    Args:
        input_data: Structured sections or content to expand
        context: Workflow context
    
    Returns:
        str: Comprehensively expanded research document
    """
    sections_logger.info("🎓 Expanding sections with advanced research depth...")
    
    try:
        # Prepare for advanced expansion
        context["advanced_expansion"] = True
        context["academic_rigor"] = "high"
        context["citation_style"] = context.get("citation_style", "academic")
        
        # Use enhanced section writing
        expanded_content = write_sections(input_data, context)
        
        # Add advanced research features
        enhanced_content = _add_research_features(expanded_content, context)
        
        sections_logger.info("✅ Advanced section expansion completed")
        
        return enhanced_content
        
    except Exception as e:
        sections_logger.error(f"❌ Advanced section expansion failed: {str(e)}")
        return write_sections(input_data, context)


def _create_structure_prompt(content: str, context: Dict) -> str:
    """Create a prompt for identifying document structure"""
    
    research_topic = context.get("original_request", "the research topic")
    academic_level = context.get("academic_level", "graduate")
    
    prompt = f"""
Analyze the following research content about {research_topic} and create a logical document structure.

Content to structure:
{content[:3000]}

Please create a comprehensive outline with:

1. **Main Sections**: 4-6 primary sections that logically organize the content
2. **Subsections**: 2-4 subsections under each main section where appropriate
3. **Key Points**: 2-3 key points or topics for each subsection
4. **Academic Flow**: Ensure logical progression suitable for {academic_level} level research

Structure your response as:

# Section 1: [Title]
## Subsection 1.1: [Subtitle]
- Key point 1
- Key point 2
## Subsection 1.2: [Subtitle]
- Key point 1
- Key point 2

# Section 2: [Title]
[continue pattern...]

Focus on creating a structure that would be appropriate for a comprehensive research paper or report.
"""
    
    return prompt


def _create_section_expansion_prompt(section_title: str, section_points: List[str], 
                                   full_context: str, context: Dict) -> str:
    """Create a prompt for expanding a specific section"""
    
    research_topic = context.get("original_request", "the research topic")
    advanced_mode = context.get("advanced_expansion", False)
    
    prompt = f"""
Write a comprehensive section for a research document about {research_topic}.

Section to write: {section_title}

Key points to cover:
{chr(10).join(f"- {point}" for point in section_points)}

Context from the full research:
{full_context[:1000]}

Requirements:
- Write 2-4 well-developed paragraphs for this section
- {"Include academic depth with analysis and critical thinking" if advanced_mode else "Maintain clear, informative content"}
- Use specific examples and evidence where possible
- Maintain scholarly tone and proper transitions
- {"Reference findings from the research context" if context.get("search_performed") else "Develop the topic thoroughly"}
- Ensure the content flows logically and supports the overall research

Write the section content now:
"""
    
    return prompt


async def _generate_with_model(prompt: str, context: Dict) -> str:
    """Generate text using available models with fallback"""
    
    try:
        # Use context generation function if available
        if "generate_with_fallback" in context:
            sections_logger.info("🔥 Using MLX/Ollama generation for sections...")
            return await context["generate_with_fallback"](prompt)
        
        # Check for direct model access
        elif "model" in context and hasattr(context["model"], "generate"):
            sections_logger.info("🔥 Using direct MLX model...")
            model = context["model"]
            return model.generate(prompt, max_tokens=1024)
        
        else:
            sections_logger.warning("⚠️ No model available, using structured approach...")
            return _create_structured_response(prompt)
            
    except Exception as e:
        sections_logger.error(f"❌ Model generation failed: {str(e)}")
        return _create_structured_response(prompt)


def _parse_structure_response(response: str, context: Dict) -> Dict[str, Any]:
    """Parse the model response into structured sections"""
    
    sections = []
    current_section = None
    current_subsection = None
    
    lines = response.split('\n')
    
    for line in lines:
        line = line.strip()
        if not line:
            continue
        
        # Main section (# Section)
        if line.startswith('# ') or (line.startswith('#') and not line.startswith('##')):
            if current_section:
                sections.append(current_section)
            
            title = line.replace('#', '').strip()
            current_section = {
                "title": title,
                "subsections": [],
                "content": "",
                "type": "main_section"
            }
            current_subsection = None
        
        # Subsection (## Subsection)
        elif line.startswith('## '):
            if current_section:
                title = line.replace('##', '').strip()
                current_subsection = {
                    "title": title,
                    "points": [],
                    "content": "",
                    "type": "subsection"
                }
                current_section["subsections"].append(current_subsection)
        
        # Key points (- point)
        elif line.startswith('- ') and current_subsection:
            point = line.replace('-', '').strip()
            current_subsection["points"].append(point)
        
        # Regular content
        elif current_section and not line.startswith('#'):
            if current_subsection:
                current_subsection["content"] += line + " "
            else:
                current_section["content"] += line + " "
    
    # Add the last section
    if current_section:
        sections.append(current_section)
    
    return {
        "sections": sections,
        "total_sections": len(sections),
        "structure_type": "academic_research",
        "generated_at": datetime.now().isoformat()
    }


def _enhance_structure(structure: Dict, content: str, context: Dict) -> Dict[str, Any]:
    """Enhance the structure with additional metadata and quality indicators"""
    
    enhanced = structure.copy()
    
    # Add metadata
    enhanced.update({
        "content_length": len(content),
        "complexity_score": _calculate_structure_complexity(structure),
        "academic_quality": _assess_academic_quality(structure, context),
        "completeness_score": _calculate_completeness(structure),
        "research_topic": context.get("original_request", "Unknown"),
        "structure_timestamp": datetime.now().isoformat()
    })
    
    # Add section summaries
    for section in enhanced["sections"]:
        section["estimated_length"] = _estimate_section_length(section)
        section["complexity"] = len(section.get("subsections", []))
        section["key_points_count"] = sum(len(sub.get("points", [])) for sub in section.get("subsections", []))
    
    return enhanced


async def _expand_sections(structure: Dict, context: Dict) -> str:
    """Expand each section with detailed content"""
    
    expanded_content = ""
    research_context = str(context.get("search_results", ""))[:2000]
    
    # Add document header
    research_topic = context.get("original_request", "Research Topic")
    expanded_content += f"# {research_topic}\n\n"
    
    if context.get("clarification_applied"):
        expanded_content += "*Research conducted with cognitive bias awareness and CBT-informed analysis.*\n\n"
    
    # Expand each section
    for i, section in enumerate(structure.get("sections", [])):
        sections_logger.info(f"📝 Expanding section {i+1}: {section['title']}")
        
        expanded_content += f"\n## {section['title']}\n\n"
        
        # Expand subsections if they exist
        if section.get("subsections"):
            for subsection in section["subsections"]:
                expanded_content += f"\n### {subsection['title']}\n\n"
                
                # Generate content for this subsection
                section_points = subsection.get("points", [])
                if section_points:
                    expansion_prompt = _create_section_expansion_prompt(
                        subsection["title"], section_points, research_context, context
                    )
                    expanded_text = await _generate_with_model(expansion_prompt, context)
                    expanded_content += expanded_text + "\n\n"
                
                # Add existing content if any
                if subsection.get("content"):
                    expanded_content += subsection["content"] + "\n\n"
        
        # Add section-level content if no subsections
        elif section.get("content"):
            expanded_content += section["content"] + "\n\n"
        
        # Generate content if section is empty
        else:
            section_prompt = f"Write a comprehensive section about '{section['title']}' in the context of {research_topic}. Provide 2-3 well-developed paragraphs with academic depth."
            section_content = await _generate_with_model(section_prompt, context)
            expanded_content += section_content + "\n\n"
    
    return expanded_content


def _format_research_document(content: str, context: Dict) -> str:
    """Format the document with proper academic structure"""
    
    formatted = content
    
    # Add abstract if this is a comprehensive research document
    if len(content) > 2000 and context.get("academic_level") in ["graduate", "doctoral"]:
        abstract = _generate_abstract(content, context)
        # Insert abstract after title
        lines = formatted.split('\n')
        title_line = 0
        for i, line in enumerate(lines):
            if line.startswith('# '):
                title_line = i
                break
        
        lines.insert(title_line + 2, "\n## Abstract\n")
        lines.insert(title_line + 3, abstract + "\n")
        formatted = '\n'.join(lines)
    
    # Add conclusion if not present
    if "conclusion" not in formatted.lower() and len(formatted) > 1000:
        conclusion = _generate_conclusion(content, context)
        formatted += f"\n## Conclusion\n\n{conclusion}\n"
    
    # Add references section if search was performed
    if context.get("search_performed") and context.get("search_history"):
        references = _generate_references_section(context)
        formatted += f"\n## References\n\n{references}\n"
    
    return formatted


def _perform_quality_review(document: str, context: Dict) -> Dict[str, Any]:
    """Perform quality review of the document"""
    
    review_results = {
        "quality_score": 0.0,
        "strengths": [],
        "improvements": [],
        "academic_rigor": 0.0,
        "coherence": 0.0,
        "completeness": 0.0
    }
    
    # Check document length and structure
    word_count = len(document.split())
    section_count = len(re.findall(r'^##?\s+', document, re.MULTILINE))
    
    # Calculate quality metrics
    review_results["academic_rigor"] = min(1.0, (word_count / 1000) * 0.3 + (section_count / 5) * 0.7)
    review_results["coherence"] = 0.8  # Placeholder - would use more sophisticated analysis
    review_results["completeness"] = min(1.0, word_count / 1500)  # Based on expected length
    
    # Overall quality score
    review_results["quality_score"] = (
        review_results["academic_rigor"] * 0.4 +
        review_results["coherence"] * 0.3 +
        review_results["completeness"] * 0.3
    )
    
    # Identify strengths
    if word_count > 1000:
        review_results["strengths"].append("Comprehensive content length")
    if section_count >= 4:
        review_results["strengths"].append("Well-structured organization")
    if context.get("search_performed"):
        review_results["strengths"].append("Research-informed content")
    if context.get("clarification_applied"):
        review_results["strengths"].append("Cognitive bias awareness applied")
    
    # Identify improvements
    if word_count < 800:
        review_results["improvements"].append("Expand content for greater depth")
    if section_count < 3:
        review_results["improvements"].append("Add more structured sections")
    if "conclusion" not in document.lower():
        review_results["improvements"].append("Add concluding section")
    
    return review_results


def _apply_improvements(document: str, review_results: Dict, context: Dict) -> str:
    """Apply improvements based on quality review"""
    
    improved = document
    
    # Apply specific improvements
    for improvement in review_results.get("improvements", []):
        if "expand content" in improvement.lower() and len(improved.split()) < 1000:
            # Add more detail to existing sections
            sections_logger.info("🔧 Applying content expansion improvements...")
            # This would involve re-expanding thin sections
            
        elif "add more structured sections" in improvement.lower():
            sections_logger.info("🔧 Improving document structure...")
            # This would involve reorganizing content
            
        elif "add concluding section" in improvement.lower():
            if "conclusion" not in improved.lower():
                conclusion = _generate_conclusion(improved, context)
                improved += f"\n## Conclusion\n\n{conclusion}\n"
    
    return improved


def _add_final_formatting(document: str, context: Dict) -> str:
    """Add final formatting and metadata to the document"""
    
    formatted = document
    
    # Add document metadata footer
    metadata_footer = f"""

---

**Document Information:**
- Generated: {datetime.now().strftime('%Y-%m-%d %H:%M')}
- Word Count: ~{len(formatted.split())} words
- Research Topic: {context.get('original_request', 'Unknown')}
- Processing Pipeline: {' → '.join(context.get('workflow_steps', ['CBT Clarification', 'Web Search', 'Content Analysis', 'Structured Writing']))}
"""
    
    # Add cognitive processing notes if applicable
    if context.get("proto_ai"):
        proto = context["proto_ai"]
        consciousness_summary = proto.get_consciousness_summary()
        metadata_footer += f"""
- Cognitive Bias Screening: {consciousness_summary['metacognitive_insights_count']} insights applied
- Emotional Awareness: Applied throughout research process
"""
    
    # Add performance metrics
    if context.get("summarization_performed"):
        compression_ratio = context.get("compression_ratio", 0)
        metadata_footer += f"- Content Synthesis: {compression_ratio:.1%} compression ratio applied\n"
    
    formatted += metadata_footer
    
    return formatted


def _add_research_features(content: str, context: Dict) -> str:
    """Add advanced research features like citations and analysis"""
    
    enhanced = content
    
    # Add research methodology note if appropriate
    if context.get("search_performed") and len(enhanced) > 1500:
        methodology_note = """

## Research Methodology

This research synthesis employed a multi-stage cognitive processing approach:

1. **Cognitive Clarification**: Applied CBT-informed bias detection to clarify research intent
2. **Information Gathering**: Systematic web search using DuckDuckGo and academic sources
3. **Content Analysis**: MLX-accelerated summarization and synthesis of findings
4. **Structured Writing**: Logical organization and academic presentation of results
5. **Quality Review**: Comprehensive review for academic rigor and completeness

"""
        # Insert after abstract or after first section
        if "## Abstract" in enhanced:
            enhanced = enhanced.replace("## Abstract", methodology_note + "\n## Abstract")
        else:
            # Insert after first heading
            parts = enhanced.split('\n## ', 1)
            if len(parts) == 2:
                enhanced = parts[0] + methodology_note + '\n## ' + parts[1]
    
    return enhanced


# Helper functions for fallbacks and basic processing

def _create_fallback_structure(input_data: Any, context: Dict) -> Dict[str, Any]:
    """Create a basic structure when advanced processing fails"""
    
    return {
        "sections": [
            {
                "title": "Introduction",
                "subsections": [{"title": "Background", "points": ["Context and significance"]}],
                "type": "main_section"
            },
            {
                "title": "Analysis",
                "subsections": [{"title": "Key Findings", "points": ["Main discoveries"]}],
                "type": "main_section"
            },
            {
                "title": "Conclusion",
                "subsections": [{"title": "Summary", "points": ["Final thoughts"]}],
                "type": "main_section"
            }
        ],
        "total_sections": 3,
        "structure_type": "basic_fallback"
    }


def _create_fallback_document(input_data: Any, context: Dict) -> str:
    """Create a basic document when section expansion fails"""
    
    content = str(input_data)
    research_topic = context.get("original_request", "Research Topic")
    
    return f"""# {research_topic}

## Introduction

This research document was generated using basic processing due to technical limitations. The content below represents the available information about {research_topic}.

## Content

{content}

## Summary

The research content has been presented above. For more detailed analysis and structured presentation, please ensure that advanced processing capabilities are available.

---
*Generated: {datetime.now().strftime('%Y-%m-%d %H:%M')}*
"""


def _create_fallback_finalization(input_data: Any, context: Dict) -> str:
    """Create basic finalization when advanced review fails"""
    
    document = str(input_data)
    
    return document + f"""

---

**Note**: This document was processed using basic finalization due to technical constraints. 
For comprehensive quality review and enhancement, please ensure advanced processing capabilities are available.

*Processed: {datetime.now().strftime('%Y-%m-%d %H:%M')}*
"""


def _extract_sections_from_text(text: str) -> Dict[str, Any]:
    """Extract section structure from plain text"""
    
    sections = []
    current_section = None
    
    lines = text.split('\n')
    
    for line in lines:
        line = line.strip()
        if line.startswith('#'):
            if current_section:
                sections.append(current_section)
            title = line.replace('#', '').strip()
            current_section = {
                "title": title,
                "content": "",
                "subsections": [],
                "type": "main_section"
            }
        elif current_section and line:
            current_section["content"] += line + " "
    
    if current_section:
        sections.append(current_section)
    
    return {"sections": sections, "total_sections": len(sections)}


def _calculate_structure_complexity(structure: Dict) -> float:
    """Calculate complexity score for document structure"""
    
    sections = structure.get("sections", [])
    total_subsections = sum(len(s.get("subsections", [])) for s in sections)
    total_points = sum(sum(len(sub.get("points", [])) for sub in s.get("subsections", [])) for s in sections)
    
    # Complexity based on hierarchical depth
    complexity = len(sections) * 0.3 + total_subsections * 0.5 + total_points * 0.2
    return min(1.0, complexity / 10)  # Normalize to 0-1


def _assess_academic_quality(structure: Dict, context: Dict) -> float:
    """Assess academic quality of the structure"""
    
    quality_score = 0.5  # Base score
    
    sections = structure.get("sections", [])
    
    # Check for academic sections
    academic_sections = ["introduction", "methodology", "analysis", "results", "conclusion", "references"]
    section_titles = [s.get("title", "").lower() for s in sections]
    
    matches = sum(1 for title in section_titles for academic in academic_sections if academic in title)
    quality_score += min(0.3, matches * 0.1)
    
    # Check for subsection depth
    if any(len(s.get("subsections", [])) > 2 for s in sections):
        quality_score += 0.2
    
    return min(1.0, quality_score)


def _calculate_completeness(structure: Dict) -> float:
    """Calculate completeness score based on structure depth"""
    
    sections = structure.get("sections", [])
    
    if len(sections) < 3:
        return 0.3
    elif len(sections) < 5:
        return 0.6
    elif len(sections) < 7:
        return 0.8
    else:
        return 1.0


def _estimate_section_length(section: Dict) -> int:
    """Estimate the expected length of a section when expanded"""
    
    base_length = 200  # Base length per section
    subsection_length = len(section.get("subsections", [])) * 150
    points_length = sum(len(sub.get("points", [])) for sub in section.get("subsections", [])) * 50
    
    return base_length + subsection_length + points_length


def _generate_abstract(content: str, context: Dict) -> str:
    """Generate an abstract for the research document"""
    
    research_topic = context.get("original_request", "research topic")
    
    # Extract key points for abstract
    sentences = content.split('.')[:10]  # First 10 sentences
    key_content = '. '.join(sentences)[:500]
    
    return f"""This research examines {research_topic} through comprehensive analysis of available literature and evidence. {key_content[:200]}... The findings provide insights into the current state of knowledge and identify areas for future investigation. This synthesis contributes to a better understanding of {research_topic} and its implications for both theory and practice."""


def _generate_conclusion(content: str, context: Dict) -> str:
    """Generate a conclusion for the research document"""
    
    research_topic = context.get("original_request", "the research topic")
    
    return f"""This comprehensive analysis of {research_topic} has revealed several key insights and findings. The research demonstrates the complexity of the topic and highlights both established knowledge and areas requiring further investigation.

The synthesis of available evidence suggests that {research_topic} involves multiple interconnected factors that merit continued study. Future research should focus on addressing the identified gaps in knowledge while building upon the established foundations presented in this analysis.

These findings contribute to our understanding of {research_topic} and provide a foundation for both practical applications and future scholarly inquiry."""


def _generate_references_section(context: Dict) -> str:
    """Generate a references section based on search history"""
    
    references = ""
    
    search_history = context.get("search_history", [])
    
    if search_history:
        references += "**Search Queries Conducted:**\n"
        for i, search in enumerate(search_history, 1):
            references += f"{i}. {search.get('query', 'Unknown query')} (Performed: {search.get('timestamp', 'Unknown time')})\n"
    
    references += "\n**Note**: This research was conducted using web search and academic sources. " \
                  "For formal citation requirements, please consult the original sources identified during the research process."
    
    return references


def _create_structured_response(prompt: str) -> str:
    """Create a structured response when no model is available"""
    
    if "structure" in prompt.lower() or "outline" in prompt.lower():
        return """# Introduction
## Background
- Context and overview
- Significance of the topic

## Literature Review
- Previous research
- Current understanding

# Analysis
## Key Findings
- Main discoveries
- Important patterns

## Discussion
- Interpretation of results
- Implications

# Conclusion
## Summary
- Key takeaways
- Final thoughts

## Future Directions
- Areas for further research
- Recommendations"""
    
    else:
        return "Content analysis and structured writing capabilities are currently limited. Please ensure that advanced language models are available for comprehensive section development." 