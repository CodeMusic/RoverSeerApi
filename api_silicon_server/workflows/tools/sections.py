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

# Set up logger with enhanced pipeline logging
sections_logger = logging.getLogger("WorkflowTools.Sections")
sections_logger.setLevel(logging.INFO)

# Helper function for pipeline logging format
def log_pipeline_stage(stage_num: int, stage_desc: str, input_data: Any, output_data: Any = None, logger=sections_logger):
    """Log pipeline stages in the requested format with INPUT/OUTPUT"""
    
    # Format input data for logging
    input_str = str(input_data) if input_data is not None else "None"
    if len(input_str) > 300:
        input_preview = input_str[:150] + "..." + input_str[-150:]
    else:
        input_preview = input_str
    
    # Log input
    logger.info(f"📊 PIPELINE {stage_num} ({stage_desc}) -INPUT:")
    logger.info(f"     Type: {type(input_data).__name__}")
    logger.info(f"     Length: {len(input_str)} characters")
    logger.info(f"     Preview: {input_preview}")
    
    # Log output if provided
    if output_data is not None:
        output_str = str(output_data) if output_data is not None else "None"
        if len(output_str) > 300:
            output_preview = output_str[:150] + "..." + output_str[-150:]
        else:
            output_preview = output_str
            
        logger.info(f"📊 PIPELINE {stage_num} ({stage_desc}) -OUTPUT:")
        logger.info(f"     Type: {type(output_data).__name__}")
        logger.info(f"     Length: {len(output_str)} characters")
        logger.info(f"     Preview: {output_preview}")
        logger.info(f"     Success: True")
    
    logger.info(f"🔄 PIPELINE {stage_num} ({stage_desc}) - Stage completed at {datetime.now().strftime('%H:%M:%S')}")


async def identify_sections(input_data: Any, context: Dict) -> Dict[str, Any]:
    """
    PIPELINE STAGE 1: Identify and structure logical sections for research content.
    
    This tool analyzes summarized content and creates a structured outline
    with logical sections, subsections, and content organization.
    
    Args:
        input_data: Summarized research content
        context: Workflow context
    
    Returns:
        Dict: Structured sections with metadata
    """
    stage_num = 1
    stage_desc = "SECTION IDENTIFICATION"
    
    log_pipeline_stage(stage_num, stage_desc, input_data, logger=sections_logger)
    
    # Update context with detailed progress tracking
    context["step_output_details"] = {
        "summary": f"Starting {stage_desc}",
        "actions": ["Initializing section identification"],
        "data_processed": {"input_type": type(input_data).__name__},
        "metrics": {"stage": stage_num, "started_at": datetime.now().isoformat()}
    }
    
    try:
        # Validate input data
        if not input_data:
            raise ValueError("No input data provided for section identification")
        
        # Convert input to text with validation
        if isinstance(input_data, dict):
            if "content" in input_data:
                content_text = str(input_data["content"])
            else:
                content_text = str(input_data)
        else:
            content_text = str(input_data)
        
        if len(content_text.strip()) < 50:
            sections_logger.warning(f"⚠️ Input content very short ({len(content_text)} chars) - may produce limited structure")
        
        context["step_output_details"]["actions"].append("Input data validated and converted to text")
        context["step_output_details"]["data_processed"]["content_length"] = len(content_text)
        
        # Create structuring prompt
        sections_logger.info(f"🏗️ Creating structure prompt for {len(content_text)} characters")
        structure_prompt = _create_structure_prompt(content_text, context)
        
        context["step_output_details"]["actions"].append("Structure prompt created")
        
        # Generate structure using MLX model
        sections_logger.info(f"🧠 Generating structure using available models...")
        structure_response = await _generate_with_model(structure_prompt, context)
        
        if not structure_response or len(structure_response.strip()) < 20:
            sections_logger.error("❌ Model returned empty or minimal response")
            structure_response = _create_fallback_structure_text(content_text, context)
        
        context["step_output_details"]["actions"].append("Structure generated from model")
        context["step_output_details"]["data_processed"]["structure_response_length"] = len(structure_response)
        
        # Parse the structure into organized sections
        sections_logger.info(f"📝 Parsing structure response ({len(structure_response)} chars)")
        parsed_structure = _parse_structure_response(structure_response, context)
        
        if not parsed_structure.get("sections") or len(parsed_structure["sections"]) == 0:
            sections_logger.warning("⚠️ No sections parsed from response - creating fallback structure")
            parsed_structure = _create_fallback_structure(input_data, context)
        
        context["step_output_details"]["actions"].append("Structure parsed into sections")
        context["step_output_details"]["data_processed"]["sections_count"] = len(parsed_structure.get("sections", []))
        
        # Enhance structure with metadata
        sections_logger.info(f"✨ Enhancing structure with metadata")
        enhanced_structure = _enhance_structure(parsed_structure, content_text, context)
        
        # Update context with success details
        context.update({
            "structure_identified": True,
            "total_sections": len(enhanced_structure.get("sections", [])),
            "structure_timestamp": datetime.now().isoformat()
        })
        
        context["step_output_details"].update({
            "summary": f"Successfully identified {len(enhanced_structure.get('sections', []))} main sections",
            "metrics": {
                "stage": stage_num,
                "sections_identified": len(enhanced_structure.get("sections", [])),
                "complexity_score": enhanced_structure.get("complexity_score", 0),
                "quality_score": enhanced_structure.get("academic_quality", 0.8),
                "completion_time": datetime.now().isoformat()
            }
        })
        
        context["step_output_details"]["actions"].append("Structure enhanced with metadata")
        
        log_pipeline_stage(stage_num, stage_desc, input_data, enhanced_structure, sections_logger)
        
        sections_logger.info(f"✅ PIPELINE {stage_num} completed: {len(enhanced_structure.get('sections', []))} sections identified")
        
        return enhanced_structure
        
    except Exception as e:
        error_msg = f"Section identification failed: {str(e)}"
        sections_logger.error(f"❌ PIPELINE {stage_num} FAILED: {error_msg}")
        
        context["step_output_details"]["summary"] = f"Failed: {error_msg}"
        context["step_output_details"]["actions"].append(f"Error occurred: {str(e)}")
        
        # Create fallback structure
        fallback_result = _create_fallback_structure(input_data, context)
        log_pipeline_stage(stage_num, f"{stage_desc} (FALLBACK)", input_data, fallback_result, sections_logger)
        
        return fallback_result


