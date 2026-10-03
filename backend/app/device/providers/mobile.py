"""
Mobile Device Provider Stub (Android / iOS) for Project SOL Universal Device Architecture.
Implements capability boundary handling when SOL interacts with mobile or remote device bridges.
"""
from typing import Any, Dict, List, Tuple
from app.device.models import CapabilityType, DiscoveredApp, OSPlatform
from app.device.providers.base import BasePlatformProvider


class MobileDeviceProvider(BasePlatformProvider):
    def __init__(self, platform_name: OSPlatform = "android"):
        self._platform_name: OSPlatform = platform_name if platform_name in ("android", "ios") else "android"

    def get_platform_name(self) -> OSPlatform:
        return self._platform_name

    def get_os_version(self) -> str:
        return f"{self._platform_name.upper()} Remote Device Bridge (Unconnected)"

    def get_supported_capabilities(self) -> List[CapabilityType]:
        # Mobile bridge currently only exposes basic telemetry and notifications until paired
        return [
            "system_telemetry",
            "notifications",
        ]

    def discover_applications(self) -> List[DiscoveredApp]:
        return []

    def launch_application(self, app: DiscoveredApp) -> Tuple[bool, str, Dict[str, Any]]:
        return (
            False,
            "Application control is not available through the current mobile device bridge.",
            {
                "success": False,
                "error_code": "CAPABILITY_UNAVAILABLE",
                "message": "Application control is not available through the current mobile device bridge.",
                "platform": self._platform_name,
            },
        )

    def verify_application_running(self, app: DiscoveredApp) -> bool:
        return False

    def close_application(self, target_name: str) -> Tuple[str, str, Dict[str, Any]]:
        return (
            "failed",
            "Application management is not available on this mobile device bridge.",
            {
                "error_code": "CAPABILITY_UNAVAILABLE",
                "message": "Application management is not available on this mobile device bridge.",
                "platform": self._platform_name,
            },
        )

    def is_safe_to_terminate(self, process_name: str) -> bool:
        return False

    def execute_power_operation(self, action: str, safe_mode: bool = True) -> Tuple[str, str, Dict[str, Any]]:
        return (
            "failed",
            "Power management is not supported over mobile device bridges.",
            {
                "error_code": "CAPABILITY_UNAVAILABLE",
                "message": "Power management is not supported over mobile device bridges.",
                "platform": self._platform_name,
            },
        )
