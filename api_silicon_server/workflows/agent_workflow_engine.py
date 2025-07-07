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
from datetime import datetime
from typing import Dict, List, Callable, Any, Optional
import logging

# Set up workflow logger
workflow_logger = logging.getLogger("WorkflowEngine")
workflow_logger.setLevel(logging.INFO)


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
        timeout: Optional[float] = None
    ):
        self.label = label
        self.func = func
        self.auto = auto
        self.retry_attempts = retry_attempts
        self.timeout = timeout
        self.execution_history = []
    
    async def execute(self, input_data: Any, context: Dict) -> Any:
        """Execute this workflow step with error handling and logging"""
        start_time = time.time()
        step_id = str(uuid.uuid4())[:8]
        
        workflow_logger.info(f"🧠 Step [{self.label}] starting (ID: {step_id})")
        
        for attempt in range(self.retry_attempts):
            try:
                # Execute the step function (handle both sync and async)
                if inspect.iscoroutinefunction(self.func):
                    result = await self.func(input_data, context)
                else:
                    # Call the function and check if it returns a coroutine
                    result = self.func(input_data, context)
                    
                    # If the result is a coroutine, await it
                    if inspect.iscoroutine(result):
                        workflow_logger.info(f"🔄 Step [{self.label}] returned coroutine, awaiting...")
                        result = await result
                
                execution_time = time.time() - start_time
                
                # Log successful execution
                self.execution_history.append({
                    "step_id": step_id,
                    "timestamp": datetime.now().isoformat(),
                    "execution_time": execution_time,
                    "status": "success",
                    "attempt": attempt + 1,
                    "input_type": type(input_data).__name__,
                    "output_type": type(result).__name__
                })
                
                workflow_logger.info(
                    f"✅ Step [{self.label}] completed successfully "
                    f"(ID: {step_id}, Time: {execution_time:.2f}s)"
                )
                
                return result
                
            except Exception as e:
                execution_time = time.time() - start_time
                
                # Log failed attempt
                self.execution_history.append({
                    "step_id": step_id,
                    "timestamp": datetime.now().isoformat(),
                    "execution_time": execution_time,
                    "status": "failed",
                    "attempt": attempt + 1,
                    "error": str(e),
                    "input_type": type(input_data).__name__
                })
                
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
        timeout: Optional[float] = None
    ):
        """
        Add a cognitive step to the workflow.
        
        Args:
            label: Human-readable description of what this step does
            func: Function that takes (input_data, context) and returns transformed data
            auto: Whether this step runs automatically without user intervention
            retry_attempts: Number of times to retry if the step fails
            timeout: Maximum time to allow for step execution
        """
        step = WorkflowStep(label, func, auto, retry_attempts, timeout)
        self.steps.append(step)
        
        workflow_logger.info(f"➕ Added step '{label}' to workflow '{self.name}'")
        return self
    
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
            # Execute each step in sequence
            for i, step in enumerate(self.steps):
                step_start = time.time()
                
                # Update context with current step info
                self.context["current_step"] = step.label
                self.context["current_step_index"] = i
                self.context["total_steps"] = len(self.steps)
                
                # Execute the step (now with async support)
                result = await step.execute(data, self.context)
                
                step_duration = time.time() - step_start
                
                # Record step in workflow history
                self.history.append({
                    "execution_id": execution_id,
                    "step_index": i,
                    "step_label": step.label,
                    "timestamp": datetime.now().isoformat(),
                    "duration": step_duration,
                    "status": "success",
                    "input_summary": str(data)[:200] + "..." if len(str(data)) > 200 else str(data),
                    "output_summary": str(result)[:200] + "..." if len(str(result)) > 200 else str(result)
                })
                
                # Pass result to next step
                data = result
                successful_steps += 1
                
                workflow_logger.info(
                    f"📈 Step {i+1}/{len(self.steps)} [{step.label}] completed "
                    f"(Duration: {step_duration:.2f}s)"
                )
            
            # Workflow completed successfully
            total_duration = time.time() - execution_start
            
            self.execution_metadata["total_executions"] += 1
            self.execution_metadata["successful_executions"] += 1
            
            # Update average execution time
            total_time = (self.execution_metadata["average_execution_time"] * 
                         (self.execution_metadata["total_executions"] - 1) + total_duration)
            self.execution_metadata["average_execution_time"] = total_time / self.execution_metadata["total_executions"]
            
            # Add execution to context history
            self.context["execution_history"].append({
                "execution_id": execution_id,
                "timestamp": datetime.now().isoformat(),
                "duration": total_duration,
                "status": "success",
                "steps_completed": successful_steps,
                "total_steps": len(self.steps)
            })
            
            workflow_logger.info(
                f"🎉 Workflow '{self.name}' completed successfully "
                f"(ID: {execution_id}, Duration: {total_duration:.2f}s, Steps: {successful_steps}/{len(self.steps)})"
            )
            
            return data
            
        except Exception as e:
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
            
            # Add failed execution to context history
            self.context["execution_history"].append({
                "execution_id": execution_id,
                "timestamp": datetime.now().isoformat(),
                "duration": total_duration,
                "status": "failed",
                "error": str(e),
                "steps_completed": successful_steps,
                "total_steps": len(self.steps)
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