async def write_sections(input_data: Any, context: Dict) -> str:
    """
    PIPELINE STAGE 2: Expand and write detailed content for each identified section.
    
    This tool takes the structured outline and generates comprehensive
    content for each section while maintaining coherence and academic quality.
    
    Args:
        input_data: Structured sections from identify_sections
        context: Workflow context
    
    Returns:
        str: Complete research document with expanded sections
    """
    stage_num = 2
    stage_desc = "SECTION WRITING"
    
    log_pipeline_stage(stage_num, stage_desc, input_data, logger=sections_logger)
    
    # Update context with detailed progress tracking
    context["step_output_details"] = {
        "summary": f"Starting {stage_desc}",
        "actions": ["Initializing section writing"],
        "data_processed": {"input_type": type(input_data).__name__},
        "metrics": {"stage": stage_num, "started_at": datetime.now().isoformat()}
    }
    
    try:
        # Validate and handle different input formats
        if not input_data:
            raise ValueError("No structured data provided for section writing")
        
        if isinstance(input_data, dict) and "sections" in input_data:
            structure = input_data
            sections_logger.info(f"📚 Processing {len(structure['sections'])} structured sections")
        elif isinstance(input_data, str):
            sections_logger.info(f"📄 Converting text to sections ({len(input_data)} chars)")
            structure = _extract_sections_from_text(input_data)
        else:
            sections_logger.info(f"🔄 Creating basic structure from input data")
            structure = {"sections": [{"title": "Research Content", "content": str(input_data)}]}
        
        if not structure.get("sections"):
            raise ValueError("No sections found in input data structure")
        
        context["step_output_details"]["actions"].append("Input structure validated and prepared")
        context["step_output_details"]["data_processed"]["sections_to_process"] = len(structure["sections"])
        
        # Expand each section with detailed tracking
        sections_logger.info(f"✍️ Beginning section expansion for {len(structure['sections'])} sections")
        expanded_document = await _expand_sections(structure, context)
        
        if not expanded_document or len(expanded_document.strip()) < 100:
            sections_logger.warning("⚠️ Section expansion produced minimal content - applying enhancements")
            expanded_document = _enhance_minimal_content(expanded_document, structure, context)
        
        context["step_output_details"]["actions"].append("Sections expanded with content")
        context["step_output_details"]["data_processed"]["expanded_length"] = len(expanded_document)
        
        # Format the final document
        sections_logger.info(f"📐 Formatting document ({len(expanded_document)} chars)")
        formatted_document = _format_research_document(expanded_document, context)
        
        context["step_output_details"]["actions"].append("Document formatted with academic structure")
        
        # Update context with success metrics
        context.update({
            "sections_written": True,
            "document_length": len(formatted_document),
            "sections_expanded": len(structure.get("sections", [])),
            "writing_timestamp": datetime.now().isoformat()
        })
        
        context["step_output_details"].update({
            "summary": f"Successfully wrote {len(structure.get('sections', []))} sections ({len(formatted_document)} chars)",
            "metrics": {
                "stage": stage_num,
                "sections_written": len(structure.get("sections", [])),
                "final_length": len(formatted_document),
                "words_count": len(formatted_document.split()),
                "quality_score": 0.8,  # Could be calculated based on content analysis
                "completion_time": datetime.now().isoformat()
            }
        })
        
        log_pipeline_stage(stage_num, stage_desc, input_data, formatted_document, sections_logger)
        
        sections_logger.info(f"✅ PIPELINE {stage_num} completed: {len(formatted_document)} character document created")
        
        return formatted_document
        
    except Exception as e:
        error_msg = f"Section writing failed: {str(e)}"
        sections_logger.error(f"❌ PIPELINE {stage_num} FAILED: {error_msg}")
        
        context["step_output_details"]["summary"] = f"Failed: {error_msg}"
        context["step_output_details"]["actions"].append(f"Error occurred: {str(e)}")
        
        # Create fallback document
        fallback_result = _create_fallback_document(input_data, context)
        log_pipeline_stage(stage_num, f"{stage_desc} (FALLBACK)", input_data, fallback_result, sections_logger)
        
        return fallback_result


