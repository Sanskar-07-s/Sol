"""
Central SOL AI Orchestrator & Intelligence Core.
Connects understanding, planning, tool orchestrator, conversational context, memory, and LLM providers.
"""
import time
from typing import Any, AsyncGenerator, Dict, List, Optional
from app.ai.schemas import AIResponse, AIStateName, ChatMessage, ToolResult
from app.ai.state import ai_state_manager
from app.ai.providers import get_ai_provider
from app.ai.providers.base import BaseAIProvider
from app.ai.context import context_manager
from app.ai.conversation import conversation_manager
from app.ai.reasoning import reasoning_engine
from app.ai.planner import planner
from app.ai.tool_router import tool_router
from app.tools import tool_registry
from app.ai.errors import ModelUnavailableError, AIException


class SOLEngine:
    def __init__(self):
        self.provider: BaseAIProvider = get_ai_provider()

    def get_status(self) -> Dict[str, Any]:
        is_healthy, status_msg = self.provider.health_check()
        state: AIStateName = "MODEL_READY" if is_healthy else "AI_UNAVAILABLE"
        ai_state_manager.set_state(state, error_message=status_msg if not is_healthy else None)
        return {
            "state": state,
            "provider": self.provider.get_provider_name(),
            "model": self.provider.get_model_name(),
            "healthy": is_healthy,
            "message": status_msg,
        }

    def process_query(self, query: str, session_id: str = "default") -> AIResponse:
        if not query or not query.strip():
            return AIResponse(
                response_text="Empty query submitted.",
                state="FAILED",
                verified=False,
            )

        ai_state_manager.set_state("THINKING")
        context = context_manager.get_or_create_context(session_id)
        user_msg = ChatMessage(role="user", content=query)
        conversation_manager.add_message(user_msg, session_id)

        clean_query = query.strip()
        lower = clean_query.lower()

        # 1. Resolve Conversational References ("any one", "first one", "second one", "the other one", "it")
        ref_name, ref_app = context_manager.resolve_conversational_reference(clean_query, context)
        if ref_app:
            context_manager.update_context_after_resolution(context, app=ref_app)
            # Execute launch for resolved reference candidate
            tool_res = tool_router.execute_tool(
                "launch_application",
                {"app_name": ref_app.canonical_name},
                tool_id="tc-ref-launch",
            )
            resp_text = tool_res.result.get("message") if tool_res.result else f"Opened {ref_app.canonical_name}."
            ai_state_manager.set_state("COMPLETED")
            assistant_msg = ChatMessage(role="assistant", content=resp_text)
            conversation_manager.add_message(assistant_msg, session_id)
            return AIResponse(
                response_text=resp_text,
                state="COMPLETED",
                tool_calls_executed=[tool_res],
                verified=tool_res.verified,
                data=tool_res.result,
            )

        # 2. Check if intent is an application launch or close
        is_open = any(lower.startswith(w) for w in ["open", "launch", "start", "run"])
        is_close = any(lower.startswith(w) for w in ["close", "quit", "exit", "stop"])

        if is_open:
            resolved, app_cand, pending, msg = reasoning_engine.resolve_application_intent(clean_query, session_id)
            if not resolved:
                state = "WAITING_FOR_CONFIRMATION" if pending else "FAILED"
                ai_state_manager.set_state(state)
                assistant_msg = ChatMessage(role="assistant", content=msg)
                conversation_manager.add_message(assistant_msg, session_id)
                return AIResponse(
                    response_text=msg,
                    state=state,
                    verified=False,
                    data={"ambiguous": True, "candidates": [c.dict() for c in pending.candidates]} if pending else None,
                )

            # Launch application via tool router
            ai_state_manager.set_state("USING_TOOL")
            tool_res = tool_router.execute_tool("launch_application", {"app_name": app_cand.canonical_name})
            resp_text = tool_res.result.get("message") if tool_res.result else f"Opened {app_cand.canonical_name}."
            state: AIStateName = "COMPLETED" if tool_res.success else "FAILED"
            ai_state_manager.set_state(state)

            assistant_msg = ChatMessage(role="assistant", content=resp_text)
            conversation_manager.add_message(assistant_msg, session_id)
            return AIResponse(
                response_text=resp_text,
                state=state,
                tool_calls_executed=[tool_res],
                verified=tool_res.verified,
                data=tool_res.result,
            )

        elif is_close:
            target = re.sub(r"^(close|quit|exit|stop)\s+", "", lower).strip()
            ai_state_manager.set_state("USING_TOOL")
            tool_res = tool_router.execute_tool("close_application", {"app_name": target})
            resp_text = tool_res.result.get("message") if tool_res.result else f"Closed {target}."
            state: AIStateName = "COMPLETED" if tool_res.success else "FAILED"
            ai_state_manager.set_state(state)

            assistant_msg = ChatMessage(role="assistant", content=resp_text)
            conversation_manager.add_message(assistant_msg, session_id)
            return AIResponse(
                response_text=resp_text,
                state=state,
                tool_calls_executed=[tool_res],
                verified=tool_res.verified,
                data=tool_res.result,
            )

        # 3. Check for System Telemetry / Device Capability queries
        if any(w in lower for w in ["cpu", "ram", "memory", "uptime", "status"]):
            ai_state_manager.set_state("USING_TOOL")
            tool_res = tool_router.execute_tool("get_system_status", {})
            d = tool_res.result or {}
            resp_text = f"Host System Status: CPU {d.get('cpu_usage_pct')}% utilization, RAM {d.get('ram_used_gb')}/{d.get('ram_total_gb')} GB ({d.get('ram_usage_pct')}%), Host Uptime: {d.get('uptime_hours')} hours."
            ai_state_manager.set_state("COMPLETED")
            return AIResponse(
                response_text=resp_text,
                state="COMPLETED",
                tool_calls_executed=[tool_res],
                verified=True,
                data=d,
            )

        if "what can you do" in lower or "capabilities" in lower:
            ai_state_manager.set_state("USING_TOOL")
            tool_res = tool_router.execute_tool("get_device_capabilities", {})
            resp_text = tool_res.result.get("summary", "Capabilities retrieved.")
            ai_state_manager.set_state("COMPLETED")
            return AIResponse(
                response_text=resp_text,
                state="COMPLETED",
                tool_calls_executed=[tool_res],
                verified=True,
                data=tool_res.result,
            )

        if "what apps" in lower or "installed apps" in lower:
            ai_state_manager.set_state("USING_TOOL")
            tool_res = tool_router.execute_tool("list_applications", {})
            total = tool_res.result.get("total_count", 0)
            sample = ", ".join([a["name"] for a in tool_res.result.get("sample_apps", [])[:8]])
            resp_text = f"Discovered {total} applications on this host device using platform-native discovery.\nSample applications: {sample}..."
            ai_state_manager.set_state("COMPLETED")
            return AIResponse(
                response_text=resp_text,
                state="COMPLETED",
                tool_calls_executed=[tool_res],
                verified=True,
                data=tool_res.result,
            )

        # 4. Attempt LLM execution via active provider
        try:
            history = conversation_manager.get_history(session_id)
            tools_schema = tool_registry.get_ollama_tools_schema()
            resp_text, tool_calls = self.provider.chat(history, tools=tools_schema)

            executed_tools = []
            if tool_calls:
                ai_state_manager.set_state("USING_TOOL")
                for tc in tool_calls:
                    tres = tool_router.execute_tool(tc.tool_name, tc.arguments, tool_id=tc.tool_id)
                    executed_tools.append(tres)

            final_text = resp_text if resp_text else "Task completed successfully."
            ai_state_manager.set_state("COMPLETED")
            assistant_msg = ChatMessage(role="assistant", content=final_text)
            conversation_manager.add_message(assistant_msg, session_id)

            return AIResponse(
                response_text=final_text,
                state="COMPLETED",
                tool_calls_executed=executed_tools,
                verified=all(t.verified for t in executed_tools) if executed_tools else True,
            )
        except ModelUnavailableError as mue:
            # Provider unavailable (e.g. Ollama daemon offline)
            ai_state_manager.set_state("AI_UNAVAILABLE", error_message=mue.message)
            return AIResponse(
                response_text=mue.message,
                state="AI_UNAVAILABLE",
                verified=False,
                data={"error_code": "AI_UNAVAILABLE", "setup_instructions": "Install Ollama locally (https://ollama.com) and start daemon."},
            )
        except Exception as e:
            ai_state_manager.set_state("FAILED", error_message=str(e))
            return AIResponse(
                response_text=f"AI Processing Error: {str(e)}",
                state="FAILED",
                verified=False,
            )

    async def stream_query(self, query: str, session_id: str = "default") -> AsyncGenerator[str, None]:
        res = self.process_query(query, session_id)
        yield res.response_text


sol_engine = SOLEngine()
