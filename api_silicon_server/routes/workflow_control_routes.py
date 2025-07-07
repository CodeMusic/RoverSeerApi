"""
Workflow Control Routes - Real-time Pipeline Management

Flask routes for interactive workflow control, providing:
- Real-time step feedback via WebSocket
- Step modification controls  
- Execution monitoring and analytics
- Pipeline customization interface
"""

import asyncio
import json
from datetime import datetime
from flask import Blueprint, render_template, request, jsonify, session
from flask_socketio import emit, join_room, leave_room
import logging

from ..workflows.interactive_workflow_controller import (
    InteractiveWorkflowController, 
    StepModification,
    create_step_modification
)
from ..workflows.agent_workflow_engine import PipelineTracker
from ..workflows.research_workflow import (
    build_research_workflow,
    create_research_context,
    WORKFLOW_REGISTRY
)

# Set up blueprint and logger
workflow_control_bp = Blueprint('workflow_control', __name__)
control_logger = logging.getLogger("WorkflowControlRoutes") 
control_logger.setLevel(logging.INFO)

# Store active controllers for real-time updates
active_controllers = {}


@workflow_control_bp.route('/workflow-control')
def workflow_control_interface():
    """Main workflow control interface"""
    return render_template('workflow_control.html')


@workflow_control_bp.route('/api/workflows/available')
def get_available_workflows():
    """Get list of available workflow types"""
    try:
        from ..workflows.research_workflow import get_available_workflows
        workflows = get_available_workflows()
        
        return jsonify({
            "success": True,
            "workflows": workflows,
            "total_count": len(workflows)
        })
        
    except Exception as e:
        control_logger.error(f"Failed to get available workflows: {str(e)}")
        return jsonify({"success": False, "error": str(e)}), 500


@workflow_control_bp.route('/api/workflows/start', methods=['POST'])
def start_interactive_workflow():
    """Start a new interactive workflow with real-time control"""
    try:
        data = request.json
        query = data.get('query', '')
        workflow_type = data.get('workflow_type', 'comprehensive')
        user_session = data.get('session_id', session.get('user_id', 'anonymous'))
        
        if not query.strip():
            return jsonify({"success": False, "error": "Query cannot be empty"}), 400
        
        control_logger.info(f"🚀 Starting interactive {workflow_type} workflow for query: '{query[:50]}...'")
        
        # Create workflow context (you'll need to adapt this to your specific setup)
        context = create_research_context(
            # Add your model, tokenizer, etc. here based on your setup
            # model=your_model,
            # tokenizer=your_tokenizer,
            # proto_ai=your_proto_ai,
        )
        
        # Build the requested workflow
        if workflow_type in WORKFLOW_REGISTRY:
            workflow = WORKFLOW_REGISTRY[workflow_type](context)
        else:
            workflow = build_research_workflow(context)
        
        # Create interactive controller with enhanced real-time feedback
        def feedback_callback(feedback):
            """Send comprehensive real-time feedback via WebSocket"""
            detailed_feedback = {
                'execution_id': feedback.step_id.split('_')[0] if '_' in feedback.step_id else feedback.step_id,
                'step_feedback': {
                    'step_id': feedback.step_id,
                    'step_label': feedback.step_label,
                    'status': feedback.status.value,
                    'progress_percent': feedback.progress_percent,
                    'current_action': feedback.current_action,
                    'actions_completed': feedback.actions_completed,
                    'data_summary': feedback.data_summary,
                    'performance_metrics': feedback.performance_metrics,
                    'timestamp': feedback.timestamp,
                    'duration': feedback.duration,
                    'can_modify': feedback.can_modify,
                    'modification_suggestions': feedback.modification_suggestions or [],
                    # Enhanced tracking information
                    'input_summary': getattr(feedback, 'input_summary', None),
                    'output_summary': getattr(feedback, 'output_summary', None),
                    'error_details': getattr(feedback, 'error_details', None),
                    'execution_phase': getattr(feedback, 'execution_phase', 'processing')
                }
            }
            
            emit('step_feedback', detailed_feedback, room=user_session)
            
            # Also emit to a general monitoring room for admin oversight
            emit('pipeline_monitoring', {
                'workflow_type': workflow_type,
                'user_session': user_session,
                'feedback': detailed_feedback
            }, room='monitoring')
        
        controller = InteractiveWorkflowController(workflow, feedback_callback)
        execution_id = controller.execution_id
        
        # Store controller for later control operations
        active_controllers[execution_id] = {
            'controller': controller,
            'user_session': user_session,
            'query': query,
            'workflow_type': workflow_type,
            'started_at': datetime.now().isoformat()
        }
        
        # Start execution in background
        async def run_workflow():
            try:
                result = await controller.run_with_control(query)
                
                # Send completion notification
                emit('workflow_completed', {
                    'execution_id': execution_id,
                    'result': str(result)[:1000] + "..." if len(str(result)) > 1000 else str(result),
                    'summary': controller.get_execution_summary()
                }, room=user_session)
                
                control_logger.info(f"✅ Interactive workflow {execution_id} completed successfully")
                
            except Exception as e:
                # Send error notification
                emit('workflow_error', {
                    'execution_id': execution_id,
                    'error': str(e),
                    'summary': controller.get_execution_summary()
                }, room=user_session)
                
                control_logger.error(f"❌ Interactive workflow {execution_id} failed: {str(e)}")
            
            finally:
                # Clean up
                if execution_id in active_controllers:
                    del active_controllers[execution_id]
        
        # Schedule the workflow execution
        asyncio.create_task(run_workflow())
        
        return jsonify({
            "success": True,
            "execution_id": execution_id,
            "workflow_type": workflow_type,
            "total_steps": len(workflow.steps),
            "step_labels": [step.label for step in workflow.steps]
        })
        
    except Exception as e:
        control_logger.error(f"Failed to start interactive workflow: {str(e)}")
        return jsonify({"success": False, "error": str(e)}), 500


