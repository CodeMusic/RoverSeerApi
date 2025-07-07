"""
Agent Workflow Engine - Core Cognitive Processing Chain

A psychologically-aware workflow system that models how human cognition
processes complex tasks through sequential steps with shared context.
Each step represents a cognitive faculty (perception, analysis, synthesis).
"""

import time
import uuid
import asyncio
import inspect
import json
import traceback
from datetime import datetime
from typing import Dict, List, Callable, Any, Optional
import logging

# Set up workflow logger
workflow_logger = logging.getLogger("WorkflowEngine")
workflow_logger.setLevel(logging.INFO)

# Add file handler for comprehensive logging
handler = logging.FileHandler('logs/workflow_engine_detailed.log')
formatter = logging.Formatter('%(asctime)s | %(name)s | %(levelname)s | %(message)s')
handler.setFormatter(formatter)
workflow_logger.addHandler(handler)


class PipelineTracker:
    """
    Comprehensive pipeline execution tracker with detailed step monitoring
    """
    
    def __init__(self, workflow_id: str, workflow_name: str):
        self.workflow_id = workflow_id
        self.workflow_name = workflow_name
        self.pipeline_start_time = None
        self.pipeline_end_time = None
        self.total_steps = 0
        self.completed_steps = 0
        self.failed_steps = 0
        self.skipped_steps = 0
        self.step_execution_log = []
        self.performance_metrics = {}
        self.execution_phases = []
        
    def start_pipeline(self, total_steps: int):
        """Initialize pipeline tracking"""
        self.pipeline_start_time = datetime.now()
        self.total_steps = total_steps
        self.execution_phases.append({
            'phase': 'initialization',
            'timestamp': self.pipeline_start_time.isoformat(),
            'details': f'Pipeline {self.workflow_name} starting with {total_steps} steps'
        })
        
        workflow_logger.info(f"🚀 PIPELINE START: {self.workflow_name} (ID: {self.workflow_id}) - {total_steps} steps")
        
    def log_step_start(self, step_index: int, step_label: str, step_description: str):
        """Log the start of a pipeline step"""
        timestamp = datetime.now()
        step_log = {
            'step_index': step_index,
            'step_label': step_label,
            'step_description': step_description,
            'start_time': timestamp,
            'status': 'starting',
            'details': [],
            'input_data_summary': None,
            'output_data_summary': None,
            'performance_data': {}
        }
        
        self.step_execution_log.append(step_log)
        
        workflow_logger.info(f"📋 STEP {step_index + 1}/{self.total_steps} STARTING: {step_label}")
        workflow_logger.info(f"   📝 Description: {step_description}")
        
    def log_step_progress(self, step_index: int, progress_details: str, progress_percent: float = None):
        """Log progress during step execution"""
        if step_index < len(self.step_execution_log):
            step_log = self.step_execution_log[step_index]
            step_log['details'].append({
                'timestamp': datetime.now().isoformat(),
                'progress': progress_details,
                'progress_percent': progress_percent
            })
            
            progress_str = f" ({progress_percent:.1f}%)" if progress_percent else ""
            workflow_logger.info(f"   ⚡ PROGRESS{progress_str}: {progress_details}")
    
    def log_step_completion(self, step_index: int, execution_time: float, result_summary: str, 
                           input_summary: str = None, output_summary: str = None):
        """Log successful step completion"""
        if step_index < len(self.step_execution_log):
            step_log = self.step_execution_log[step_index]
            step_log['end_time'] = datetime.now()
            step_log['execution_time'] = execution_time
            step_log['status'] = 'completed'
            step_log['result_summary'] = result_summary
            step_log['input_data_summary'] = input_summary
            step_log['output_data_summary'] = output_summary
            
            self.completed_steps += 1
            
            workflow_logger.info(f"✅ STEP {step_index + 1}/{self.total_steps} COMPLETED: {step_log['step_label']}")
            workflow_logger.info(f"   ⏱️ Duration: {execution_time:.2f}s")
            workflow_logger.info(f"   📊 Result: {result_summary}")
            if input_summary:
                workflow_logger.info(f"   📥 Input: {input_summary}")
            if output_summary:
                workflow_logger.info(f"   📤 Output: {output_summary}")
    
    def log_step_failure(self, step_index: int, error: Exception, execution_time: float):
        """Log step failure with detailed error information"""
        if step_index < len(self.step_execution_log):
            step_log = self.step_execution_log[step_index]
            step_log['end_time'] = datetime.now()
            step_log['execution_time'] = execution_time
            step_log['status'] = 'failed'
            step_log['error'] = str(error)
            step_log['error_type'] = type(error).__name__
            step_log['traceback'] = traceback.format_exc()
            
            self.failed_steps += 1
            
            workflow_logger.error(f"❌ STEP {step_index + 1}/{self.total_steps} FAILED: {step_log['step_label']}")
            workflow_logger.error(f"   ⏱️ Duration: {execution_time:.2f}s")
            workflow_logger.error(f"   🚨 Error: {str(error)}")
            workflow_logger.error(f"   🔍 Error Type: {type(error).__name__}")
    
    def log_step_skip(self, step_index: int, skip_reason: str):
        """Log step being skipped"""
        if step_index < len(self.step_execution_log):
            step_log = self.step_execution_log[step_index]
            step_log['status'] = 'skipped'
            step_log['skip_reason'] = skip_reason
            
            self.skipped_steps += 1
            
            workflow_logger.info(f"⏭️ STEP {step_index + 1}/{self.total_steps} SKIPPED: {step_log['step_label']}")
            workflow_logger.info(f"   📝 Reason: {skip_reason}")
    
    def complete_pipeline(self):
        """Complete pipeline tracking and generate summary"""
        self.pipeline_end_time = datetime.now()
        total_duration = (self.pipeline_end_time - self.pipeline_start_time).total_seconds()
        
        # Calculate performance metrics
        self.performance_metrics = {
            'total_duration': total_duration,
            'total_steps': self.total_steps,
            'completed_steps': self.completed_steps,
            'failed_steps': self.failed_steps,
            'skipped_steps': self.skipped_steps,
            'success_rate': (self.completed_steps / self.total_steps) if self.total_steps > 0 else 0,
            'average_step_time': total_duration / self.completed_steps if self.completed_steps > 0 else 0,
            'completion_timestamp': self.pipeline_end_time.isoformat()
        }
        
        # Log comprehensive summary
        workflow_logger.info(f"🎯 PIPELINE COMPLETE: {self.workflow_name}")
        workflow_logger.info(f"   📊 SUMMARY:")
        workflow_logger.info(f"      ⏱️ Total Duration: {total_duration:.2f}s")
        workflow_logger.info(f"      📈 Success Rate: {self.performance_metrics['success_rate']:.1%}")
        workflow_logger.info(f"      ✅ Completed: {self.completed_steps}/{self.total_steps}")
        workflow_logger.info(f"      ❌ Failed: {self.failed_steps}")
        workflow_logger.info(f"      ⏭️ Skipped: {self.skipped_steps}")
        workflow_logger.info(f"      ⚡ Avg Step Time: {self.performance_metrics['average_step_time']:.2f}s")
        
        self.execution_phases.append({
            'phase': 'completion',
            'timestamp': self.pipeline_end_time.isoformat(),
            'details': f'Pipeline completed with {self.performance_metrics["success_rate"]:.1%} success rate',
            'metrics': self.performance_metrics
        })
        
        return self.performance_metrics
    
    def get_execution_summary(self) -> Dict[str, Any]:
        """Get comprehensive execution summary"""
        return {
            'workflow_id': self.workflow_id,
            'workflow_name': self.workflow_name,
            'pipeline_start_time': self.pipeline_start_time.isoformat() if self.pipeline_start_time else None,
            'pipeline_end_time': self.pipeline_end_time.isoformat() if self.pipeline_end_time else None,
            'performance_metrics': self.performance_metrics,
            'step_execution_log': self.step_execution_log,
            'execution_phases': self.execution_phases
        }
    
    def export_detailed_log(self) -> str:
        """Export detailed execution log as JSON"""
        return json.dumps(self.get_execution_summary(), indent=2, default=str)


