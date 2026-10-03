"""
Project SOL Intelligence Core Package.
Exposes SOLEngine, AIStateManager, ToolRegistry, ContextManager, and MemoryStore.
"""
from app.ai.engine import sol_engine, SOLEngine
from app.ai.state import ai_state_manager, AIStateManager
from app.ai.context import context_manager, ContextManager
from app.ai.conversation import conversation_manager, ConversationManager
from app.ai.planner import planner, Planner
from app.ai.reasoning import reasoning_engine, ReasoningEngine
from app.ai.tool_router import tool_router, ToolRouter
from app.tools import tool_registry, ToolRegistry
from app.ai.schemas import AIResponse, AIStateName, ChatMessage, ToolCall, ToolResult, CanonicalApp, MemoryItem, PendingClarification
from app.ai.errors import AIException, ModelUnavailableError, ToolExecutionError

__all__ = [
    "sol_engine",
    "SOLEngine",
    "ai_state_manager",
    "AIStateManager",
    "context_manager",
    "ContextManager",
    "conversation_manager",
    "ConversationManager",
    "planner",
    "Planner",
    "reasoning_engine",
    "ReasoningEngine",
    "tool_router",
    "ToolRouter",
    "tool_registry",
    "ToolRegistry",
    "AIResponse",
    "AIStateName",
    "ChatMessage",
    "ToolCall",
    "ToolResult",
    "CanonicalApp",
    "MemoryItem",
    "AIException",
    "ModelUnavailableError",
    "ToolExecutionError",
]
