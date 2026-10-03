"""
Application Management Tools for Project SOL AI Subsystem.
Integrates with Universal Device Bridge for application launch, close, listing, and dynamic search.
"""
from typing import Any, Dict, List, Tuple
from app.device import device_bridge


def launch_application_tool(app_name: str) -> Dict[str, Any]:
    """Launch a host application dynamically resolved from the application catalog."""
    success, msg, details = device_bridge.launch_application_by_name(app_name)
    return {
        "success": success,
        "verified": success,
        "message": msg,
        "details": details,
    }


def close_application_tool(app_name: str) -> Dict[str, Any]:
    """Close a user application safely via platform provider."""
    status, msg, details = device_bridge.close_application(app_name)
    success = status == "completed"
    return {
        "success": success,
        "verified": success,
        "message": msg,
        "details": details,
    }


def list_applications_tool(query: str = "") -> Dict[str, Any]:
    """List or filter dynamically discovered host applications."""
    catalog = device_bridge.get_application_catalog()
    if query:
        matches = device_bridge.search_applications(query)
        apps_data = [{"name": a.display_name, "executable": a.executable, "source": a.source} for a in matches[:15]]
        return {
            "success": True,
            "verified": True,
            "total_count": catalog.total_count,
            "filtered_count": len(matches),
            "apps": apps_data,
        }
    else:
        sample = [{"name": a.display_name, "executable": a.executable, "source": a.source} for a in catalog.apps[:20]]
        return {
            "success": True,
            "verified": True,
            "total_count": catalog.total_count,
            "sample_apps": sample,
        }


def search_applications_tool(query: str) -> Dict[str, Any]:
    """Search application catalog for specific target name or alias."""
    return list_applications_tool(query=query)
