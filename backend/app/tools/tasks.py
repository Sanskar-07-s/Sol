"""
Task Management Tools for Project SOL.
"""
import time
import uuid
from typing import Any, Dict, List

_ACTIVE_TASKS: Dict[str, Dict[str, Any]] = {}


def create_task_tool(title: str, description: str = "") -> Dict[str, Any]:
    task_id = f"task-{uuid.uuid4().hex[:6]}"
    task = {
        "task_id": task_id,
        "title": title,
        "description": description,
        "status": "in_progress",
        "created_at": time.time(),
    }
    _ACTIVE_TASKS[task_id] = task
    return {"success": True, "verified": True, "task": task}


def list_tasks_tool() -> Dict[str, Any]:
    tasks = list(_ACTIVE_TASKS.values())
    return {"success": True, "verified": True, "count": len(tasks), "tasks": tasks}