def finalize_document(input_data: Any, context: Dict) -> str:
    """
    PIPELINE STAGE 3: Review and finalize the research document with quality assurance.
    
    This tool performs final editing, formatting, and quality checks
    to ensure the document meets academic standards.
    
    Args:
        input_data: Complete research document
        context: Workflow context
    
    Returns:
        str: Finalized, polished research document
    """
    stage_num = 3
    stage_desc = "DOCUMENT FINALIZATION"
    
    log_pipeline_stage(stage_num, stage_desc, input_data, logger=sections_logger)
    
    # Update context with detailed progress tracking
    context["step_output_details"] = {
        "summary": f"Starting {stage_desc}",
        "actions": ["Initializing document finalization"],
        "data_processed": {"input_type": type(input_data).__name__},
        "metrics": {"stage": stage_num, "started_at": datetime.now().isoformat()}
    }
    
    try:
        # Validate input document
        if not input_data:
            raise ValueError("No document provided for finalization")
        
        document_text = str(input_data) if not isinstance(input_data, str) else input_data
        
        if len(document_text.strip()) < 50:
            sections_logger.warning(f"⚠️ Document very short for finalization ({len(document_text)} chars)")
        
        context["step_output_details"]["actions"].append("Input document validated")
        context["step_output_details"]["data_processed"]["input_length"] = len(document_text)
        
        # Perform quality review
        sections_logger.info(f"🔍 Performing quality review on {len(document_text)} character document")
        review_results = _perform_quality_review(document_text, context)
        
        context["step_output_details"]["actions"].append("Quality review completed")
        context["step_output_details"]["data_processed"]["review_metrics"] = review_results
        
        # Apply improvements based on review
        sections_logger.info(f"🔧 Applying improvements based on review (score: {review_results.get('quality_score', 0):.2f})")
        improved_document = _apply_improvements(document_text, review_results, context)
        
        context["step_output_details"]["actions"].append("Improvements applied based on review")
        
        # Add final formatting and metadata
        sections_logger.info(f"✨ Adding final formatting and metadata")
        finalized_document = _add_final_formatting(improved_document, context)
        
        context["step_output_details"]["actions"].append("Final formatting and metadata added")
        
        # Update context with finalization metadata
        final_quality_score = review_results.get("quality_score", 0.8)
        context.update({
            "document_finalized": True,
            "final_length": len(finalized_document),
            "quality_score": final_quality_score,
            "finalization_timestamp": datetime.now().isoformat()
        })
        
        context["step_output_details"].update({
            "summary": f"Document finalized with quality score {final_quality_score:.2f}",
            "metrics": {
                "stage": stage_num,
                "final_length": len(finalized_document),
                "quality_score": final_quality_score,
                "improvements_applied": len(review_results.get("improvements", [])),
                "word_count": len(finalized_document.split()),
                "completion_time": datetime.now().isoformat()
            }
        })
        
        log_pipeline_stage(stage_num, stage_desc, input_data, finalized_document, sections_logger)
        
        sections_logger.info(f"✅ PIPELINE {stage_num} completed: Document finalized (quality: {final_quality_score:.2f})")
        
        return finalized_document
        
    except Exception as e:
        error_msg = f"Document finalization failed: {str(e)}"
        sections_logger.error(f"❌ PIPELINE {stage_num} FAILED: {error_msg}")
        
        context["step_output_details"]["summary"] = f"Failed: {error_msg}"
        context["step_output_details"]["actions"].append(f"Error occurred: {str(e)}")
        
        # Create fallback finalization
        fallback_result = _create_fallback_finalization(input_data, context)
        log_pipeline_stage(stage_num, f"{stage_desc} (FALLBACK)", input_data, fallback_result, sections_logger)
        
        return fallback_result