@workflow_control_bp.route('/api/workflows/<execution_id>/control', methods=['POST'])
def control_workflow_execution(execution_id):
    """Control workflow execution (pause/resume/modify)"""
    try:
        if execution_id not in active_controllers:
            return jsonify({"success": False, "error": "Workflow not found or already completed"}), 404
        
        controller_data = active_controllers[execution_id]
        controller = controller_data['controller']
        
        data = request.json
        action = data.get('action')
        
        if action == 'pause':
            reason = data.get('reason', 'User requested pause')
            controller.pause_execution(reason)
            
            return jsonify({
                "success": True,
                "action": "paused",
                "message": f"Workflow paused: {reason}"
            })
        
        elif action == 'resume':
            controller.resume_execution()
            
            return jsonify({
                "success": True,
                "action": "resumed", 
                "message": "Workflow execution resumed"
            })
        
        elif action == 'modify_step':
            step_label = data.get('step_label')
            modification_type = data.get('modification_type')
            new_parameters = data.get('new_parameters', {})
            new_direction = data.get('new_direction')
            reason = data.get('reason', 'User modification')
            
            if not step_label:
                return jsonify({"success": False, "error": "step_label required for modification"}), 400
            
            modification = create_step_modification(
                modification_type=modification_type,
                new_parameters=new_parameters,
                new_direction=new_direction,
                reason=reason
            )
            
            controller.modify_step(step_label, modification)
            
            return jsonify({
                "success": True,
                "action": "step_modified",
                "step_label": step_label,
                "modification_type": modification_type,
                "message": f"Step '{step_label}' modified: {modification_type}"
            })
        
        elif action == 'skip_step':
            step_label = data.get('step_label')
            reason = data.get('reason', 'User requested skip')
            
            if not step_label:
                return jsonify({"success": False, "error": "step_label required for skip"}), 400
            
            controller.skip_step(step_label, reason)
            
            return jsonify({
                "success": True,
                "action": "step_skipped",
                "step_label": step_label,
                "message": f"Step '{step_label}' will be skipped"
            })
        
        else:
            return jsonify({"success": False, "error": f"Unknown action: {action}"}), 400
            
    except Exception as e:
        control_logger.error(f"Failed to control workflow {execution_id}: {str(e)}")
        return jsonify({"success": False, "error": str(e)}), 500


