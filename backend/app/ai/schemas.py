"""
Pydantic Schemas for SOL AI Subsystem.
Defines structured data contracts for messages, intents, tools, plans, memory, and responses.
"""
import time
from typing import Any, Dict, List, Literal, Optional
from pydantic import BaseModel, Field

AIRole = Literal["system", "user", "assistant", "tool"]

AIStateName = Literal[
    "AI_UNAVAILABLE",
    "MODEL_CONNECTING",
    "MODEL_READY",
    "THINKING",
    "USING_TOOL",
    "WAITING_FOR_CONFIRMATION",
    "RECOVERING",
    "COMPLETED",
    "FAILED",
]


class ChatMessage(BaseModel):
    role: AIRole
    content: str
    name: Optional[str] = None
    tool_calls: Optional[List[Dict[str, Any]]] = None
    timestamp: float = Field(default_factory=time.time)


class ToolCall(BaseModel):
    tool_id: str
    tool_name: str
    arguments: Dict[str, Any] = Field(default_factory=dict)


class ToolResult(BaseModel):
    tool_id: str
    tool_name: str
    success: bool
    verified: bool
    result: Optional[Dict[str, Any]] = None
    error: Optional[str] = None


class CanonicalApp(BaseModel):
    canonical_name: str
    aliases: List[str] = Field(default_factory=list)
    executable: str
    launch_targets: List[str] = Field(default_factory=list)
    best_target: str
    sources: List[str] = Field(default_factory=list)
    score: int = 100


class PendingClarification(BaseModel):
    question: str
    query_target: str
    candidates: List[CanonicalApp] = Field(default_factory=list)
    timestamp: float = Field(default_factory=time.time)


class ConversationalContext(BaseModel):
    session_id: str
    last_query: Optional[str] = None
    pending_clarification: Optional[PendingClarification] = None
    last_resolved_app: Optional[CanonicalApp] = None
    last_resolved_file: Optional[str] = None
    last_resolved_device: Optional[str] = None
    recent_entities: Dict[str, Any] = Field(default_factory=dict)
    updated_at: float = Field(default_factory=time.time)


class AIPlanStep(BaseModel):
    step_index: int
    description: str
    tool_name: str
    arguments: Dict[str, Any] = Field(default_factory=dict)
    status: Literal["pending", "in_progress", "completed", "failed"] = "pending"
    result: Optional[ToolResult] = None


class AIPlan(BaseModel):
    goal: str
    steps: List[AIPlanStep] = Field(default_factory=list)
    current_step_index: int = 0
    completed: bool = False


class MemoryItem(BaseModel):
    memory_id: str
    type: Literal["preference", "fact", "device", "app", "workflow"]
    key: str
    value: Any
    confidence: float = 1.0
    timestamp: float = Field(default_factory=time.time)


class AIResponse(BaseModel):
    response_text: str
    state: AIStateName
    tool_calls_executed: List[ToolResult] = Field(default_factory=list)
    plan: Optional[AIPlan] = None
    verified: bool = True
    data: Optional[Dict[str, Any]] = None
    requires_confirmation: bool = False
    confirmation_id: Optional[str] = None
