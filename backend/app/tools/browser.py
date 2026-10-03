"""
Browser Interface Tools for Project SOL AI Subsystem.
Prepares browser automation capabilities for SOL computer-use pipeline.
Returns explicit CAPABILITY_UNAVAILABLE status when browser driver is offline.
"""
from typing import Any, Dict


def browser_open_tool(url: str = "about:blank") -> Dict[str, Any]:
    return {
        "success": False,
        "verified": False,
        "error_code": "CAPABILITY_UNAVAILABLE",
        "message": "Full browser automation driver is not currently active on this device. (Scheduled for upcoming computer-use update).",
    }


def browser_navigate_tool(url: str) -> Dict[str, Any]:
    return browser_open_tool(url)


def browser_search_tool(query: str) -> Dict[str, Any]:
    return {
        "success": False,
        "verified": False,
        "error_code": "CAPABILITY_UNAVAILABLE",
        "message": f"Browser web search for '{query}' is not active because browser automation driver is offline.",
    }


def browser_get_page_tool() -> Dict[str, Any]:
    return browser_open_tool()


def browser_close_tool() -> Dict[str, Any]:
    return {
        "success": True,
        "verified": True,
        "message": "No active automated browser instance to close.",
    }
