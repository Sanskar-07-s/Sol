"""
WebSocket Connection Manager & Frame Router for Project SOL.
"""
import asyncio
import json
import time
from typing import Set
from fastapi import WebSocket, WebSocketDisconnect

from backend.app.models import (
    CommandAcceptedFrame,
    CommandErrorFrame,
    CommandProgressFrame,
    CommandResultFrame,
    CommandStepProgress,
    OutboundFrame,
)
from backend.app.executors.base import executor_registry
from backend.app.runtime import host_monitor


class ConnectionManager:
    def __init__(self):
        self.active_connections: Set[WebSocket] = set()

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.add(websocket)

    def disconnect(self, websocket: WebSocket):
        self.active_connections.discard(websocket)

    async def send_json(self, websocket: WebSocket, data: dict):
        try:
            await websocket.send_text(json.dumps(data))
        except Exception as e:
            print(f"[WS ConnectionManager] Error sending frame: {e}")

    async def broadcast(self, data: dict):
        if not self.active_connections:
            return
        payload = json.dumps(data)
        disconnected = set()
        for connection in self.active_connections:
            try:
                await connection.send_text(payload)
            except Exception:
                disconnected.add(connection)
        for conn in disconnected:
            self.active_connections.discard(conn)


manager = ConnectionManager()


async def handle_command_lifecycle(websocket: WebSocket, frame: OutboundFrame):
    command_id = frame.commandId or f"cmd-{int(time.time() * 1000)}"
    text = frame.text or ""
    now = time.time() * 1000

    # 1. COMMAND_ACCEPTED
    accepted = CommandAcceptedFrame(commandId=command_id, timestamp=now)
    await manager.send_json(websocket, accepted.model_dump())

    await asyncio.sleep(0.2)

    # 2. COMMAND_PROGRESS (Step 1: Classification)
    step1 = CommandProgressFrame(
        commandId=command_id,
        agentName="SYSTEM RUNTIME",
        currentStepIndex=0,
        steps=[
          CommandStepProgress(stepId="1", label="Classifying command capability", status="in_progress"),
          CommandStepProgress(stepId="2", label="Dispatching capability executor", status="pending"),
        ],
        timestamp=time.time() * 1000,
    )
    await manager.send_json(websocket, step1.model_dump())

    await asyncio.sleep(0.3)

    # 3. Dispatch to Executor Registry
    status, message, data_payload = executor_registry.dispatch(text)

    # 4. COMMAND_PROGRESS (Step 2: Execution)
    step2 = CommandProgressFrame(
        commandId=command_id,
        agentName="SOL EXECUTOR",
        currentStepIndex=1,
        steps=[
          CommandStepProgress(stepId="1", label="Classifying command capability", status="completed"),
          CommandStepProgress(
              stepId="2",
              label="Capability execution" if status == "completed" else message,
              status="completed" if status == "completed" else "failed",
          ),
        ],
        timestamp=time.time() * 1000,
    )
    await manager.send_json(websocket, step2.model_dump())

    await asyncio.sleep(0.2)

    # 5. COMMAND_RESULT
    result = CommandResultFrame(
        commandId=command_id,
        status=status,
        message=message,
        data=data_payload,
        timestamp=time.time() * 1000,
    )
    await manager.send_json(websocket, result.model_dump())