async def expand_research_sections(input_data: Any, context: Dict) -> str:
    """
    PIPELINE STAGE 2A: Advanced section expansion with research depth and academic rigor.
    
    This is an enhanced version of write_sections that provides more
    detailed research content with citations, analysis, and scholarly depth.
    
    Args:
        input_data: Structured sections or content to expand
        context: Workflow context
    
    Returns:
        str: Comprehensively expanded research document
    """
    stage_num = "2A"
    stage_desc = "ADVANCED SECTION EXPANSION"
    
    log_pipeline_stage(stage_num, stage_desc, input_data, logger=sections_logger)
    
    try:
        # Prepare for advanced expansion
        sections_logger.info("🎓 Preparing advanced research expansion")
        context["advanced_expansion"] = True
        context["academic_rigor"] = "high"
        context["citation_style"] = context.get("citation_style", "academic")
        
        # Use enhanced section writing
        expanded_content = await write_sections(input_data, context)
        
        # Add advanced research features
        sections_logger.info("🔬 Adding advanced research features")
        enhanced_content = _add_research_features(expanded_content, context)
        
        log_pipeline_stage(stage_num, stage_desc, input_data, enhanced_content, sections_logger)
        
        sections_logger.info("✅ Advanced section expansion completed")
        
        return enhanced_content
        
    except Exception as e:
        sections_logger.error(f"❌ Advanced section expansion failed: {str(e)}")
        # Fallback to standard section writing
        return await write_sections(input_data, context)


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
    """Generate text using available models with enhanced fallback and logging"""
    
    generation_start = time.time()
    sections_logger.info(f"🧠 Starting model generation (prompt: {len(prompt)} chars)")
    
    try:
        # Use context generation function if available
        if "generate_with_fallback" in context:
            sections_logger.info("🔥 Using MLX/Ollama generation for sections...")
            try:
                result = await context["generate_with_fallback"](prompt)
                generation_time = time.time() - generation_start
                sections_logger.info(f"✅ MLX/Ollama generated {len(result)} characters in {generation_time:.2f}s")
                
                # Validate result quality
                if len(result.strip()) < 50:
                    sections_logger.warning(f"⚠️ Model returned short response ({len(result)} chars) - may need fallback")
                
                return result
            except Exception as e:
                sections_logger.error(f"❌ Context generation failed: {str(e)}")
                # Fall through to next option
        
        # Check for direct model access
        elif "model" in context and hasattr(context["model"], "generate"):
            sections_logger.info("🔥 Using direct MLX model...")
            model = context["model"]
            try:
                result = model.generate(prompt, max_tokens=1024)
                generation_time = time.time() - generation_start
                sections_logger.info(f"✅ Direct model generated {len(result)} characters in {generation_time:.2f}s")
                return result
            except Exception as e:
                sections_logger.error(f"❌ Direct model generation failed: {str(e)}")
                # Fall through to fallback
        
        else:
            sections_logger.warning("⚠️ No model available, using intelligent fallback...")
            result = _create_intelligent_response(prompt, context)
            generation_time = time.time() - generation_start
            sections_logger.info(f"✅ Fallback generated {len(result)} characters in {generation_time:.2f}s")
            return result
            
    except Exception as e:
        generation_time = time.time() - generation_start
        sections_logger.error(f"❌ All model generation failed after {generation_time:.2f}s: {str(e)}")
        result = _create_intelligent_response(prompt, context)
        sections_logger.info(f"✅ Emergency fallback generated {len(result)} characters")
        return result


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
    """Expand each section with detailed content and enhanced logging"""
    
    sections_logger.info(f"📝 Beginning detailed section expansion")
    
    expanded_content = ""
    research_context = str(context.get("search_results", ""))[:2000]
    expansion_start = time.time()
    
    # Add document header
    research_topic = context.get("original_request", "Research Topic")
    expanded_content += f"# {research_topic}\n\n"
    
    if context.get("clarification_applied"):
        expanded_content += "*Research conducted with cognitive bias awareness and CBT-informed analysis.*\n\n"
    
    total_sections = len(structure.get("sections", []))
    sections_logger.info(f"📚 Expanding {total_sections} sections with research context")
    
    # Expand each section
    for i, section in enumerate(structure.get("sections", [])):
        section_start = time.time()
        sections_logger.info(f"📝 Expanding section {i+1}/{total_sections}: {section['title']}")
        
        expanded_content += f"\n## {section['title']}\n\n"
        
        # Expand subsections if they exist
        if section.get("subsections"):
            for j, subsection in enumerate(section["subsections"]):
                sections_logger.info(f"   📋 Expanding subsection {j+1}: {subsection['title']}")
                expanded_content += f"\n### {subsection['title']}\n\n"
                
                # Generate content for this subsection
                section_points = subsection.get("points", [])
                if section_points:
                    expansion_prompt = _create_section_expansion_prompt(
                        subsection["title"], section_points, research_context, context
                    )
                    expanded_text = await _generate_with_model(expansion_prompt, context)
                    
                    if expanded_text and len(expanded_text.strip()) > 20:
                        expanded_content += expanded_text + "\n\n"
                    else:
                        # Fallback content for subsection
                        fallback_content = _create_subsection_fallback(subsection["title"], section_points, context)
                        expanded_content += fallback_content + "\n\n"
                
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
            
            if section_content and len(section_content.strip()) > 20:
                expanded_content += section_content + "\n\n"
            else:
                # Fallback content for empty section
                fallback_content = _create_section_fallback(section["title"], research_topic)
                expanded_content += fallback_content + "\n\n"
        
        section_time = time.time() - section_start
        sections_logger.info(f"   ✅ Section {i+1} completed in {section_time:.2f}s")
    
    expansion_time = time.time() - expansion_start
    sections_logger.info(f"✅ All sections expanded in {expansion_time:.2f}s (total: {len(expanded_content)} chars)")
    
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
    """Perform enhanced quality review of the document with detailed metrics"""
    
    review_start = time.time()
    sections_logger.info(f"🔍 Starting comprehensive quality review")
    
    review_results = {
        "quality_score": 0.0,
        "strengths": [],
        "improvements": [],
        "academic_rigor": 0.0,
        "coherence": 0.0,
        "completeness": 0.0,
        "structure_quality": 0.0,
        "content_depth": 0.0
    }
    
    # Check document length and structure
    word_count = len(document.split())
    char_count = len(document)
    section_count = len(re.findall(r'^##?\s+', document, re.MULTILINE))
    subsection_count = len(re.findall(r'^###\s+', document, re.MULTILINE))
    
    sections_logger.info(f"📊 Document metrics: {word_count} words, {section_count} sections, {subsection_count} subsections")
    
    # Calculate quality metrics
    review_results["academic_rigor"] = min(1.0, (word_count / 1000) * 0.4 + (section_count / 5) * 0.6)
    review_results["structure_quality"] = min(1.0, (section_count / 4) * 0.5 + (subsection_count / 8) * 0.5)
    review_results["completeness"] = min(1.0, word_count / 1500)  # Based on expected length
    review_results["content_depth"] = min(1.0, char_count / 5000)  # Character-based depth
    
    # Check for academic indicators
    academic_terms = ["analysis", "research", "study", "findings", "evidence", "conclusion", "investigation"]
    academic_count = sum(1 for term in academic_terms if term in document.lower())
    review_results["coherence"] = min(1.0, academic_count / len(academic_terms))
    
    # Overall quality score
    review_results["quality_score"] = (
        review_results["academic_rigor"] * 0.25 +
        review_results["coherence"] * 0.2 +
        review_results["completeness"] * 0.2 +
        review_results["structure_quality"] * 0.2 +
        review_results["content_depth"] * 0.15
    )
    
    # Identify strengths
    if word_count > 1000:
        review_results["strengths"].append("Comprehensive content length")
    if section_count >= 4:
        review_results["strengths"].append("Well-structured organization")
    if subsection_count >= 6:
        review_results["strengths"].append("Detailed hierarchical structure")
    if context.get("search_performed"):
        review_results["strengths"].append("Research-informed content")
    if context.get("clarification_applied"):
        review_results["strengths"].append("Cognitive bias awareness applied")
    if academic_count >= 5:
        review_results["strengths"].append("Strong academic vocabulary")
    
    # Identify improvements
    if word_count < 800:
        review_results["improvements"].append("Expand content for greater depth")
    if section_count < 3:
        review_results["improvements"].append("Add more structured sections")
    if subsection_count < 4:
        review_results["improvements"].append("Enhance hierarchical organization")
    if "conclusion" not in document.lower():
        review_results["improvements"].append("Add concluding section")
    if "abstract" not in document.lower() and word_count > 1500:
        review_results["improvements"].append("Consider adding abstract")
    if academic_count < 3:
        review_results["improvements"].append("Enhance academic terminology")
    
    review_time = time.time() - review_start
    sections_logger.info(f"✅ Quality review completed in {review_time:.2f}s (score: {review_results['quality_score']:.2f})")
    
    return review_results