class WorkflowStep:
    """
    Represents a single cognitive step in the workflow.
    Each step encapsulates a specific cognitive function.
    """
    
    def __init__(
        self, 
        label: str, 
        func: Callable, 
        auto: bool = False,
        retry_attempts: int = 3,
        timeout: Optional[float] = None,
        description: str = "",
        configuration: Dict[str, Any] = None
    ):
        self.label = label
        self.func = func
        self.auto = auto
        self.retry_attempts = retry_attempts
        self.timeout = timeout
        self.description = description or f"Execute {label}"
        self.configuration = configuration or {}
        self.execution_history = []
        self.skip_conditions = []  # Conditions that would cause this step to be skipped
    
    async def execute(self, input_data: Any, context: Dict, step_index: int = None, pipeline_tracker: PipelineTracker = None) -> Any:
        """Execute this workflow step with enhanced error handling and detailed logging"""
        start_time = time.time()
        step_id = str(uuid.uuid4())[:8]
        
        # Enhanced logging with pipeline context
        if pipeline_tracker and step_index is not None:
            pipeline_tracker.log_step_start(step_index, self.label, self.description)
        
        workflow_logger.info(f"🧠 Step [{self.label}] starting (ID: {step_id})")
        
        # Update context with enhanced step info for real-time tracking
        context["current_step_details"] = {
            "name": self.label,
            "step_id": step_id,
            "step_index": step_index,
            "status": "starting",
            "started_at": datetime.now().isoformat(),
            "details": f"Initializing {self.label}...",
            "progress": 0,
            "description": self.description
        }
        
        # Enhanced input data analysis
        input_summary = self._analyze_input_data(input_data)
        if pipeline_tracker and step_index is not None:
            pipeline_tracker.log_step_progress(step_index, f"Analyzed input data: {input_summary}")
        
        for attempt in range(self.retry_attempts):
            try:
                # Update progress with detailed information
                context["current_step_details"].update({
                    "status": "running",
                    "details": f"Executing {self.label} (attempt {attempt + 1}/{self.retry_attempts})",
                    "progress": 25,
                    "attempt": attempt + 1
                })
                
                if pipeline_tracker and step_index is not None:
                    pipeline_tracker.log_step_progress(
                        step_index, 
                        f"Starting execution attempt {attempt + 1}",
                        25.0
                    )
                
                # Execute the step function (handle both sync and async)
                if inspect.iscoroutinefunction(self.func):
                    result = await self.func(input_data, context)
                else:
                    # Call the function and check if it returns a coroutine
                    result = self.func(input_data, context)
                    
                    # If the result is a coroutine, await it
                    if inspect.iscoroutine(result):
                        workflow_logger.info(f"🔄 Step [{self.label}] returned coroutine, awaiting...")
                        if pipeline_tracker and step_index is not None:
                            pipeline_tracker.log_step_progress(step_index, "Awaiting coroutine result", 75.0)
                        result = await result
                
                execution_time = time.time() - start_time
                
                # Enhanced result analysis
                output_summary = self._analyze_output_data(result)
                
                # Extract detailed step results from context if available
                step_details = context.get("step_output_details", {})
                
                # Log successful execution with enhanced details
                execution_record = {
                    "step_id": step_id,
                    "step_index": step_index,
                    "timestamp": datetime.now().isoformat(),
                    "execution_time": execution_time,
                    "status": "success",
                    "attempt": attempt + 1,
                    "input_type": type(input_data).__name__,
                    "output_type": type(result).__name__,
                    "input_length": len(str(input_data)) if input_data else 0,
                    "output_length": len(str(result)) if result else 0,
                    "input_summary": input_summary,
                    "output_summary": output_summary,
                    "details": step_details.get("summary", f"Successfully completed {self.label}"),
                    "actions_performed": step_details.get("actions", []),
                    "data_processed": step_details.get("data_processed", {}),
                    "quality_metrics": step_details.get("metrics", {})
                }
                
                self.execution_history.append(execution_record)
                
                # Update context with completion info
                context["current_step_details"].update({
                    "status": "completed",
                    "completed_at": datetime.now().isoformat(),
                    "execution_time": execution_time,
                    "details": step_details.get("summary", f"Successfully completed {self.label}"),
                    "progress": 100,
                    "actions_performed": step_details.get("actions", []),
                    "data_processed": step_details.get("data_processed", {}),
                    "output_preview": str(result)[:200] + "..." if len(str(result)) > 200 else str(result),
                    "input_summary": input_summary,
                    "output_summary": output_summary
                })
                
                # Enhanced pipeline tracking
                if pipeline_tracker and step_index is not None:
                    result_summary = step_details.get("summary", f"Completed successfully in {execution_time:.2f}s")
                    pipeline_tracker.log_step_completion(
                        step_index, execution_time, result_summary, input_summary, output_summary
                    )
                
                workflow_logger.info(
                    f"✅ Step [{self.label}] completed successfully "
                    f"(ID: {step_id}, Time: {execution_time:.2f}s)"
                )
                workflow_logger.info(f"   📥 Input: {input_summary}")
                workflow_logger.info(f"   📤 Output: {output_summary}")
                
                return result
                
            except Exception as e:
                execution_time = time.time() - start_time
                
                # Log failed attempt with detailed information
                error_details = {
                    "step_id": step_id,
                    "step_index": step_index,
                    "timestamp": datetime.now().isoformat(),
                    "execution_time": execution_time,
                    "status": "failed",
                    "attempt": attempt + 1,
                    "error": str(e),
                    "error_type": type(e).__name__,
                    "traceback": traceback.format_exc(),
                    "input_type": type(input_data).__name__,
                    "retry_remaining": self.retry_attempts - attempt - 1
                }
                
                self.execution_history.append(error_details)
                
                # Update context with failure info
                context["current_step_details"].update({
                    "status": "failed" if attempt == self.retry_attempts - 1 else "retrying",
                    "error": str(e),
                    "error_type": type(e).__name__,
                    "details": f"Failed: {str(e)}" + (f" (retrying {self.retry_attempts - attempt - 1} more times)" if attempt < self.retry_attempts - 1 else ""),
                    "progress": 0,
                    "traceback": traceback.format_exc()
                })
                
                # Enhanced pipeline tracking for failures
                if pipeline_tracker and step_index is not None:
                    if attempt == self.retry_attempts - 1:  # Final attempt
                        pipeline_tracker.log_step_failure(step_index, e, execution_time)
                    else:
                        pipeline_tracker.log_step_progress(
                            step_index, 
                            f"Attempt {attempt + 1} failed: {str(e)}, retrying...", 
                            0.0
                        )
                
                workflow_logger.error(
                    f"❌ Step [{self.label}] attempt {attempt + 1} failed "
                    f"(ID: {step_id}): {str(e)}"
                )
                
                # If this is the last attempt, raise the exception
                if attempt == self.retry_attempts - 1:
                    raise
                
                # Wait briefly before retry
                time.sleep(0.5)
        
        # This should never be reached, but just in case
        raise Exception(f"Step {self.label} failed after {self.retry_attempts} attempts")
    
    def _analyze_input_data(self, input_data: Any) -> str:
        """Analyze input data and create summary"""
        if input_data is None:
            return "No input data"
        
        data_type = type(input_data).__name__
        
        if isinstance(input_data, str):
            return f"String ({len(input_data)} chars): {input_data[:100]}{'...' if len(input_data) > 100 else ''}"
        elif isinstance(input_data, (list, tuple)):
            return f"{data_type} ({len(input_data)} items)"
        elif isinstance(input_data, dict):
            keys = list(input_data.keys())[:5]
            return f"Dict ({len(input_data)} keys): {keys}{'...' if len(input_data) > 5 else ''}"
        else:
            return f"{data_type}: {str(input_data)[:100]}{'...' if len(str(input_data)) > 100 else ''}"
    
    def _analyze_output_data(self, output_data: Any) -> str:
        """Analyze output data and create summary"""
        return self._analyze_input_data(output_data)  # Same logic applies
    
    def should_skip(self, context: Dict) -> tuple[bool, str]:
        """Check if this step should be skipped based on context and conditions"""
        # Check custom skip conditions
        for condition_func, reason in self.skip_conditions:
            if condition_func(context):
                return True, reason
        
        # Check if step is disabled in configuration
        if self.configuration.get("enabled", True) is False:
            return True, "Step disabled in configuration"
        
        # Check context-based skip conditions
        if context.get("skip_optional_steps", False) and not self.auto:
            return True, "Skipping optional steps mode enabled"
        
        return False, ""
    
    def add_skip_condition(self, condition_func: Callable[[Dict], bool], reason: str):
        """Add a condition that will cause this step to be skipped"""
        self.skip_conditions.append((condition_func, reason))
    
    def get_configuration_schema(self) -> Dict[str, Any]:
        """Get the configuration schema for this step"""
        return {
            "enabled": {"type": "boolean", "default": True, "description": "Whether this step is enabled"},
            "retry_attempts": {"type": "integer", "default": self.retry_attempts, "description": "Number of retry attempts"},
            "timeout": {"type": "number", "default": self.timeout, "description": "Timeout in seconds"},
            "custom_instructions": {"type": "string", "default": "", "description": "Custom instructions for this step"},
            **self.configuration.get("schema", {})
        }


