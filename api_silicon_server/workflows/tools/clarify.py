"""
Clarification Tools - CBT-Informed Intent Understanding

Uses ProtoConsciousness to apply Cognitive Behavioral Therapy principles
for detecting cognitive distortions, emotional biases, and clarifying
the true intent behind research requests.
"""

import logging
from typing import Any, Dict
from ..proto_consciousness import ProtoConsciousness

# Set up logger
clarify_logger = logging.getLogger("WorkflowTools.Clarify")
clarify_logger.setLevel(logging.INFO)


def clarify_request(input_data: Any, context: Dict) -> str:
    """
    Basic request clarification using ProtoConsciousness CBT principles.
    
    This is the primary clarification tool for the research workflow.
    It applies cognitive bias detection and emotional awareness to
    understand the true intent behind a research request.
    
    Args:
        input_data: The initial research request or query
        context: Workflow context containing proto_ai instance and other resources
    
    Returns:
        str: Clarified and CBT-informed research request
    """
    clarify_logger.info("🧘 Starting CBT-informed request clarification...")
    
    try:
        # Get or create ProtoConsciousness instance
        proto = context.get("proto_ai")
        if not proto:
            clarify_logger.info("🆕 Creating new ProtoConsciousness instance")
            proto = ProtoConsciousness()
            context["proto_ai"] = proto
        
        # Convert input to string if needed
        request_text = str(input_data) if not isinstance(input_data, str) else input_data
        
        # Apply CBT-informed clarification process
        clarify_logger.info("🔍 Applying cognitive bias detection...")
        proto.realize_self_bias()
        
        clarify_logger.info("❤️ Analyzing emotional context...")
        proto.update_sub_context("Research Request", request_text)
        proto.realize_emotions()
        
        # Generate clarified request
        clarify_logger.info("💡 Generating clarified request...")
        clarified_request = proto.clarify_intent(request_text)
        
        # Update context with clarification metadata
        context.update({
            "clarification_applied": True,
            "original_request": request_text,
            "consciousness_session": proto.session_id,
            "emotional_state": proto.emotional_state.__dict__,
            "cognitive_frame": proto.cognitive_frame.__dict__
        })
        
        clarify_logger.info("✅ Request clarification completed successfully")
        return clarified_request
        
    except Exception as e:
        clarify_logger.error(f"❌ Clarification failed: {str(e)}")
        # Return original input if clarification fails
        return str(input_data) if not isinstance(input_data, str) else input_data