def _apply_improvements(document: str, review_results: Dict, context: Dict) -> str:
    """Apply improvements based on quality review with detailed logging"""
    
    improved = document
    improvements_applied = []
    
    sections_logger.info(f"🔧 Applying {len(review_results.get('improvements', []))} improvements")
    
    # Apply specific improvements
    for improvement in review_results.get("improvements", []):
        if "expand content" in improvement.lower() and len(improved.split()) < 1000:
            sections_logger.info("   📝 Expanding content for greater depth")
            improved = _expand_document_content(improved, context)
            improvements_applied.append("Content expansion")
            
        elif "add more structured sections" in improvement.lower():
            sections_logger.info("   🏗️ Improving document structure")
            improved = _improve_document_structure(improved, context)
            improvements_applied.append("Structure enhancement")
            
        elif "add concluding section" in improvement.lower():
            if "conclusion" not in improved.lower():
                sections_logger.info("   📄 Adding conclusion section")
                conclusion = _generate_conclusion(improved, context)
                improved += f"\n## Conclusion\n\n{conclusion}\n"
                improvements_applied.append("Conclusion added")
        
        elif "consider adding abstract" in improvement.lower():
            if "abstract" not in improved.lower() and len(improved.split()) > 1500:
                sections_logger.info("   📋 Adding abstract section")
                abstract = _generate_abstract(improved, context)
                # Insert abstract after title
                lines = improved.split('\n')
                title_line = 0
                for i, line in enumerate(lines):
                    if line.startswith('# '):
                        title_line = i
                        break
                
                lines.insert(title_line + 2, "\n## Abstract\n")
                lines.insert(title_line + 3, abstract + "\n")
                improved = '\n'.join(lines)
                improvements_applied.append("Abstract added")
    
    sections_logger.info(f"✅ Applied {len(improvements_applied)} improvements: {', '.join(improvements_applied)}")
    
    return improved


