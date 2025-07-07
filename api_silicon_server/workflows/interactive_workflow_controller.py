"""
Interactive Workflow Controller - Real-time Feedback & Control

Provides real-time step-by-step feedback and interactive control for workflows.
Users can see what each step is doing and modify directions during execution.

Psychology-inspired design: Models the metacognitive awareness that allows
humans to monitor and control their own thinking processes.
"""

import asyncio
import json
import time
import uuid
from datetime import datetime
from typing import Dict, List, Any, Optional, Callable, Union
import logging
from dataclasses import dataclass, asdict
from enum import Enum

from .agent_workflow_engine import AgentWorkflow, WorkflowStep

# Set up logger  
controller_logger = logging.getLogger("InteractiveWorkflowController")
controller_logger.setLevel(logging.INFO)


class StepStatus(Enum):
    """Status of workflow step execution"""
    PENDING = "pending"
    RUNNING = "running" 
    PAUSED = "paused"
    COMPLETED = "completed"
    FAILED = "failed"
    SKIPPED = "skipped"
    MODIFIED = "modified"


@dataclass
class StepFeedback:
    """Real-time feedback from a workflow step"""
    step_id: str
    step_label: str
    status: StepStatus
    progress_percent: float
    current_action: str
    actions_completed: List[str]
    data_summary: Dict[str, Any]
    performance_metrics: Dict[str, Any]
    timestamp: str
    duration: float
    can_modify: bool = True
    modification_suggestions: List[str] = None


@dataclass 
class StepModification:
    """Modification instructions for a workflow step"""
    step_id: str
    modification_type: str  # "parameters", "direction", "skip", "retry"
    new_parameters: Dict[str, Any] = None
    new_direction: str = None
    reason: str = ""