def clarify_with_cbt(input_data: Any, context: Dict, 
                     emotional_preset: str = None,
                     cognitive_preset: str = None) -> str:
    """
    Advanced CBT clarification with preset emotional and cognitive configurations.
    
    This allows for specialized clarification based on specific research contexts
    (e.g., sensitive topics, urgent research, creative exploration).
    
    Args:
        input_data: The research request to clarify
        context: Workflow context
        emotional_preset: Preset emotional configuration (calm, curious, critical, empathetic)
        cognitive_preset: Preset cognitive configuration (analytical, creative, skeptical, balanced)
    
    Returns:
        str: Clarified request with specialized CBT application
    """
    clarify_logger.info(f"🧘 Advanced CBT clarification with presets: {emotional_preset}, {cognitive_preset}")
    
    try:
        # Get or create ProtoConsciousness instance
        proto = context.get("proto_ai")
        if not proto:
            proto = ProtoConsciousness()
            context["proto_ai"] = proto
        
        # Apply emotional preset
        if emotional_preset:
            if emotional_preset == "calm":
                proto.update_emotional_state(valence=0.2, arousal=0.2, confidence=0.7, urgency=0.1)
            elif emotional_preset == "curious":
                proto.update_emotional_state(valence=0.5, arousal=0.6, confidence=0.5, urgency=0.3)
            elif emotional_preset == "critical":
                proto.update_emotional_state(valence=0.0, arousal=0.4, confidence=0.8, urgency=0.2)
            elif emotional_preset == "empathetic":
                proto.update_emotional_state(valence=0.3, arousal=0.3, confidence=0.6, urgency=0.4)
        
        # Apply cognitive preset
        if cognitive_preset:
            if cognitive_preset == "analytical":
                proto.update_cognitive_frame(
                    perspective="analytical", 
                    scope="focused", 
                    complexity_preference="complex"
                )
            elif cognitive_preset == "creative":
                proto.update_cognitive_frame(
                    perspective="creative", 
                    scope="broad", 
                    complexity_preference="moderate"
                )
            elif cognitive_preset == "skeptical":
                proto.update_cognitive_frame(
                    perspective="critical", 
                    scope="narrow", 
                    complexity_preference="simple"
                )
            elif cognitive_preset == "balanced":
                proto.update_cognitive_frame(
                    perspective="empathetic", 
                    scope="broad", 
                    complexity_preference="moderate"
                )
        
        # Convert input to string
        request_text = str(input_data) if not isinstance(input_data, str) else input_data
        
        # Apply specialized CBT process
        clarify_logger.info("🔬 Applying specialized cognitive analysis...")
        
        # Enhanced bias detection with preset awareness
        bias_analysis = proto.realize_self_bias()
        emotional_analysis = proto.realize_emotions()
        
        # Generate enhanced clarification
        proto.update_sub_context("Advanced Research Request", {
            "text": request_text,
            "emotional_preset": emotional_preset,
            "cognitive_preset": cognitive_preset,
            "preset_rationale": f"Using {emotional_preset} emotional state and {cognitive_preset} cognitive frame for specialized research clarity"
        })
        
        clarified_request = proto.clarify_intent(request_text)
        
        # Add preset-specific guidance
        if emotional_preset or cognitive_preset:
            clarified_request += f"\n\n[Specialized CBT Configuration Applied]:\n"
            if emotional_preset:
                clarified_request += f"- Emotional preset: {emotional_preset} (optimized for this research context)\n"
            if cognitive_preset:
                clarified_request += f"- Cognitive preset: {cognitive_preset} (specialized analytical approach)\n"
            
            clarified_request += "\nThis configuration enhances:\n"
            if emotional_preset == "curious":
                clarified_request += "- Open-minded exploration and questioning\n"
                clarified_request += "- Balanced consideration of multiple perspectives\n"
            elif emotional_preset == "critical":
                clarified_request += "- Rigorous evaluation of evidence\n"
                clarified_request += "- Skeptical examination of claims\n"
            elif cognitive_preset == "analytical":
                clarified_request += "- Systematic breakdown of complex topics\n"
                clarified_request += "- Focus on logical relationships and evidence\n"
            elif cognitive_preset == "creative":
                clarified_request += "- Novel connections and innovative thinking\n"
                clarified_request += "- Broad exploration of possibilities\n"
        
        # Update context with advanced metadata
        context.update({
            "advanced_clarification_applied": True,
            "emotional_preset": emotional_preset,
            "cognitive_preset": cognitive_preset,
            "bias_analysis": bias_analysis,
            "emotional_analysis": emotional_analysis,
            "consciousness_summary": proto.get_consciousness_summary()
        })
        
        clarify_logger.info("✅ Advanced CBT clarification completed successfully")
        return clarified_request
        
    except Exception as e:
        clarify_logger.error(f"❌ Advanced clarification failed: {str(e)}")
        # Fallback to basic clarification
        clarify_logger.info("🔄 Falling back to basic clarification...")
        return clarify_request(input_data, context)