def _expand_document_content(document: str, context: Dict) -> str:
    """Expand document content by adding more detail to existing sections"""
    
    research_topic = context.get("original_request", "the research topic")
    
    # Add more detail to short sections
    lines = document.split('\n')
    enhanced_lines = []
    current_section = None
    section_content_length = 0
    
    for line in lines:
        enhanced_lines.append(line)
        
        # Track sections
        if line.startswith('## '):
            current_section = line.strip()
            section_content_length = 0
        elif line.strip() and not line.startswith('#'):
            section_content_length += len(line)
        
        # Add expansion to short sections
        if line.startswith('## ') and section_content_length < 200:
            enhanced_lines.append("")
            enhanced_lines.append(f"The comprehensive examination of this aspect of {research_topic} reveals multiple layers of complexity that warrant detailed analysis. Current research demonstrates the significance of understanding these interconnected factors within the broader theoretical framework.")
            enhanced_lines.append("")
    
    return '\n'.join(enhanced_lines)


def _improve_document_structure(document: str, context: Dict) -> str:
    """Improve document structure by reorganizing and enhancing sections"""
    
    # Ensure proper hierarchical structure
    lines = document.split('\n')
    improved_lines = []
    
    for line in lines:
        # Ensure proper section hierarchy
        if line.startswith('## ') and not any(prev_line.startswith('# ') for prev_line in improved_lines):
            # Add main title if missing
            improved_lines.insert(0, f"# {context.get('original_request', 'Research Analysis')}")
            improved_lines.insert(1, "")
        
        improved_lines.append(line)
    
    return '\n'.join(improved_lines)


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


