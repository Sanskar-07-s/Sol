"""
Conversation History & Session Manager for Project SOL.
"""
from typing import Dict, List, Optional
from app.ai.schemas import ChatMessage


class ConversationManager:
    def __init__(self, max_history_messages: int = 20):
        self.max_history_messages = max_history_messages
        self._history: Dict[str, List[ChatMessage]] = {}

    def get_history(self, session_id: str = "default") -> List[ChatMessage]:
        return self._history.get(session_id, [])

    def add_message(self, message: ChatMessage, session_id: str = "default"):
        if session_id not in self._history:
            self._history[session_id] = []
        self._history[session_id].append(message)

        # Enforce max history window
        if len(self._history[session_id]) > self.max_history_messages:
            self._history[session_id] = self._history[session_id][-self.max_history_messages:]

    def clear_history(self, session_id: str = "default"):
        self._history[session_id] = []


conversation_manager = ConversationManager()