class AgentWorkflow:
    """
    Psychologically-Aware Workflow Engine
    
    Models cognitive processing as a sequence of steps that build upon each other,
    maintaining shared context and memory throughout the process. Inspired by
    cognitive behavioral therapy and information processing theory.
    """
    
    def __init__(self, name: str, context: Dict = None):
        self.name = name
        self.steps: List[WorkflowStep] = []
        self.context = context or {}
        self.history = []
        self.workflow_id = str(uuid.uuid4())
        self.created_at = datetime.now()
        self.execution_metadata = {
            "total_executions": 0,
            "successful_executions": 0,
            "failed_executions": 0,
            "average_execution_time": 0.0
        }
        
        # Initialize workflow context with metadata
        self.context.update({
            "workflow_name": name,
            "workflow_id": self.workflow_id,
            "created_at": self.created_at.isoformat(),
            "execution_history": []
        })
        
        workflow_logger.info(f"🌟 AgentWorkflow '{name}' initialized (ID: {self.workflow_id})")
    
    def add_step(
        self, 
        label: str, 
        func: Callable, 
        auto: bool = False,
        retry_attempts: int = 3,
        timeout: Optional[float] = None,
        description: str = "",
        configuration: Dict[str, Any] = None
    ):
        """
        Add a cognitive step to the workflow.
        
        Args:
            label: Human-readable description of what this step does
            func: Function that takes (input_data, context) and returns transformed data
            auto: Whether this step runs automatically without user intervention
            retry_attempts: Number of times to retry if the step fails
            timeout: Maximum time to allow for step execution
            description: Detailed description of the step's purpose
            configuration: Step-specific configuration options
        """
        step = WorkflowStep(
            label, func, auto, retry_attempts, timeout, 
            description, configuration
        )
        self.steps.append(step)
        
        workflow_logger.info(f"➕ Added step '{label}' to workflow '{self.name}'")
        return self
    
    def get_step_configurations(self) -> Dict[str, Dict]:
        """Get configuration schemas for all steps"""
        return {step.label: step.get_configuration_schema() for step in self.steps}
    
    def update_step_configuration(self, step_label: str, config: Dict[str, Any]) -> bool:
        """Update configuration for a specific step"""
        for step in self.steps:
            if step.label == step_label:
                step.configuration.update(config)
                # Update retry attempts if specified
                if "retry_attempts" in config:
                    step.retry_attempts = config["retry_attempts"]
                if "timeout" in config:
                    step.timeout = config["timeout"]
                workflow_logger.info(f"🔧 Updated configuration for step '{step_label}'")
                return True
        return False
    
    def remove_step(self, label: str) -> bool:
        """Remove a step by label"""
        for i, step in enumerate(self.steps):
            if step.label == label:
                removed_step = self.steps.pop(i)
                workflow_logger.info(f"➖ Removed step '{label}' from workflow '{self.name}'")
                return True
        return False
    
    def insert_step(
        self, 
        index: int, 
        label: str, 
        func: Callable, 
        auto: bool = False,
        retry_attempts: int = 3
    ):
        """Insert a step at a specific position"""
        step = WorkflowStep(label, func, auto, retry_attempts)
        self.steps.insert(index, step)
        
        workflow_logger.info(f"📌 Inserted step '{label}' at position {index} in workflow '{self.name}'")
        return self
    
    async def run(self, input_data: Any) -> Any:
        """
        Execute the complete workflow with the given input data.
        
        This represents the full cognitive processing cycle from initial
        input through all transformation steps to final output.
        """
        if not self.steps:
            workflow_logger.warning(f"⚠️ Workflow '{self.name}' has no steps defined")
            return input_data
        
        execution_start = time.time()
        execution_id = str(uuid.uuid4())[:8]
        
        workflow_logger.info(
            f"🚀 Starting workflow '{self.name}' execution "
            f"(ID: {execution_id}, Steps: {len(self.steps)})"
        )
        
        # Update context with execution info
        self.context["current_execution_id"] = execution_id
        self.context["execution_start_time"] = execution_start
        
        data = input_data
        successful_steps = 0
        
        try:
            # Initialize detailed workflow steps tracking
            if "workflow_steps" not in self.context:
                self.context["workflow_steps"] = []
            
            # Initialize pipeline tracker with proper startup
            pipeline_tracker = PipelineTracker(self.workflow_id, self.name)
            pipeline_tracker.start_pipeline(len(self.steps))
            
            # Execute each step in sequence
            for i, step in enumerate(self.steps):
                step_start = time.time()
                
                # Update context with current step info
                self.context["current_step"] = step.label
                self.context["current_step_index"] = i
                self.context["total_steps"] = len(self.steps)
                
                # Check if step should be skipped
                should_skip, skip_reason = step.should_skip(self.context)
                
                if should_skip:
                    # Log skip in pipeline tracker
                    pipeline_tracker.log_step_skip(i, skip_reason)
                    
                    # Record skipped step
                    step_record = {
                        "execution_id": execution_id,
                        "step_index": i,
                        "step_label": step.label,
                        "step_description": step.description,
                        "timestamp": datetime.now().isoformat(),
                        "duration": 0,
                        "status": "skipped",
                        "skip_reason": skip_reason,
                        "configuration": step.configuration.copy()
                    }
                    
                    self.history.append(step_record)
                    self.context["workflow_steps"].append(step_record)
                    
                    workflow_logger.info(
                        f"⏭️ Step {i+1}/{len(self.steps)} [{step.label}] skipped: {skip_reason}"
                    )
                    continue
                
                # Clear any previous step output details
                self.context.pop("step_output_details", None)
                
                # Execute the step (now with async support)
                result = await step.execute(data, self.context, i, pipeline_tracker)
                
                step_duration = time.time() - step_start
                
                # Get detailed step information from context
                step_details = self.context.get("current_step_details", {})
                
                # Record step in workflow history with enhanced details
                step_record = {
                    "execution_id": execution_id,
                    "step_index": i,
                    "step_label": step.label,
                    "step_description": step.description,
                    "timestamp": datetime.now().isoformat(),
                    "duration": step_duration,
                    "status": "success",
                    "input_summary": step_details.get("input_summary", str(data)[:200] + "..." if len(str(data)) > 200 else str(data)),
                    "output_summary": step_details.get("output_summary", str(result)[:200] + "..." if len(str(result)) > 200 else str(result)),
                    "details": step_details.get("details", f"Completed {step.label}"),
                    "actions_performed": step_details.get("actions_performed", []),
                    "data_processed": step_details.get("data_processed", {}),
                    "quality_metrics": step_details.get("quality_metrics", {}),
                    "configuration": step.configuration.copy()
                }
                
                self.history.append(step_record)
                self.context["workflow_steps"].append(step_record)
                
                # Pass result to next step
                data = result
                successful_steps += 1
                
                workflow_logger.info(
                    f"📈 Step {i+1}/{len(self.steps)} [{step.label}] completed "
                    f"(Duration: {step_duration:.2f}s)"
                )
            
            # Complete pipeline tracking
            pipeline_metrics = pipeline_tracker.complete_pipeline()
            
            # Workflow completed successfully
            total_duration = time.time() - execution_start
            
            self.execution_metadata["total_executions"] += 1
            self.execution_metadata["successful_executions"] += 1
            
            # Update average execution time
            total_time = (self.execution_metadata["average_execution_time"] * 
                         (self.execution_metadata["total_executions"] - 1) + total_duration)
            self.execution_metadata["average_execution_time"] = total_time / self.execution_metadata["total_executions"]
            
            # Add execution to context history with pipeline metrics
            self.context["execution_history"].append({
                "execution_id": execution_id,
                "timestamp": datetime.now().isoformat(),
                "duration": total_duration,
                "status": "success",
                "steps_completed": successful_steps,
                "total_steps": len(self.steps),
                "pipeline_metrics": pipeline_metrics,
                "detailed_log": pipeline_tracker.get_execution_summary()
            })
            
            workflow_logger.info(
                f"🎉 Workflow '{self.name}' completed successfully "
                f"(ID: {execution_id}, Duration: {total_duration:.2f}s, Steps: {successful_steps}/{len(self.steps)})"
            )
            
            return data
            
        except Exception as e:
            # Complete pipeline tracking even on failure
            pipeline_metrics = pipeline_tracker.complete_pipeline()
            
            # Workflow failed
            total_duration = time.time() - execution_start
            
            self.execution_metadata["total_executions"] += 1
            self.execution_metadata["failed_executions"] += 1
            
            # Record failure in history
            self.history.append({
                "execution_id": execution_id,
                "step_index": successful_steps,
                "step_label": self.steps[successful_steps].label if successful_steps < len(self.steps) else "unknown",
                "timestamp": datetime.now().isoformat(),
                "duration": total_duration,
                "status": "failed",
                "error": str(e),
                "steps_completed": successful_steps
            })
            
            # Add failed execution to context history with pipeline metrics
            self.context["execution_history"].append({
                "execution_id": execution_id,
                "timestamp": datetime.now().isoformat(),
                "duration": total_duration,
                "status": "failed",
                "error": str(e),
                "steps_completed": successful_steps,
                "total_steps": len(self.steps),
                "pipeline_metrics": pipeline_metrics,
                "detailed_log": pipeline_tracker.get_execution_summary()
            })
            
            workflow_logger.error(
                f"💥 Workflow '{self.name}' failed "
                f"(ID: {execution_id}, Duration: {total_duration:.2f}s, "
                f"Completed: {successful_steps}/{len(self.steps)}, Error: {str(e)})"
            )
            
            raise
    
    def get_step_history(self, step_label: str = None) -> List[Dict]:
        """Get execution history for a specific step or all steps"""
        if step_label:
            return [h for h in self.history if h.get("step_label") == step_label]
        return self.history.copy()
    
    def get_performance_metrics(self) -> Dict:
        """Get workflow performance statistics"""
        step_metrics = {}
        
        for step in self.steps:
            step_metrics[step.label] = {
                "total_executions": len(step.execution_history),
                "successful_executions": len([h for h in step.execution_history if h["status"] == "success"]),
                "failed_executions": len([h for h in step.execution_history if h["status"] == "failed"]),
                "average_execution_time": sum(h["execution_time"] for h in step.execution_history) / len(step.execution_history) if step.execution_history else 0
            }
        
        return {
            "workflow_metadata": self.execution_metadata,
            "step_metrics": step_metrics,
            "total_steps": len(self.steps),
            "workflow_age": (datetime.now() - self.created_at).total_seconds()
        }
    
    def reset(self):
        """Reset workflow execution history (but keep step definitions)"""
        self.history.clear()
        for step in self.steps:
            step.execution_history.clear()
        
        self.execution_metadata = {
            "total_executions": 0,
            "successful_executions": 0,
            "failed_executions": 0,
            "average_execution_time": 0.0
        }
        
        workflow_logger.info(f"🔄 Workflow '{self.name}' history reset")
    
    def __repr__(self):
        return f"AgentWorkflow(name='{self.name}', steps={len(self.steps)}, executions={self.execution_metadata['total_executions']})" 