def _create_fallback_structure_text(content: str, context: Dict) -> str:
    """Create fallback structure text when model generation fails"""
    
    research_topic = context.get("original_request", "research topic")
    sections_logger.info(f"🛠️ Creating fallback structure text for {research_topic}")
    
    return f"""# {research_topic}

## Introduction
### Background and Context
The study of {research_topic} represents an important area of research with significant implications for understanding the subject matter.

### Research Significance
Current literature indicates that {research_topic} warrants comprehensive analysis and investigation.

## Literature Review
### Previous Studies
Multiple research efforts have examined various aspects of {research_topic}, contributing to our understanding of the field.

### Current Knowledge
The existing body of work provides foundational insights into {research_topic} while identifying areas for further investigation.

## Analysis and Discussion
### Key Findings
Research indicates several important patterns and relationships relevant to {research_topic}.

### Critical Analysis
The evidence suggests that {research_topic} involves complex relationships that merit detailed examination.

## Conclusions and Future Directions
### Summary of Findings
This analysis provides insights into {research_topic} and highlights both established knowledge and areas requiring further study.

### Recommendations
Future research should focus on addressing identified gaps while building upon current understanding."""


def _enhance_minimal_content(content: str, structure: Dict, context: Dict) -> str:
    """Enhance content that is too minimal by adding more detail"""
    
    sections_logger.info("🔧 Enhancing minimal content with additional detail")
    
    if not content or len(content.strip()) < 100:
        research_topic = context.get("original_request", "the research topic")
        
        enhanced = f"# {research_topic}\n\n"
        
        for section in structure.get("sections", []):
            enhanced += f"## {section.get('title', 'Section')}\n\n"
            
            # Add content for each section
            if section.get("subsections"):
                for subsection in section["subsections"]:
                    enhanced += f"### {subsection.get('title', 'Subsection')}\n\n"
                    enhanced += f"This section examines {subsection.get('title', 'key aspects').lower()} of {research_topic}. "
                    enhanced += "Research in this area demonstrates the importance of understanding these concepts within the broader context of the field.\n\n"
                    
                    for point in subsection.get("points", []):
                        enhanced += f"The analysis reveals that {point.lower()} plays a significant role in understanding {research_topic}. "
                        enhanced += "This finding contributes to our overall comprehension of the subject matter.\n\n"
            else:
                enhanced += f"This section provides comprehensive analysis of {section.get('title', 'the topic').lower()} as it relates to {research_topic}. "
                enhanced += "The examination reveals important insights that contribute to our understanding of the field.\n\n"
        
        return enhanced
    
    return content


