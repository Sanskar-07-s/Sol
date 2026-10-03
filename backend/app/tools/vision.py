"""
Vision Interface Tools for Project SOL AI Subsystem.
Returns explicit CAPABILITY_UNAVAILABLE status when vision model provider is offline.
"""
from typing import Any, Dict


def take_screenshot_tool() -> Dict[str, Any]:
    return {
        "success": False,
        "verified": False,
        "error_code": "CAPABILITY_UNAVAILABLE",
        "message": "Vision capture capability is not currently active on this device bridge.",
    }


def analyze_screen_tool(prompt: str) -> Dict[str, Any]:
    return {
        "success": False,
        "verified": False,
        "error_code": "CAPABILITY_UNAVAILABLE",
        "message": f"Screen vision analysis for '{prompt}' is unavailable because vision model provider is offline.",
    }
