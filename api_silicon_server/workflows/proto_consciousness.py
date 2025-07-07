"""
ProtoConsciousness - CBT-Informed Cognitive Clarification Engine

A psychological awareness system that applies Cognitive Behavioral Therapy principles
to detect cognitive distortions, emotional biases, and logical fallacies in AI
processing. This module helps clarify intentions and reduce systematic errors
in reasoning before they propagate through the workflow.

Inspired by CBT, metacognitive therapy, and the bicameral mind concept.
"""

import time
import uuid
from datetime import datetime, timezone
from typing import Dict, List, Optional, Any
import logging
import re


class CognitiveDistortion:
    """Represents a specific type of cognitive distortion that can be detected"""
    
    def __init__(self, name: str, description: str, pattern: str, correction_strategy: str):
        self.name = name
        self.description = description
        self.pattern = pattern  # Regex or keyword pattern to detect
        self.correction_strategy = correction_strategy


class EmotionalState:
    """Tracks emotional context and its influence on reasoning"""
    
    def __init__(self):
        self.valence = 0.0  # -1 (negative) to +1 (positive)
        self.arousal = 0.0  # 0 (calm) to 1 (excited)
        self.confidence = 0.5  # 0 (uncertain) to 1 (certain)
        self.urgency = 0.0  # 0 (no hurry) to 1 (urgent)
        self.detected_emotions = []
        self.emotional_triggers = []


class CognitiveFrame:
    """Represents the current cognitive context and perspective"""
    
    def __init__(self):
        self.perspective = "analytical"  # analytical, creative, critical, empathetic
        self.scope = "broad"  # narrow, focused, broad, holistic
        self.time_horizon = "present"  # past, present, future, eternal
        self.complexity_preference = "moderate"  # simple, moderate, complex
        self.certainty_tolerance = 0.5  # 0 (need certainty) to 1 (comfortable with ambiguity)
        self.biases_detected = []
        self.assumptions_made = []


