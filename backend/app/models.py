"""
Pydantic message models matching SOL WebSocket protocol contract.
"""
from typing import Any, Dict, List, Literal, Optional
from pydantic import BaseModel, Field


class OutboundFrame(BaseModel):
    """Frame sent from Frontend to Python Backend"""
    type: Literal["COMMAND_SUBMIT", "CANCEL_TASK", "HEARTBEAT"]
    commandId: Optional[str] = None
    text: Optional[str] = None
    source: Optional[Literal["text", "voice"]] = "text"
    taskId: Optional[str] = None
    timestamp: Optional[float] = None


class CommandStepProgress(BaseModel):
    stepId: str
    label: str
    status: Literal["pending", "in_progress", "completed", "failed"]


class CommandAcceptedFrame(BaseModel):
    type: Literal["COMMAND_ACCEPTED"] = "COMMAND_ACCEPTED"
    commandId: str
    timestamp: float


class CommandProgressFrame(BaseModel):
    type: Literal["COMMAND_PROGRESS"] = "COMMAND_PROGRESS"
    commandId: str
    agentName: str
    currentStepIndex: int
    steps: List[CommandStepProgress]
    timestamp: float


class CommandResultFrame(BaseModel):
    type: Literal["COMMAND_RESULT"] = "COMMAND_RESULT"
    commandId: str
    status: Literal["completed", "unsupported", "failed"]
    message: str
    data: Optional[Dict[str, Any]] = None
    timestamp: float


class CommandErrorFrame(BaseModel):
    type: Literal["COMMAND_ERROR"] = "COMMAND_ERROR"
    commandId: str
    errorCode: str
    message: str
    timestamp: float


class TelemetryFrame(BaseModel):
    type: Literal["TELEMETRY_UPDATE"] = "TELEMETRY_UPDATE"
    cpuUsagePct: float
    memoryUsagePct: float
    memoryUsedGb: float
    memoryTotalGb: float
    gpuUsagePct: Optional[float] = 0.0
    gpuVramUsedGb: Optional[float] = 0.0
    networkLatencyMs: float
    uptimeSeconds: float
    isReal: bool = True
    timestamp: float
