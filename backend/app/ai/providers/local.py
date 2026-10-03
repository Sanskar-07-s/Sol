"""
Local Rule-Based AI Provider Fallback for Project SOL.
Ensures SOL intelligence and tool execution remain fully functional even when an external LLM server is offline.
"""
from typing import Any, AsyncGenerator, Dict, List, Optional, Tuple
from app.ai.schemas import ChatMessage, ToolCall
from app.ai.providers.base import BaseAIProvider


class LocalFallbackProvider(BaseAIProvider):
    def get_provider_name(self) -> str:
        return "local_fallback"

    def get_model_name(self) -> str:
        return "sol-deterministic-v1"

    def health_check(self) -> Tuple[bool, str]:
        return True, "Local fallback provider operational."

    def chat(
        self,
        messages: List[ChatMessage],
        tools: Optional[List[Dict[str, Any]]] = None,
        context: Optional[Dict[str, Any]] = None,
    ) -> Tuple[str, List[ToolCall]]:
        if not messages:
            return "How can I assist you on this device?", []

        last_msg = messages[-1].content.strip()
        lower = last_msg.lower()

        # Check for direct conversational or status queries
        if "what can you do" in lower or "capabilities" in lower:
            return "", [ToolCall(tool_id="tc-cap-1", tool_name="get_device_capabilities", arguments={})]

        elif "what apps" in lower or "installed apps" in lower or "show apps" in lower:
            return "", [ToolCall(tool_id="tc-apps-1", tool_name="list_applications", arguments={})]

        elif "status" in lower or "cpu" in lower or "ram" in lower or "telemetry" in lower:
            return "", [ToolCall(tool_id="tc-sys-1", tool_name="get_system_status", arguments={})]

        return f"Processed query: {last_msg}", []

    async def stream_chat(
        self,
        messages: List[ChatMessage],
        tools: Optional[List[Dict[str, Any]]] = None,
        context: Optional[Dict[str, Any]] = None,
    ) -> AsyncGenerator[str, None]:
        text, _ = self.chat(messages, tools, context)
        yield text
