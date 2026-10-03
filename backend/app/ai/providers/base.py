"""
Abstract Base AI Provider Interface for Project SOL.
"""
from typing import Any, AsyncGenerator, Dict, List, Optional, Tuple
from app.ai.schemas import ChatMessage, ToolCall


class BaseAIProvider:
    """Abstract Base Class for LLM Providers (Ollama, Local Fallback, etc.)"""

    def get_provider_name(self) -> str:
        raise NotImplementedError

    def get_model_name(self) -> str:
        raise NotImplementedError

    def health_check(self) -> Tuple[bool, str]:
        """Returns (is_available, status_message)"""
        raise NotImplementedError

    def chat(
        self,
        messages: List[ChatMessage],
        tools: Optional[List[Dict[str, Any]]] = None,
        context: Optional[Dict[str, Any]] = None,
    ) -> Tuple[str, List[ToolCall]]:
        """
        Processes conversation messages and optional tools.
        Returns (response_text, list_of_tool_calls).
        """
        raise NotImplementedError

    async def stream_chat(
        self,
        messages: List[ChatMessage],
        tools: Optional[List[Dict[str, Any]]] = None,
        context: Optional[Dict[str, Any]] = None,
    ) -> AsyncGenerator[str, None]:
        """Yields text tokens as generated"""
        raise NotImplementedError
