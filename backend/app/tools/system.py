"""
System & Device Telemetry Tools for Project SOL AI Subsystem.
"""
import time
import psutil
from typing import Any, Dict
from app.device import device_bridge


def get_system_status_tool() -> Dict[str, Any]:
    """Retrieve host CPU utilization, RAM usage, and uptime telemetry."""
    cpu = psutil.cpu_percent(interval=0.1)
    mem = psutil.virtual_memory()
    boot = psutil.boot_time()
    uptime_sec = round(time.time() - boot)
    uptime_hrs = round(uptime_sec / 3600, 1)

    return {
        "success": True,
        "verified": True,
        "cpu_usage_pct": cpu,
        "ram_usage_pct": mem.percent,
        "ram_used_gb": round(mem.used / (1024 ** 3), 1),
        "ram_total_gb": round(mem.total / (1024 ** 3), 1),
        "uptime_hours": uptime_hrs,
        "uptime_seconds": uptime_sec,
    }


def get_device_info_tool() -> Dict[str, Any]:
    """Retrieve full hardware and OS platform specifications."""
    info = device_bridge.get_device_info()
    return {
        "success": True,
        "verified": True,
        "device_info": info.dict(),
    }


def get_device_capabilities_tool() -> Dict[str, Any]:
    """Retrieve list of capabilities exposed on the current host device."""
    caps = device_bridge.get_capabilities()
    summary = device_bridge.get_capabilities_summary()
    return {
        "success": True,
        "verified": True,
        "capabilities": caps,
        "summary": summary,
    }


def execute_power_operation_tool(action: str, safe_mode: bool = True) -> Dict[str, Any]:
    """Execute power operations (shutdown, restart, sleep) with confirmation verification."""
    status, msg, details = device_bridge.execute_power_operation(action, safe_mode=safe_mode)
    return {
        "success": status == "completed",
        "verified": True,
        "message": msg,
        "details": details,
    }