class InteractiveWorkflowController:
    """
    Enhanced workflow controller with real-time feedback and interactive control.
    
    Provides metacognitive awareness of workflow execution, allowing users to:
    - See real-time feedback from each step
    - Modify step directions during execution  
    - Skip or retry steps
    - Adjust parameters on-the-fly
    - Monitor performance and quality metrics
    """
    
    def __init__(self, workflow: AgentWorkflow, feedback_callback: Callable = None):
        self.workflow = workflow
        self.feedback_callback = feedback_callback or self._default_feedback_handler
        self.step_feedbacks: Dict[str, StepFeedback] = {}
        self.step_modifications: Dict[str, StepModification] = {}
        self.execution_id = str(uuid.uuid4())[:8]
        self.is_paused = False
        self.current_step_index = 0
        self.user_interactions = []
        
        # Psychology-inspired monitoring
        self.metacognitive_state = {
            "awareness_level": "high",
            "confidence": 0.8,
            "control_exercised": [],
            "learning_from_feedback": True
        }
        
        controller_logger.info(f"🎮 Interactive controller initialized for workflow '{workflow.name}'")
    
    def _default_feedback_handler(self, feedback: StepFeedback):
        """Default feedback handler that logs step progress"""
        controller_logger.info(
            f"📊 Step [{feedback.step_label}] - {feedback.status.value} "
            f"({feedback.progress_percent:.1f}%) - {feedback.current_action}"
        )
    
    async def run_with_control(self, input_data: Any) -> Any:
        """
        Run workflow with interactive control and real-time feedback.
        
        Provides step-by-step execution with pause/modify/continue capabilities.
        """
        controller_logger.info(f"🚀 Starting interactive execution (ID: {self.execution_id})")
        
        if not self.workflow.steps:
            controller_logger.warning("⚠️ No steps in workflow")
            return input_data
        
        data = input_data
        execution_start = time.time()
        
        # Update workflow context with interactive capabilities
        self.workflow.context.update({
            "interactive_controller": self,
            "execution_id": self.execution_id,
            "feedback_enabled": True
        })
        
        try:
            for i, step in enumerate(self.workflow.steps):
                self.current_step_index = i
                
                # Check for modifications before execution
                await self._handle_step_modifications(step, i)
                
                # Check if step should be skipped
                if self._should_skip_step(step.label):
                    await self._skip_step(step, i)
                    continue
                
                # Execute step with real-time feedback
                data = await self._execute_step_with_feedback(step, i, data)
                
                # Handle pause state
                while self.is_paused:
                    controller_logger.info("⏸️ Workflow paused - waiting for user input")
                    await asyncio.sleep(0.5)
            
            total_duration = time.time() - execution_start
            controller_logger.info(f"🎉 Interactive execution completed in {total_duration:.2f}s")
            
            return data
            
        except Exception as e:
            controller_logger.error(f"❌ Interactive execution failed: {str(e)}")
            raise
    
    async def _execute_step_with_feedback(self, step: WorkflowStep, step_index: int, input_data: Any) -> Any:
        """Execute a step with comprehensive real-time feedback"""
        step_id = f"{self.execution_id}_{step_index}"
        start_time = time.time()
        
        # Initialize step feedback
        feedback = StepFeedback(
            step_id=step_id,
            step_label=step.label,
            status=StepStatus.RUNNING,
            progress_percent=0.0,
            current_action="Initializing step execution",
            actions_completed=[],
            data_summary=self._create_data_summary(input_data),
            performance_metrics={},
            timestamp=datetime.now().isoformat(),
            duration=0.0,
            modification_suggestions=self._get_modification_suggestions(step.label)
        )
        
        self.step_feedbacks[step_id] = feedback
        await self._send_feedback(feedback)
        
        try:
            # Pre-execution phase
            feedback.current_action = f"Preparing to execute {step.label}"
            feedback.progress_percent = 10.0
            await self._send_feedback(feedback)
            
            # Apply any parameters from modifications
            modified_context = self._apply_context_modifications(step.label)
            
            # Execute with monitoring
            feedback.current_action = f"Executing {step.label} with CBT awareness"
            feedback.progress_percent = 25.0
            feedback.actions_completed.append("Step preparation completed")
            await self._send_feedback(feedback)
            
            # Enhanced step execution with detailed monitoring
            result = await self._monitored_step_execution(step, input_data, modified_context, feedback)
            
            # Post-execution analysis
            feedback.current_action = "Analyzing step results and quality metrics"
            feedback.progress_percent = 90.0
            feedback.actions_completed.append("Step execution completed")
            await self._send_feedback(feedback)
            
            # Calculate performance metrics
            duration = time.time() - start_time
            feedback.duration = duration
            feedback.performance_metrics = self._calculate_step_metrics(step, input_data, result, duration)
            
            # Final update
            feedback.status = StepStatus.COMPLETED
            feedback.progress_percent = 100.0
            feedback.current_action = "Step completed successfully"
            feedback.actions_completed.append("Results analyzed and metrics calculated")
            feedback.data_summary.update(self._create_data_summary(result))
            await self._send_feedback(feedback)
            
            controller_logger.info(
                f"✅ Step [{step.label}] completed: "
                f"{feedback.performance_metrics.get('quality_score', 'N/A')} quality, "
                f"{duration:.2f}s duration"
            )
            
            return result
            
        except Exception as e:
            # Handle step failure with detailed feedback
            feedback.status = StepStatus.FAILED
            feedback.current_action = f"Step failed: {str(e)}"
            feedback.duration = time.time() - start_time
            feedback.performance_metrics["error"] = str(e)
            await self._send_feedback(feedback)
            
            controller_logger.error(f"❌ Step [{step.label}] failed: {str(e)}")
            raise
    
    async def _monitored_step_execution(self, step: WorkflowStep, input_data: Any, context: Dict, feedback: StepFeedback) -> Any:
        """Execute step with detailed progress monitoring"""
        
        # Add progress tracking to context
        context["progress_callback"] = lambda action, percent: asyncio.create_task(
            self._update_step_progress(feedback, action, percent)
        )
        
        # Execute the step function
        if asyncio.iscoroutinefunction(step.func):
            result = await step.func(input_data, context)
        else:
            result = step.func(input_data, context)
            if asyncio.iscoroutine(result):
                result = await result
        
        return result
    
    async def _update_step_progress(self, feedback: StepFeedback, action: str, percent: float):
        """Update step progress during execution"""
        feedback.current_action = action
        feedback.progress_percent = max(25.0, min(85.0, percent))  # Keep within execution range
        await self._send_feedback(feedback)
    
    def _create_data_summary(self, data: Any) -> Dict[str, Any]:
        """Create summary of data for feedback"""
        if isinstance(data, str):
            return {
                "type": "string",
                "length": len(data),
                "preview": data[:100] + "..." if len(data) > 100 else data,
                "word_count": len(data.split()) if data else 0
            }
        elif isinstance(data, list):
            return {
                "type": "list",
                "length": len(data),
                "preview": str(data[:3]) + "..." if len(data) > 3 else str(data),
                "item_types": list(set(type(item).__name__ for item in data[:10]))
            }
        elif isinstance(data, dict):
            return {
                "type": "dict",
                "keys": list(data.keys())[:10],
                "size": len(data),
                "preview": {k: str(v)[:50] for k, v in list(data.items())[:3]}
            }
        else:
            return {
                "type": type(data).__name__,
                "preview": str(data)[:100],
                "size": len(str(data))
            }
    
    def _calculate_step_metrics(self, step: WorkflowStep, input_data: Any, output_data: Any, duration: float) -> Dict[str, Any]:
        """Calculate comprehensive performance metrics for a step"""
        metrics = {
            "execution_time": duration,
            "input_size": len(str(input_data)),
            "output_size": len(str(output_data)),
            "throughput": len(str(output_data)) / duration if duration > 0 else 0,
            "step_complexity": self._estimate_step_complexity(step.label),
            "data_transformation_ratio": len(str(output_data)) / len(str(input_data)) if len(str(input_data)) > 0 else 1
        }
        
        # Add step-specific metrics
        if hasattr(self.workflow.context, 'step_output_details'):
            step_details = self.workflow.context.get('step_output_details', {})
            metrics.update(step_details.get('metrics', {}))
        
        # Calculate quality score based on multiple factors
        quality_factors = []
        
        # Time efficiency (faster is better, but not too fast)
        expected_time = self._get_expected_duration(step.label)
        time_efficiency = min(1.0, expected_time / duration) if duration > 0 else 0.5
        quality_factors.append(time_efficiency * 0.3)
        
        # Output richness (more detailed output generally better)
        output_richness = min(1.0, len(str(output_data)) / 1000)  # Normalize to 1000 chars
        quality_factors.append(output_richness * 0.4)
        
        # Step success (binary - did it complete without errors)
        quality_factors.append(0.3)  # 30% for successful completion
        
        metrics["quality_score"] = sum(quality_factors)
        
        return metrics
    
    def _estimate_step_complexity(self, step_label: str) -> str:
        """Estimate the complexity of a workflow step"""
        complex_indicators = ["synthesis", "analysis", "academic", "clarify", "finalize"]
        simple_indicators = ["search", "format", "extract"]
        
        label_lower = step_label.lower()
        
        if any(indicator in label_lower for indicator in complex_indicators):
            return "high"
        elif any(indicator in label_lower for indicator in simple_indicators):
            return "low"
        else:
            return "medium"
    
    def _get_expected_duration(self, step_label: str) -> float:
        """Get expected duration for different types of steps"""
        duration_map = {
            "search": 5.0,
            "clarify": 2.0,
            "synthesis": 8.0,
            "analysis": 6.0,
            "write": 4.0,
            "finalize": 3.0
        }
        
        label_lower = step_label.lower()
        for key, duration in duration_map.items():
            if key in label_lower:
                return duration
        
        return 3.0  # Default expected duration
    
    def _get_modification_suggestions(self, step_label: str) -> List[str]:
        """Get context-appropriate modification suggestions for a step"""
        suggestions_map = {
            "clarify": [
                "Adjust emotional preset (calm, curious, critical, empathetic)",
                "Change cognitive preset (analytical, creative, skeptical, balanced)",
                "Modify complexity detection sensitivity",
                "Skip clarification for simple queries"
            ],
            "search": [
                "Adjust number of search results (5-20)",
                "Change search region or language",
                "Modify search safety settings",
                "Add academic focus or general web focus"
            ],
            "synthesis": [
                "Adjust synthesis depth (brief, detailed, comprehensive)",
                "Change synthesis style (academic, creative, technical)",
                "Modify content inclusion criteria",
                "Skip synthesis for simple content"
            ],
            "write": [
                "Adjust section detail level",
                "Change writing style or tone",
                "Modify section structure",
                "Add or remove specific sections"
            ]
        }
        
        label_lower = step_label.lower()
        for key, suggestions in suggestions_map.items():
            if key in label_lower:
                return suggestions
        
        return [
            "Adjust step parameters",
            "Modify execution approach", 
            "Skip this step",
            "Retry with different settings"
        ]
    
    async def _send_feedback(self, feedback: StepFeedback):
        """Send feedback to the registered callback"""
        self.step_feedbacks[feedback.step_id] = feedback
        await asyncio.create_task(asyncio.coroutine(self.feedback_callback)(feedback))
    
    # Interactive Control Methods
    
    def pause_execution(self, reason: str = "User requested pause"):
        """Pause workflow execution"""
        self.is_paused = True
        self.user_interactions.append({
            "action": "pause",
            "reason": reason,
            "timestamp": datetime.now().isoformat(),
            "step_index": self.current_step_index
        })
        controller_logger.info(f"⏸️ Execution paused: {reason}")
    
    def resume_execution(self):
        """Resume paused workflow execution"""
        self.is_paused = False
        self.user_interactions.append({
            "action": "resume", 
            "timestamp": datetime.now().isoformat(),
            "step_index": self.current_step_index
        })
        controller_logger.info("▶️ Execution resumed")
    
    def modify_step(self, step_label: str, modification: StepModification):
        """Add a modification for a specific step"""
        self.step_modifications[step_label] = modification
        self.user_interactions.append({
            "action": "modify_step",
            "step_label": step_label,
            "modification_type": modification.modification_type,
            "timestamp": datetime.now().isoformat()
        })
        controller_logger.info(f"🔧 Step '{step_label}' marked for modification: {modification.modification_type}")
    
    def skip_step(self, step_label: str, reason: str = "User requested skip"):
        """Mark a step to be skipped"""
        modification = StepModification(
            step_id="",
            modification_type="skip",
            reason=reason
        )
        self.modify_step(step_label, modification)
    
    async def _handle_step_modifications(self, step: WorkflowStep, step_index: int):
        """Handle any pending modifications for a step"""
        if step.label in self.step_modifications:
            modification = self.step_modifications[step.label]
            controller_logger.info(f"🔧 Applying modification to step '{step.label}': {modification.modification_type}")
            
            if modification.modification_type == "parameters" and modification.new_parameters:
                self.workflow.context.update(modification.new_parameters)
            
            elif modification.modification_type == "direction" and modification.new_direction:
                # Store the new direction in context for the step to use
                self.workflow.context["step_direction_override"] = modification.new_direction
                self.workflow.context["step_modification_reason"] = modification.reason
    
    def _should_skip_step(self, step_label: str) -> bool:
        """Check if a step should be skipped"""
        if step_label in self.step_modifications:
            return self.step_modifications[step_label].modification_type == "skip"
        return False
    
    async def _skip_step(self, step: WorkflowStep, step_index: int):
        """Skip a step and record the action"""
        step_id = f"{self.execution_id}_{step_index}"
        
        feedback = StepFeedback(
            step_id=step_id,
            step_label=step.label,
            status=StepStatus.SKIPPED,
            progress_percent=100.0,
            current_action="Step skipped by user",
            actions_completed=["Step skipped"],
            data_summary={},
            performance_metrics={"skipped": True},
            timestamp=datetime.now().isoformat(),
            duration=0.0,
            can_modify=False
        )
        
        await self._send_feedback(feedback)
        controller_logger.info(f"⏭️ Step '{step.label}' skipped")
    
    def _apply_context_modifications(self, step_label: str) -> Dict:
        """Apply any context modifications for a step and return modified context"""
        context = self.workflow.context.copy()
        
        if step_label in self.step_modifications:
            modification = self.step_modifications[step_label]
            if modification.new_parameters:
                context.update(modification.new_parameters)
        
        return context
    
    # Monitoring and Analytics
    
    def get_execution_summary(self) -> Dict[str, Any]:
        """Get comprehensive summary of workflow execution"""
        completed_steps = [f for f in self.step_feedbacks.values() if f.status == StepStatus.COMPLETED]
        failed_steps = [f for f in self.step_feedbacks.values() if f.status == StepStatus.FAILED]
        skipped_steps = [f for f in self.step_feedbacks.values() if f.status == StepStatus.SKIPPED]
        
        total_duration = sum(f.duration for f in completed_steps)
        avg_quality = sum(f.performance_metrics.get("quality_score", 0) for f in completed_steps) / len(completed_steps) if completed_steps else 0
        
        return {
            "execution_id": self.execution_id,
            "workflow_name": self.workflow.name,
            "total_steps": len(self.workflow.steps),
            "completed_steps": len(completed_steps),
            "failed_steps": len(failed_steps),
            "skipped_steps": len(skipped_steps),
            "total_duration": total_duration,
            "average_quality_score": avg_quality,
            "user_interactions": len(self.user_interactions),
            "modifications_applied": len(self.step_modifications),
            "metacognitive_state": self.metacognitive_state,
            "step_details": [asdict(f) for f in self.step_feedbacks.values()]
        }
    
    def export_execution_log(self) -> str:
        """Export detailed execution log as JSON"""
        summary = self.get_execution_summary()
        summary["user_interactions_detail"] = self.user_interactions
        summary["step_modifications_detail"] = {k: asdict(v) for k, v in self.step_modifications.items()}
        
        return json.dumps(summary, indent=2)


# Convenience Functions

async def run_workflow_with_control(
    workflow: AgentWorkflow,
    input_data: Any,
    feedback_callback: Callable = None
) -> tuple[Any, InteractiveWorkflowController]:
    """
    Convenience function to run a workflow with interactive control.
    
    Returns both the result and the controller for further analysis.
    """
    controller = InteractiveWorkflowController(workflow, feedback_callback)
    result = await controller.run_with_control(input_data)
    return result, controller


def create_step_modification(
    modification_type: str,
    new_parameters: Dict[str, Any] = None,
    new_direction: str = None,
    reason: str = ""
) -> StepModification:
    """Helper function to create step modifications"""
    return StepModification(
        step_id="",
        modification_type=modification_type,
        new_parameters=new_parameters,
        new_direction=new_direction,
        reason=reason
    ) 