def detect_research_complexity(input_data: Any, context: Dict) -> Dict[str, Any]:
    """
    Analyze the complexity and sensitivity of a research request to determine
    the appropriate CBT clarification approach.
    
    Args:
        input_data: The research request
        context: Workflow context
    
    Returns:
        Dict: Complexity analysis with recommended clarification approach
    """
    clarify_logger.info("🔍 Analyzing research complexity...")
    
    request_text = str(input_data) if not isinstance(input_data, str) else input_data
    request_lower = request_text.lower()
    
    complexity_indicators = {
        "high_sensitivity": any(term in request_lower for term in [
            "trauma", "abuse", "violence", "suicide", "mental health", "therapy",
            "controversial", "political", "religious", "ethical dilemma"
        ]),
        "high_technical": any(term in request_lower for term in [
            "algorithm", "statistical", "mathematical", "technical", "scientific method",
            "methodology", "experimental design", "data analysis"
        ]),
        "high_ambiguity": any(term in request_lower for term in [
            "meaning of", "purpose of", "why does", "philosophical", "abstract",
            "conceptual", "theoretical", "meaning"
        ]),
        "urgent_context": any(term in request_lower for term in [
            "urgent", "immediate", "asap", "deadline", "emergency", "crisis"
        ]),
        "broad_scope": any(term in request_lower for term in [
            "comprehensive", "complete", "everything about", "all aspects",
            "thorough", "exhaustive", "holistic"
        ])
    }
    
    # Calculate complexity score
    complexity_score = sum(complexity_indicators.values())
    
    # Recommend clarification approach
    if complexity_indicators["high_sensitivity"]:
        recommended_approach = {
            "emotional_preset": "empathetic",
            "cognitive_preset": "balanced",
            "rationale": "Sensitive topic requires empathetic and balanced approach"
        }
    elif complexity_indicators["high_technical"]:
        recommended_approach = {
            "emotional_preset": "calm",
            "cognitive_preset": "analytical",
            "rationale": "Technical topic benefits from calm and analytical approach"
        }
    elif complexity_indicators["high_ambiguity"]:
        recommended_approach = {
            "emotional_preset": "curious",
            "cognitive_preset": "creative",
            "rationale": "Ambiguous topic requires curious and creative exploration"
        }
    elif complexity_indicators["urgent_context"]:
        recommended_approach = {
            "emotional_preset": "calm",
            "cognitive_preset": "skeptical",
            "rationale": "Urgent context benefits from calm and focused approach"
        }
    else:
        recommended_approach = {
            "emotional_preset": "curious",
            "cognitive_preset": "balanced",
            "rationale": "Standard research benefits from curious and balanced approach"
        }
    
    analysis = {
        "complexity_score": complexity_score,
        "complexity_indicators": complexity_indicators,
        "recommended_approach": recommended_approach,
        "requires_advanced_clarification": complexity_score >= 2
    }
    
    clarify_logger.info(f"📊 Complexity analysis: score={complexity_score}, "
                       f"recommended={recommended_approach['emotional_preset']}/{recommended_approach['cognitive_preset']}")
    
    return analysis


def auto_clarify_research_request(input_data: Any, context: Dict) -> str:
    """
    Automatically apply the most appropriate clarification approach based on
    research complexity analysis.
    
    This is the "smart" clarification tool that adapts its approach based on
    the detected characteristics of the research request.
    
    Args:
        input_data: The research request
        context: Workflow context
    
    Returns:
        str: Optimally clarified research request
    """
    clarify_logger.info("🤖 Starting auto-adaptive research clarification...")
    
    try:
        # Analyze complexity
        complexity_analysis = detect_research_complexity(input_data, context)
        
        # Store analysis in context
        context["complexity_analysis"] = complexity_analysis
        
        # Apply appropriate clarification
        if complexity_analysis["requires_advanced_clarification"]:
            clarify_logger.info("🧠 Applying advanced CBT clarification...")
            recommended = complexity_analysis["recommended_approach"]
            return clarify_with_cbt(
                input_data, 
                context,
                emotional_preset=recommended["emotional_preset"],
                cognitive_preset=recommended["cognitive_preset"]
            )
        else:
            clarify_logger.info("🧘 Applying standard CBT clarification...")
            return clarify_request(input_data, context)
            
    except Exception as e:
        clarify_logger.error(f"❌ Auto-clarification failed: {str(e)}")
        # Ultimate fallback to basic clarification
        return clarify_request(input_data, context) 