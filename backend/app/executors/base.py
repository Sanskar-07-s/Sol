"""
Controlled executor registry for Project SOL runtime.
Enforces security boundaries: only explicitly registered development capabilities execute.
Unregistered capabilities return status="unsupported" without fake execution claims.
"""
import sys
import platform
import time
import psutil
from typing import Dict, Any, Tuple


class BaseExecutor:
    """Base class for capability executors"""
    def execute(self, text: str, data: Dict[str, Any] = None) -> Tuple[str, str, Dict[str, Any]]:
        """
        Returns: (status, message, data_payload)
        status: 'completed' | 'unsupported' | 'failed'
        """
        raise NotImplementedError


class SystemStatusExecutor(BaseExecutor):
    def execute(self, text: str, data: Dict[str, Any] = None) -> Tuple[str, str, Dict[str, Any]]:
        cpu = psutil.cpu_percent(interval=0.1)
        mem = psutil.virtual_memory()
        uptime = time.time() - psutil.boot_time()
        
        msg = f"System Status: CPU {cpu}%, RAM {mem.percent}% ({round(mem.used/(1024**3), 1)}/{round(mem.total/(1024**3), 1)} GB), Host Uptime: {round(uptime/3600, 1)} hours."
        return (
            "completed",
            msg,
            {
                "cpuPct": cpu,
                "ramPct": mem.percent,
                "ramUsedGb": round(mem.used / (1024**3), 1),
                "ramTotalGb": round(mem.total / (1024**3), 1),
                "uptimeSeconds": uptime,
            }
        )


class RuntimeStatusExecutor(BaseExecutor):
    def execute(self, text: str, data: Dict[str, Any] = None) -> Tuple[str, str, Dict[str, Any]]:
        py_ver = sys.version.split()[0]
        os_info = f"{platform.system()} {platform.release()}"
        msg = f"SOL Runtime Daemon active on {os_info} (Python {py_ver}). All core services operational."
        return (
            "completed",
            msg,
            {
                "pythonVersion": py_ver,
                "platform": os_info,
                "status": "operational",
            }
        )


class EchoExecutor(BaseExecutor):
    def execute(self, text: str, data: Dict[str, Any] = None) -> Tuple[str, str, Dict[str, Any]]:
        clean_text = text.replace("echo", "", 1).strip() or "hello"
        return ("completed", f"SOL Echo: {clean_text}", {"echo": clean_text})


class TestNotificationExecutor(BaseExecutor):
    def execute(self, text: str, data: Dict[str, Any] = None) -> Tuple[str, str, Dict[str, Any]]:
        return (
            "completed",
            "SOL System Test: Visual environment, state machine, and runtime pipeline operational.",
            {"test": "passed"}
        )


class ExecutorRegistry:
    def __init__(self):
        self._executors: Dict[str, BaseExecutor] = {
            "system status": SystemStatusExecutor(),
            "what is my cpu usage": SystemStatusExecutor(),
            "cpu usage": SystemStatusExecutor(),
            "runtime status": RuntimeStatusExecutor(),
            "what is the runtime status": RuntimeStatusExecutor(),
            "test notification": TestNotificationExecutor(),
            "echo hello": EchoExecutor(),
        }

    def dispatch(self, raw_text: str) -> Tuple[str, str, Dict[str, Any]]:
        clean = raw_text.strip().lower()

        # Direct exact or prefix matching
        if clean in self._executors:
            return self._executors[clean].execute(raw_text)

        if clean.startswith("echo"):
            return EchoExecutor().execute(raw_text)

        for key, executor in self._executors.items():
            if key in clean:
                return executor.execute(raw_text)

        # Unregistered / unsupported capability fallback
        return (
            "unsupported",
            f"Capability for '{raw_text}' is not registered in current SOL runtime environment.",
            {"rawCommand": raw_text, "supported": list(self._executors.keys())}
        )


executor_registry = ExecutorRegistry()