class ProtoConsciousness:
    """
    CBT-Informed Cognitive Awareness System
    
    This system models metacognitive awareness - the ability to think about thinking.
    It applies CBT principles to detect and correct cognitive distortions,
    emotional biases, and logical fallacies in AI reasoning processes.
    """
    
    def __init__(self):
        self.session_id = str(uuid.uuid4())
        self.created_at = datetime.now(timezone.utc)
        self.emotional_state = EmotionalState()
        self.cognitive_frame = CognitiveFrame()
        self.consciousness_history = []
        self.sub_contexts = {}  # Named contexts for different topics
        self.cognitive_distortions = self._initialize_distortion_patterns()
        self.metacognitive_insights = []
        
        # CBT-style thought record
        self.thought_record = {
            "automatic_thoughts": [],
            "cognitive_distortions": [],
            "evidence_for": [],
            "evidence_against": [],
            "balanced_thoughts": [],
            "emotional_responses": []
        }
        
        # Logging
        self.logger = logging.getLogger("ProtoConsciousness")
        self.logger.setLevel(logging.INFO)
        
        self.logger.info(f"🧘 ProtoConsciousness initialized (Session: {self.session_id[:8]})")
    
    def _initialize_distortion_patterns(self) -> List[CognitiveDistortion]:
        """Initialize common cognitive distortion patterns based on CBT literature"""
        return [
            CognitiveDistortion(
                "All-or-Nothing Thinking",
                "Seeing things in black and white categories",
                r'\b(always|never|all|none|everything|nothing|completely|totally)\b',
                "Look for middle ground and gradations"
            ),
            CognitiveDistortion(
                "Overgeneralization",
                "Drawing broad conclusions from single events",
                r'\b(all .+ are|everyone .+ is|this proves that|this means that)\b',
                "Consider specific context and multiple examples"
            ),
            CognitiveDistortion(
                "Mental Filter",
                "Focusing only on negative aspects while ignoring positives",
                r'\b(only|just|but|however|except)\b.*\b(problem|issue|wrong|bad|negative)\b',
                "Actively seek balanced evidence and positive aspects"
            ),
            CognitiveDistortion(
                "Jumping to Conclusions",
                "Making assumptions without evidence",
                r'\b(obviously|clearly|must be|definitely|certainly) (?!.*evidence|.*proof|.*data)\b',
                "Seek evidence and consider alternative explanations"
            ),
            CognitiveDistortion(
                "Catastrophizing",
                "Expecting the worst possible outcome",
                r'\b(disaster|catastrophe|terrible|awful|worst|ruin|destroy|devastating)\b',
                "Consider more likely and moderate outcomes"
            ),
            CognitiveDistortion(
                "Emotional Reasoning",
                "Believing that feelings reflect facts",
                r'\bi feel.* so it must be|because .* feel|my feelings tell me\b',
                "Distinguish between emotions and objective evidence"
            ),
            CognitiveDistortion(
                "Should Statements",
                "Using rigid rules about how things should be",
                r'\b(should|must|ought to|have to|need to) (?!.*consider|.*explore)\b',
                "Replace with preferences and flexible thinking"
            ),
            CognitiveDistortion(
                "Personalization",
                "Taking responsibility for things outside your control",
                r'\bit\'s my fault|i caused|because of me|i should have\b',
                "Consider external factors and shared responsibility"
            )
        ]
    
    def update_sub_context(self, context_name: str, context_data: Any):
        """Update a specific sub-context (e.g., 'Research Topic', 'User Intent')"""
        self.sub_contexts[context_name] = {
            "data": context_data,
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "processing_notes": []
        }
        
        self.logger.info(f"📝 Updated sub-context '{context_name}'")
    
    def realize_self_bias(self) -> Dict[str, Any]:
        """
        Perform metacognitive reflection to identify potential biases and assumptions.
        This is inspired by CBT's emphasis on identifying automatic thoughts.
        """
        self.logger.info("🔍 Performing self-bias realization...")
        
        bias_analysis = {
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "detected_biases": [],
            "assumptions_identified": [],
            "cognitive_distortions": [],
            "emotional_influences": [],
            "metacognitive_insights": [],
            "corrective_actions": []
        }
        
        # Analyze current emotional state for bias potential
        if self.emotional_state.arousal > 0.7:
            bias_analysis["emotional_influences"].append({
                "type": "high_arousal",
                "description": "High arousal may lead to hasty decisions",
                "recommendation": "Take time to cool down and reassess"
            })
        
        if self.emotional_state.valence < -0.3:
            bias_analysis["emotional_influences"].append({
                "type": "negative_valence",
                "description": "Negative emotional state may bias toward pessimistic interpretations",
                "recommendation": "Actively seek balanced and positive evidence"
            })
        
        if self.emotional_state.confidence > 0.8:
            bias_analysis["detected_biases"].append({
                "type": "overconfidence_bias",
                "description": "High confidence may prevent consideration of alternatives",
                "recommendation": "Actively seek disconfirming evidence"
            })
        
        # Analyze cognitive frame for potential limitations
        if self.cognitive_frame.scope == "narrow":
            bias_analysis["assumptions_identified"].append({
                "assumption": "Current narrow focus may miss important context",
                "corrective_action": "Expand scope to consider broader implications"
            })
        
        if self.cognitive_frame.certainty_tolerance < 0.3:
            bias_analysis["detected_biases"].append({
                "type": "intolerance_of_ambiguity",
                "description": "Low tolerance for uncertainty may lead to premature closure",
                "recommendation": "Practice sitting with uncertainty and exploring multiple possibilities"
            })
        
        # Add metacognitive insight
        insight = f"Current perspective: {self.cognitive_frame.perspective}, " \
                 f"emotional valence: {self.emotional_state.valence:.2f}, " \
                 f"confidence: {self.emotional_state.confidence:.2f}"
        
        bias_analysis["metacognitive_insights"].append(insight)
        self.metacognitive_insights.append(bias_analysis)
        
        self.logger.info(f"🧘 Self-bias analysis complete: {len(bias_analysis['detected_biases'])} biases, "
                        f"{len(bias_analysis['assumptions_identified'])} assumptions identified")
        
        return bias_analysis
    
    def realize_emotions(self) -> Dict[str, Any]:
        """
        Perform emotional awareness and regulation based on CBT principles.
        This helps identify how emotions might be influencing reasoning.
        """
        self.logger.info("❤️ Performing emotional realization...")
        
        emotional_analysis = {
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "current_emotional_state": {
                "valence": self.emotional_state.valence,
                "arousal": self.emotional_state.arousal,
                "confidence": self.emotional_state.confidence,
                "urgency": self.emotional_state.urgency
            },
            "detected_emotions": self.emotional_state.detected_emotions,
            "emotional_triggers": self.emotional_state.emotional_triggers,
            "emotion_cognition_links": [],
            "regulation_strategies": []
        }
        
        # Identify emotion-cognition links
        if self.emotional_state.valence < -0.5:
            emotional_analysis["emotion_cognition_links"].append({
                "emotion": "negative_valence",
                "cognitive_impact": "May bias toward negative interpretations and worst-case scenarios",
                "regulation_strategy": "Practice cognitive reframing and balanced thinking"
            })
        
        if self.emotional_state.urgency > 0.7:
            emotional_analysis["emotion_cognition_links"].append({
                "emotion": "high_urgency",
                "cognitive_impact": "May lead to impulsive decisions and reduced deliberation",
                "regulation_strategy": "Take a step back and practice mindful breathing"
            })
        
        if self.emotional_state.confidence < 0.3:
            emotional_analysis["emotion_cognition_links"].append({
                "emotion": "low_confidence",
                "cognitive_impact": "May lead to excessive doubt and analysis paralysis",
                "regulation_strategy": "Focus on available evidence and take action despite uncertainty"
            })
        
        # Add regulation strategies based on current state
        if self.emotional_state.arousal > 0.6:
            emotional_analysis["regulation_strategies"].append({
                "strategy": "grounding_technique",
                "description": "Use 5-4-3-2-1 sensory grounding to reduce arousal",
                "implementation": "Notice 5 things you can see, 4 you can touch, 3 you can hear, 2 you can smell, 1 you can taste"
            })
        
        if self.emotional_state.valence < -0.4:
            emotional_analysis["regulation_strategies"].append({
                "strategy": "cognitive_reframing",
                "description": "Challenge negative automatic thoughts with evidence",
                "implementation": "Ask: What evidence supports this thought? What evidence contradicts it? What would I tell a friend in this situation?"
            })
        
        self.logger.info(f"❤️ Emotional analysis complete: "
                        f"valence {self.emotional_state.valence:.2f}, "
                        f"arousal {self.emotional_state.arousal:.2f}")
        
        return emotional_analysis
    
    def detect_cognitive_distortions(self, input_text: str) -> List[Dict[str, Any]]:
        """
        Analyze input text for cognitive distortions using CBT-based pattern recognition.
        """
        self.logger.info("🔍 Scanning for cognitive distortions...")
        
        detected_distortions = []
        input_lower = input_text.lower()
        
        for distortion in self.cognitive_distortions:
            pattern_matches = re.findall(distortion.pattern, input_lower, re.IGNORECASE)
            
            if pattern_matches:
                detected_distortions.append({
                    "distortion_type": distortion.name,
                    "description": distortion.description,
                    "matches": pattern_matches,
                    "correction_strategy": distortion.correction_strategy,
                    "confidence": len(pattern_matches) * 0.2  # Simple confidence scoring
                })
                
                # Update thought record
                self.thought_record["cognitive_distortions"].append({
                    "type": distortion.name,
                    "evidence": pattern_matches,
                    "timestamp": datetime.now(timezone.utc).isoformat()
                })
        
        if detected_distortions:
            self.logger.info(f"⚠️ Detected {len(detected_distortions)} potential cognitive distortions")
        else:
            self.logger.info("✅ No obvious cognitive distortions detected")
        
        return detected_distortions
    
    def clarify_intent(self, input_text: str) -> str:
        """
        Apply CBT-style clarification to understand the true intent behind the input.
        This involves examining automatic thoughts and looking for underlying needs.
        """
        self.logger.info("💡 Clarifying intent using CBT principles...")
        
        # Record automatic thought
        self.thought_record["automatic_thoughts"].append({
            "thought": input_text,
            "timestamp": datetime.now(timezone.utc).isoformat()
        })
        
        # Detect distortions
        distortions = self.detect_cognitive_distortions(input_text)
        
        # Begin clarification process
        clarification_questions = [
            "What is the core need or goal behind this request?",
            "What assumptions am I making about this situation?",
            "What would be different about this request if I were feeling completely calm and neutral?",
            "What evidence do I have for my current interpretation?",
            "How might someone with a different perspective view this request?",
            "What would be most helpful to focus on right now?"
        ]
        
        # Apply cognitive restructuring
        clarified_intent = input_text
        
        # If distortions were found, apply corrections
        if distortions:
            clarified_intent += "\n\n[ProtoConsciousness Clarification]:\n"
            for distortion in distortions:
                clarified_intent += f"- Detected {distortion['distortion_type']}: {distortion['correction_strategy']}\n"
            
            clarified_intent += "\nConsidering these patterns, the refined request focuses on:\n"
            clarified_intent += "- Gathering balanced evidence rather than confirming existing beliefs\n"
            clarified_intent += "- Exploring multiple perspectives rather than a single viewpoint\n"
            clarified_intent += "- Maintaining intellectual humility and openness to new information\n"
        
        # Add emotional context if relevant
        if abs(self.emotional_state.valence) > 0.3 or self.emotional_state.arousal > 0.5:
            clarified_intent += f"\n[Emotional Context]: Current emotional state (valence: {self.emotional_state.valence:.2f}, arousal: {self.emotional_state.arousal:.2f}) may be influencing this request. Proceeding with awareness of emotional biases.\n"
        
        self.logger.info("💡 Intent clarification complete")
        return clarified_intent
    
    def respond(self, input_text: str) -> str:
        """
        Generate a CBT-informed response that incorporates metacognitive awareness.
        """
        self.logger.info("🗣️ Generating CBT-informed response...")
        
        # Update consciousness history
        interaction = {
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "input": input_text,
            "emotional_state": self.emotional_state.__dict__.copy(),
            "cognitive_frame": self.cognitive_frame.__dict__.copy()
        }
        
        # Perform CBT-style analysis
        bias_analysis = self.realize_self_bias()
        emotional_analysis = self.realize_emotions()
        clarified_intent = self.clarify_intent(input_text)
        
        # Generate metacognitive response
        response = f"""I notice this request and want to approach it with cognitive awareness.

{clarified_intent}

Before proceeding, I'm applying metacognitive reflection:

Emotional State Check:
- Emotional valence: {self.emotional_state.valence:.2f} (-1 negative, +1 positive)
- Confidence level: {self.emotional_state.confidence:.2f}
- Potential emotional biases: {len(emotional_analysis.get('emotion_cognition_links', []))} identified

Cognitive Bias Check:
- Potential biases detected: {len(bias_analysis.get('detected_biases', []))}
- Assumptions to examine: {len(bias_analysis.get('assumptions_identified', []))}
- Distortion patterns: {len(self.detect_cognitive_distortions(input_text))} found

With this awareness, I can now proceed more thoughtfully and with reduced systematic errors in my reasoning."""

        # Record the interaction
        interaction["response"] = response
        interaction["bias_analysis"] = bias_analysis
        interaction["emotional_analysis"] = emotional_analysis
        self.consciousness_history.append(interaction)
        
        self.logger.info("🗣️ CBT-informed response generated")
        return response
    
    def update_emotional_state(self, valence: float = None, arousal: float = None, 
                             confidence: float = None, urgency: float = None):
        """Update the current emotional state"""
        if valence is not None:
            self.emotional_state.valence = max(-1.0, min(1.0, valence))
        if arousal is not None:
            self.emotional_state.arousal = max(0.0, min(1.0, arousal))
        if confidence is not None:
            self.emotional_state.confidence = max(0.0, min(1.0, confidence))
        if urgency is not None:
            self.emotional_state.urgency = max(0.0, min(1.0, urgency))
        
        self.logger.info(f"🎭 Emotional state updated: v={self.emotional_state.valence:.2f}, "
                        f"a={self.emotional_state.arousal:.2f}, c={self.emotional_state.confidence:.2f}")
    
    def update_cognitive_frame(self, perspective: str = None, scope: str = None, 
                              time_horizon: str = None, complexity_preference: str = None):
        """Update the current cognitive frame"""
        if perspective:
            self.cognitive_frame.perspective = perspective
        if scope:
            self.cognitive_frame.scope = scope
        if time_horizon:
            self.cognitive_frame.time_horizon = time_horizon
        if complexity_preference:
            self.cognitive_frame.complexity_preference = complexity_preference
        
        self.logger.info(f"🧠 Cognitive frame updated: {self.cognitive_frame.perspective} perspective, "
                        f"{self.cognitive_frame.scope} scope")
    
    def get_consciousness_summary(self) -> Dict[str, Any]:
        """Get a summary of the current consciousness state"""
        return {
            "session_id": self.session_id,
            "created_at": self.created_at.isoformat(),
            "current_emotional_state": self.emotional_state.__dict__,
            "current_cognitive_frame": self.cognitive_frame.__dict__,
            "total_interactions": len(self.consciousness_history),
            "sub_contexts": list(self.sub_contexts.keys()),
            "metacognitive_insights_count": len(self.metacognitive_insights),
            "thought_record_summary": {
                "automatic_thoughts": len(self.thought_record["automatic_thoughts"]),
                "distortions_detected": len(self.thought_record["cognitive_distortions"]),
                "balanced_thoughts": len(self.thought_record["balanced_thoughts"])
            }
        }
    
    def reset_session(self):
        """Reset the consciousness session while preserving learned patterns"""
        self.session_id = str(uuid.uuid4())
        self.created_at = datetime.now(timezone.utc)
        self.consciousness_history.clear()
        self.sub_contexts.clear()
        self.metacognitive_insights.clear()
        
        # Reset thought record
        self.thought_record = {
            "automatic_thoughts": [],
            "cognitive_distortions": [],
            "evidence_for": [],
            "evidence_against": [],
            "balanced_thoughts": [],
            "emotional_responses": []
        }
        
        # Reset emotional state to neutral
        self.emotional_state = EmotionalState()
        
        self.logger.info(f"🔄 ProtoConsciousness session reset (New session: {self.session_id[:8]})") 