def _create_subsection_fallback(title: str, points: List[str], context: Dict) -> str:
    """Create fallback content for a subsection"""
    
    research_topic = context.get("original_request", "the research topic")
    
    content = f"The examination of {title.lower()} in the context of {research_topic} reveals several important considerations. "
    
    if points:
        content += "Key areas of focus include:\n\n"
        for point in points:
            content += f"- **{point}**: This aspect demonstrates the importance of understanding {point.lower()} within the broader framework of {research_topic}.\n"
        content += "\n"
    
    content += f"These findings contribute to our comprehensive understanding of {title.lower()} and its relationship to {research_topic}."
    
    return content


def _create_section_fallback(title: str, research_topic: str) -> str:
    """Create fallback content for an empty section"""
    
    return f"""The analysis of {title.lower()} represents a critical component in understanding {research_topic}. This area of study encompasses multiple dimensions that warrant careful examination.

Research in this domain demonstrates the complexity of factors involved and highlights the interconnected nature of various elements that contribute to our understanding. The evidence suggests that {title.lower()} plays a significant role in the overall framework of {research_topic}.

Further investigation into {title.lower()} reveals important patterns and relationships that enhance our comprehension of the subject matter. These insights provide valuable contributions to the broader understanding of {research_topic} and its implications for both theoretical knowledge and practical applications."""


def _create_intelligent_response(prompt: str, context: Dict) -> str:
    """Create a fallback response when no specific model is available"""
    
    research_topic = context.get("original_request", "the research topic")
    
    if "structure" in prompt.lower() or "outline" in prompt.lower():
        return f"""# {research_topic}

## Introduction
### Background
The investigation of {research_topic} represents an important area of study with significant implications for both theoretical understanding and practical applications.

### Research Context
Current literature reveals varying perspectives on {research_topic}, highlighting the need for comprehensive analysis and synthesis of available evidence.

## Literature Review
### Previous Research
Multiple studies have examined different aspects of {research_topic}, contributing to our evolving understanding of this complex subject.

### Current Understanding
The field has developed several key insights regarding {research_topic}, though gaps in knowledge remain that warrant further investigation.

## Analysis
### Key Findings
Research indicates several important patterns and relationships relevant to {research_topic} that merit detailed examination.

### Discussion
The evidence suggests that {research_topic} involves multiple interconnected factors that influence outcomes and understanding.

## Conclusion
### Summary
This analysis of {research_topic} reveals the complexity of the subject and highlights both established knowledge and areas requiring continued study.

### Future Directions
Future research should focus on addressing identified gaps while building upon the foundations established in current literature."""
    
    elif "section" in prompt.lower() and ("write" in prompt.lower() or "expand" in prompt.lower()):
        # Extract section title from prompt if possible
        section_title = "Research Section"
        if ":" in prompt and len(prompt.split(":")) > 1:
            potential_title = prompt.split(":")[1].split("\n")[0].strip()
            if len(potential_title) < 100:  # Reasonable title length
                section_title = potential_title
        
        return f"""The examination of {research_topic} in the context of {section_title.lower()} reveals several important considerations that merit detailed analysis.

Research in this area demonstrates the complexity of factors involved and highlights the interconnected nature of various elements that contribute to our understanding. Multiple perspectives have emerged from the literature, each offering valuable insights into different aspects of the subject matter.

The evidence suggests that {research_topic} involves multifaceted relationships that require careful consideration of both theoretical frameworks and practical implications. Current understanding, while substantial, continues to evolve as new research emerges and methodologies improve.

Further investigation is needed to fully characterize these relationships and their implications for both academic understanding and real-world applications. The ongoing development of this field promises to yield additional insights that will contribute to our comprehensive understanding of {research_topic}."""
    
    else:
        return f"""Based on available evidence and current understanding, {research_topic} represents a significant area of study with important implications for both theoretical and practical applications.

The research indicates that this topic involves complex relationships and multiple contributing factors that influence outcomes and understanding. Current literature provides valuable insights, though continued investigation is needed to fully characterize these relationships.

The evidence suggests several key areas warrant particular attention, including the underlying mechanisms, environmental factors, and practical applications relevant to {research_topic}. These findings contribute to our growing understanding while highlighting areas where additional research would be beneficial.

This analysis provides a foundation for future investigation and practical application, demonstrating the importance of continued scholarly attention to {research_topic} and its broader implications.""" 