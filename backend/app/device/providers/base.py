"""
Base Platform Provider Interface for Project SOL Universal Device Architecture.
"""
from typing import Any, Dict, List, Tuple
from app.device.models import CapabilityType, DiscoveredApp, OSPlatform


class BasePlatformProvider:
    """Abstract Base Class for Platform-Specific Device Providers"""

    def get_platform_name(self) -> OSPlatform:
        raise NotImplementedError

    def get_os_version(self) -> str:
        raise NotImplementedError

    def get_supported_capabilities(self) -> List[CapabilityType]:
        raise NotImplementedError

    def discover_applications(self) -> List[DiscoveredApp]:
        raise NotImplementedError

    def launch_application(self, app: DiscoveredApp) -> Tuple[bool, str, Dict[str, Any]]:
        raise NotImplementedError

    def verify_application_running(self, app: DiscoveredApp) -> bool:
        raise NotImplementedError

    def close_application(self, target_name: str) -> Tuple[str, str, Dict[str, Any]]:
        raise NotImplementedError

    def is_safe_to_terminate(self, process_name: str) -> bool:
        raise NotImplementedError

    def execute_power_operation(self, action: str, safe_mode: bool = True) -> Tuple[str, str, Dict[str, Any]]:
        raise NotImplementedError
