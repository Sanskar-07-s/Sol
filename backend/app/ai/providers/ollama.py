"""
Ollama AI Provider Implementation for Project SOL.
Connects SOL Intelligence Core to locally running Ollama LLM daemons.
"""
import json
import os
import urllib.request
from typing import Any, AsyncGenerator, Dict, List, Optional, Tuple

from app.ai.schemas import ChatMessage, ToolCall
from app.ai.providers.base import BaseAIProvider
from app.ai.errors import ModelUnavailableError


class OllamaProvider(BaseAIProvider):
    def __init__(
        self,
        base_url: Optional[str] = None,
        model_name: Optional[str] = None,
        timeout: float = 10.0,
    ):
        self.base_url = (base_url or os.getenv("SOL_AI_BASE_URL", "http://127.0.0.1:11434")).rstrip("/")
        self.model_name = model_name or os.getenv("SOL_AI_MODEL", "llama3.2")
        self.timeout = timeout

    def get_provider_name(self) -> str:
        return "ollama"

    def get_model_name(self) -> str:
        return self.model_name

    def health_check(self) -> Tuple[bool, str]:
        try:
            url = f"{self.base_url}/api/tags"
            req = urllib.request.Request(url, headers={"User-Agent": "SOL-Intelligence/1.0"})
            with urllib.request.urlopen(req, timeout=3.0) as resp:
                if resp.status == 200:
                    data = json.loads(resp.read().decode("utf-8"))
                    models = [m.get("name") for m in data.get("models", [])]
                    if any(self.model_name in m for m in models) or len(models) > 0:
                        return True, f"Ollama operational ({len(models)} models found: {', '.join(models[:3])})"
                    return True, "Ollama daemon connected."
            return False, "Ollama endpoint returned non-200 status."
        except Exception as e:
            return False, f"Ollama daemon unreachable at {self.base_url} ({str(e)})"

    def chat(
        self,
        messages: List[ChatMessage],
        tools: Optional[List[Dict[str, Any]]] = None,
        context: Optional[Dict[str, Any]] = None,
    ) -> Tuple[str, List[ToolCall]]:
        is_healthy, status_msg = self.health_check()
        if not is_healthy:
            raise ModelUnavailableError(
                f"Ollama AI model provider is unavailable at {self.base_url}. Setup instructions: Install Ollama (https://ollama.com) and run 'ollama run {self.model_name}'. Details: {status_msg}"
            )

        payload_msgs = []
        for msg in messages:
            payload_msgs.append({"role": msg.role, "content": msg.content})

        req_body: Dict[str, Any] = {
            "model": self.model_name,
            "messages": payload_msgs,
            "stream": False,
        }

        if tools:
            req_body["tools"] = tools

        try:
            url = f"{self.base_url}/api/chat"
            data_bytes = json.dumps(req_body).encode("utf-8")
            req = urllib.request.Request(
                url,
                data=data_bytes,
                headers={"Content-Type": "application/json"},
                method="POST",
            )
            with urllib.request.urlopen(req, timeout=self.timeout) as resp:
                res_json = json.loads(resp.read().decode("utf-8"))
                message = res_json.get("message", {})
                content = message.get("content", "")
                raw_tool_calls = message.get("tool_calls", [])

                parsed_tool_calls: List[ToolCall] = []
                for idx, tc in enumerate(raw_tool_calls):
                    func = tc.get("function", {})
                    name = func.get("name", "")
                    args = func.get("arguments", {})
                    if name:
                        parsed_tool_calls.append(
                            ToolCall(
                                tool_id=f"tc-ollama-{idx}",
                                tool_name=name,
                                arguments=args if isinstance(args, dict) else {},
                            )
                        )

                return content, parsed_tool_calls
        except Exception as e:
            raise ModelUnavailableError(f"Error communicating with Ollama model '{self.model_name}': {str(e)}")

    async def stream_chat(
        self,
        messages: List[ChatMessage],
        tools: Optional[List[Dict[str, Any]]] = None,
        context: Optional[Dict[str, Any]] = None,
    ) -> AsyncGenerator[str, None]:
        text, _ = self.chat(messages, tools, context)
        yield text
