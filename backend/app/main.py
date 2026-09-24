"""
Project SOL — Python FastAPI Runtime Daemon Entry Point.
Provides HTTP REST endpoints (/health, /api/runtime/status)
and WebSocket communication stream (/ws/runtime).
"""
import asyncio
import sys
import platform
import time
from contextlib import asynccontextmanager
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware

from backend.app.models import OutboundFrame
from backend.app.websocket import manager, handle_command_lifecycle
from backend.app.runtime import host_monitor

start_timestamp = time.time()
telemetry_task = None


async def broadcast_telemetry_loop():
    """Background task sending real host telemetry every 3 seconds to active WebSocket clients"""
    while True:
        try:
            if manager.active_connections:
                snapshot = host_monitor.get_telemetry_snapshot()
                await manager.broadcast(snapshot.model_dump())
            await asyncio.sleep(3.0)
        except asyncio.CancelledError:
            break
        except Exception as e:
            print(f"[Telemetry Task] Broadcast error: {e}")
            await asyncio.sleep(3.0)


@asynccontextmanager
async def lifespan(app: FastAPI):
    global telemetry_task
    telemetry_task = asyncio.create_task(broadcast_telemetry_loop())
    yield
    if telemetry_task:
        telemetry_task.cancel()


app = FastAPI(
    title="SOL Runtime Daemon",
    version="0.1.0-alpha",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health_check():
    return {
        "status": "ok",
        "service": "SOL Runtime Daemon",
        "timestamp": time.time(),
    }


@app.get("/api/runtime/status")
def runtime_status():
    uptime = round(time.time() - start_timestamp, 1)
    return {
        "status": "running",
        "version": "0.1.0-alpha",
        "pythonVersion": sys.version.split()[0],
        "platform": f"{platform.system()} {platform.release()}",
        "uptimeSeconds": uptime,
        "activeConnections": len(manager.active_connections),
    }


@app.websocket("/ws/runtime")
async def websocket_runtime_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        # Emit initial telemetry immediately upon connection
        snapshot = host_monitor.get_telemetry_snapshot()
        await manager.send_json(websocket, snapshot.model_dump())

        while True:
            data_text = await websocket.receive_text()
            try:
                raw_json = OutboundFrame.model_validate_json(data_text)
                if raw_json.type == "COMMAND_SUBMIT":
                    asyncio.create_task(handle_command_lifecycle(websocket, raw_json))
                elif raw_json.type == "HEARTBEAT":
                    await manager.send_json(websocket, {"type": "HEARTBEAT_ACK", "timestamp": time.time() * 1000})
            except Exception as parse_err:
                print(f"[WS Endpoint] Frame parse error: {parse_err} for payload: {data_text}")
    except WebSocketDisconnect:
        manager.disconnect(websocket)
    except Exception as e:
        print(f"[WS Endpoint] Connection exception: {e}")
        manager.disconnect(websocket)
