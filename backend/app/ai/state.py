"""
AI Operational State Tracker for Project SOL.
Tracks real AI runtime status and integrates with SOL state machine.
"""
import time
from typing import Callable, List, Optional
from app.ai.schemas import AIStateName


class AIStateManager:
    def __init__(self):
        self._current_state: AIStateName = "MODEL_READY"
        self._last_error: Optional[str] = None
        self._state_listeners: List[Callable[[AIStateName], None]] = []

    def get_state(self) -> AIStateName:
        return self._current_state

    def set_state(self, new_state: AIStateName, error_message: Optional[str] = None):
        self._current_state = new_state
        if error_message:
            self._last_error = error_message
        for listener in self._state_listeners:
            try:
                listener(new_state)
            except Exception:
                pass

    def add_listener(self, callback: Callable[[AIStateName], None]):
        self._state_listeners.append(callback)

    def get_status_dict(self) -> dict:
        return {
            "state": self._current_state,
            "last_error": self._last_error,
            "timestamp": time.time(),
        }


ai_state_manager = AIStateManager()
