"""
Device & Platform Capabilities Tools for Project SOL.
"""
from typing import Any, Dict
from app.device import device_bridge


def get_device_info_tool() -> Dict[str, Any]:
    info = device_bridge.get_device_info()
    return {"success": True, "verified": True, "device_info": info.dict()}


def get_device_capabilities_tool() -> Dict[str, Any]:
    caps = device_bridge.get_capabilities()
    summary = device_bridge.get_capabilities_summary()
    return {"success": True, "verified": True, "capabilities": caps, "summary": summary}