@workflow_control_bp.route('/api/workflows/<execution_id>/status')
def get_workflow_status(execution_id):
    """Get comprehensive workflow status including pipeline tracking details"""
    try:
        if execution_id not in active_controllers:
            return jsonify({"success": False, "error": "Workflow not found"}), 404
        
        controller_data = active_controllers[execution_id]
        controller = controller_data['controller']
        
        # Get comprehensive execution summary
        summary = controller.get_execution_summary()
        
        # Get detailed step feedback for each step
        step_details = []
        for step_id, feedback in controller.step_feedbacks.items():
            step_details.append({
                'step_id': step_id,
                'step_label': feedback.step_label,
                'status': feedback.status.value,
                'progress_percent': feedback.progress_percent,
                'current_action': feedback.current_action,
                'actions_completed': feedback.actions_completed,
                'performance_metrics': feedback.performance_metrics,
                'duration': feedback.duration,
                'timestamp': feedback.timestamp
            })
        
        # Enhanced response with detailed pipeline information
        return jsonify({
            "success": True,
            "execution_id": execution_id,
            "is_paused": controller.is_paused,
            "current_step_index": controller.current_step_index,
            "summary": summary,
            "step_details": step_details,
            "workflow_info": {
                "query": controller_data['query'],
                "workflow_type": controller_data['workflow_type'],
                "started_at": controller_data['started_at'],
                "user_session": controller_data['user_session']
            },
            "metacognitive_state": controller.metacognitive_state,
            "user_interactions": len(controller.user_interactions),
            # Pipeline performance metrics
            "pipeline_metrics": {
                "total_steps": len(controller.workflow.steps),
                "completed_steps": len([f for f in controller.step_feedbacks.values() if f.status.value == 'completed']),
                "failed_steps": len([f for f in controller.step_feedbacks.values() if f.status.value == 'failed']),
                "average_step_duration": sum(f.duration for f in controller.step_feedbacks.values() if f.duration) / len(controller.step_feedbacks) if controller.step_feedbacks else 0
            }
        })
        
    except Exception as e:
        control_logger.error(f"Failed to get workflow status {execution_id}: {str(e)}")
        return jsonify({"success": False, "error": str(e)}), 500


@workflow_control_bp.route('/api/workflows/<execution_id>/export')
def export_workflow_log(execution_id):
    """Export detailed execution log for analysis"""
    try:
        if execution_id not in active_controllers:
            return jsonify({"success": False, "error": "Workflow not found"}), 404
        
        controller = active_controllers[execution_id]['controller']
        execution_log = controller.export_execution_log()
        
        return jsonify({
            "success": True,
            "execution_id": execution_id,
            "log": json.loads(execution_log)
        })
        
    except Exception as e:
        control_logger.error(f"Failed to export workflow log {execution_id}: {str(e)}")
        return jsonify({"success": False, "error": str(e)}), 500


@workflow_control_bp.route('/api/workflows/<execution_id>/pipeline-log')
def get_pipeline_log(execution_id):
    """Get detailed pipeline execution log with step-by-step breakdown"""
    try:
        if execution_id not in active_controllers:
            return jsonify({"success": False, "error": "Workflow not found"}), 404
        
        controller_data = active_controllers[execution_id]
        controller = controller_data['controller']
        
        # Get workflow context which contains detailed pipeline tracking
        pipeline_data = controller.workflow.context.get('execution_history', [])
        
        # Get current step details if available
        current_step_details = controller.workflow.context.get('current_step_details', {})
        
        # Collect comprehensive pipeline information
        pipeline_log = {
            "execution_id": execution_id,
            "workflow_info": {
                "name": controller.workflow.name,
                "workflow_id": controller.workflow.workflow_id,
                "query": controller_data['query'],
                "workflow_type": controller_data['workflow_type'],
                "started_at": controller_data['started_at']
            },
            "pipeline_execution_history": pipeline_data,
            "current_step_details": current_step_details,
            "workflow_steps_completed": controller.workflow.context.get('workflow_steps', []),
            "step_feedback_history": [
                {
                    'step_id': step_id,
                    'step_label': feedback.step_label,
                    'status': feedback.status.value,
                    'progress_percent': feedback.progress_percent,
                    'current_action': feedback.current_action,
                    'actions_completed': feedback.actions_completed,
                    'data_summary': feedback.data_summary,
                    'performance_metrics': feedback.performance_metrics,
                    'duration': feedback.duration,
                    'timestamp': feedback.timestamp
                }
                for step_id, feedback in controller.step_feedbacks.items()
            ],
            "performance_summary": {
                "total_steps": len(controller.workflow.steps),
                "completed_steps": len([f for f in controller.step_feedbacks.values() if f.status.value == 'completed']),
                "failed_steps": len([f for f in controller.step_feedbacks.values() if f.status.value == 'failed']),
                "running_steps": len([f for f in controller.step_feedbacks.values() if f.status.value == 'running']),
                "average_step_duration": sum(f.duration for f in controller.step_feedbacks.values() if f.duration) / len(controller.step_feedbacks) if controller.step_feedbacks else 0,
                "metacognitive_state": controller.metacognitive_state
            }
        }
        
        return jsonify({
            "success": True,
            "pipeline_log": pipeline_log
        })
        
    except Exception as e:
        control_logger.error(f"Failed to get pipeline log {execution_id}: {str(e)}")
        return jsonify({"success": False, "error": str(e)}), 500


