"""
Structured models for SOL Capability System.
"""
from typing import Any, Dict, List, Literal, Optional
from pydantic import BaseModel, Field

IntentType = Literal[
    "OPEN_APP",
    "CLOSE_APP",
    "SYSTEM_INFO",
    "DEVICE_CAPABILITIES",
    "INSTALLED_APPS",
    "POWER_OP",
    "CONFIRMATION",
    "UNKNOWN"
]


class ParsedIntent(BaseModel):
    intent_type: IntentType
    raw_text: str
    clean_text: str
    target_name: Optional[str] = None
    sub_action: Optional[str] = None  # e.g., "cpu", "ram", "uptime", "status", "shutdown", "restart", "sleep", "hibernate"
    confidence: float = 1.0


class CapabilityResult(BaseModel):
    status: Literal["completed", "unsupported", "failed", "warning"]
    message: str
    data: Optional[Dict[str, Any]] = None
    requires_confirmation: bool = False
    confirmation_id: Optional[str] = None
    agent_name: str = "SOL DEVICE ENGINE"
    capability: Optional[str] = None


class DiscoveredApp(BaseModel):
    name: str
    normalized_names: List[str]
    path: str
    source: Literal[
        "start_menu_user",
        "start_menu_common",
        "registry",
        "system32",
        "program_files",
        "local_app_data",
        "running_process"
    ]
    executable_name: str
    score: int = 0