@workflow_control_bp.route('/api/workflows/active')
def get_active_workflows():
    """Get list of currently active workflows"""
    try:
        active_list = []
        
        for execution_id, controller_data in active_controllers.items():
            controller = controller_data['controller']
            summary = controller.get_execution_summary()
            
            active_list.append({
                "execution_id": execution_id,
                "query": controller_data['query'][:100] + "..." if len(controller_data['query']) > 100 else controller_data['query'],
                "workflow_type": controller_data['workflow_type'],
                "started_at": controller_data['started_at'],
                "current_step": controller.current_step_index,
                "total_steps": summary['total_steps'],
                "is_paused": controller.is_paused,
                "completed_steps": summary['completed_steps']
            })
        
        return jsonify({
            "success": True,
            "active_workflows": active_list,
            "total_active": len(active_list)
        })
        
    except Exception as e:
        control_logger.error(f"Failed to get active workflows: {str(e)}")
        return jsonify({"success": False, "error": str(e)}), 500


# WebSocket Events for Real-time Control

def register_socketio_events(socketio):
    """Register WebSocket events for real-time workflow control"""
    
    @socketio.on('join_workflow_room')
    def on_join_workflow_room(data):
        """Join a room for receiving workflow updates"""
        user_session = data.get('session_id', session.get('user_id', 'anonymous'))
        join_room(user_session)
        control_logger.info(f"User {user_session} joined workflow room")
        
        emit('joined_room', {
            'session_id': user_session,
            'message': 'Connected to workflow control system'
        })
    
    @socketio.on('leave_workflow_room')
    def on_leave_workflow_room(data):
        """Leave workflow room"""
        user_session = data.get('session_id', session.get('user_id', 'anonymous'))
        leave_room(user_session)
        control_logger.info(f"User {user_session} left workflow room")
    
    @socketio.on('request_workflow_status')
    def on_request_workflow_status(data):
        """Request status update for a specific workflow"""
        execution_id = data.get('execution_id')
        
        if execution_id and execution_id in active_controllers:
            controller = active_controllers[execution_id]['controller']
            summary = controller.get_execution_summary()
            
            emit('workflow_status_update', {
                'execution_id': execution_id,
                'summary': summary,
                'is_paused': controller.is_paused,
                'current_step_index': controller.current_step_index
            })
    
    control_logger.info("✅ WebSocket events registered for workflow control")


# Step Modification Helpers

def get_step_modification_templates():
    """Get templates for common step modifications"""
    return {
        "clarify": {
            "emotional_presets": ["calm", "curious", "critical", "empathetic"],
            "cognitive_presets": ["analytical", "creative", "skeptical", "balanced"],
            "parameters": {
                "complexity_sensitivity": {"type": "float", "min": 0.1, "max": 1.0, "default": 0.5},
                "skip_simple_queries": {"type": "boolean", "default": False}
            }
        },
        "search": {
            "parameters": {
                "search_max_results": {"type": "int", "min": 5, "max": 50, "default": 10},
                "search_region": {"type": "select", "options": ["en-us", "en-gb", "en-ca"], "default": "en-us"},
                "search_safesearch": {"type": "select", "options": ["strict", "moderate", "off"], "default": "moderate"},
                "academic_focus": {"type": "boolean", "default": False}
            }
        },
        "synthesis": {
            "parameters": {
                "summary_target_length": {"type": "select", "options": ["brief", "detailed", "comprehensive"], "default": "comprehensive"},
                "synthesis_style": {"type": "select", "options": ["academic", "creative", "technical"], "default": "academic"},
                "content_depth": {"type": "float", "min": 0.1, "max": 1.0, "default": 0.7}
            }
        },
        "write": {
            "parameters": {
                "section_detail_level": {"type": "select", "options": ["brief", "detailed", "comprehensive"], "default": "detailed"},
                "writing_style": {"type": "select", "options": ["academic", "conversational", "technical"], "default": "academic"},
                "include_citations": {"type": "boolean", "default": True}
            }
        }
    }


@workflow_control_bp.route('/api/workflows/modification-templates')
def get_modification_templates():
    """Get templates for step modifications"""
    try:
        templates = get_step_modification_templates()
        return jsonify({
            "success": True,
            "templates": templates
        })
        
    except Exception as e:
        control_logger.error(f"Failed to get modification templates: {str(e)}")
        return jsonify({"success": False, "error": str(e)}), 500 