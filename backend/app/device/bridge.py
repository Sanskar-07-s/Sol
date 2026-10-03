"""
Universal Device Bridge for Project SOL.
Connects SOL Intelligence with Device Detection, Catalog Management, Resolver, and Platform Provider.
"""
from typing import Any, Dict, List, Optional, Tuple
from app.device.models import AppCatalog, DeviceInfo, DeviceResolutionResult, DiscoveredApp
from app.device.detector import DeviceDetector
from app.device.catalog import ApplicationCatalogManager
from app.device.resolver import ApplicationResolver
from app.device.providers import get_platform_provider


class DeviceBridge:
    def __init__(self, platform_override: Optional[str] = None):
        self.provider = get_platform_provider(platform_override)
        self.detector = DeviceDetector(platform_override)
        self.catalog_manager = ApplicationCatalogManager(self.provider)
        self.resolver = ApplicationResolver(self.catalog_manager)

    def get_device_info(self) -> DeviceInfo:
        return self.detector.detect_device_info()

    def get_capabilities(self) -> List[str]:
        info = self.get_device_info()
        return info.capabilities

    def get_application_catalog(self, force_refresh: bool = False) -> AppCatalog:
        return self.catalog_manager.get_catalog(force_refresh=force_refresh)

    def search_applications(self, query: str) -> List[DiscoveredApp]:
        return self.catalog_manager.search_apps(query)

    def resolve_application(self, command_text: str) -> DeviceResolutionResult:
        return self.resolver.resolve(command_text)

    def launch_application_by_name(self, command_text: str) -> Tuple[bool, str, Dict[str, Any]]:
        resolution = self.resolve_application(command_text)
        if not resolution.resolved:
            if resolution.ambiguous:
                return False, resolution.message, {
                    "ambiguous": True,
                    "multiple_matches": [a.dict() for a in resolution.multiple_matches],
                }
            return False, resolution.message, {"resolved": False, "errorCode": "APPLICATION_NOT_FOUND"}

        app = resolution.app
        # Verify launch target is valid before launching (Section 12)
        if not self.catalog_manager.is_target_valid(app):
            # Target invalid, invalidate entry and force catalog refresh
            self.catalog_manager.invalidate_app(app.app_id)
            self.catalog_manager.refresh_catalog()
            # Retry resolution once
            retry_res = self.resolve_application(command_text)
            if not retry_res.resolved or not retry_res.app:
                return False, f"Application launch target '{app.launch_target}' is no longer valid or exists on disk.", {"invalid_target": True}
            app = retry_res.app

        # Launch via platform provider
        success, msg, details = self.provider.launch_application(app)
        return success, msg, details

    def close_application(self, target_name: str) -> Tuple[str, str, Dict[str, Any]]:
        return self.provider.close_application(target_name)

    def execute_power_operation(self, action: str, safe_mode: bool = True) -> Tuple[str, str, Dict[str, Any]]:
        return self.provider.execute_power_operation(action, safe_mode=safe_mode)

    def get_capabilities_summary(self) -> str:
        caps = self.get_capabilities()
        info = self.get_device_info()
        cap_labels = {
            "application_discovery": "dynamically discover installed applications",
            "application_launch": "launch desktop applications",
            "application_close": "close user applications safely",
            "process_control": "inspect and manage running system processes",
            "filesystem": "browse and manage local files",
            "system_telemetry": "monitor CPU, RAM, and hardware telemetry",
            "power_management": "control device power (shutdown, restart, sleep) with confirmation",
            "browser_control": "control active web browser instances",
            "screen_capture": "capture screen state",
            "notifications": "send native device notifications",
        }
        lines = [f"I am currently operating on {info.hostname} ({info.os_version}, {info.architecture}). On this device, I can:"]
        for cap in caps:
            desc = cap_labels.get(cap, cap.replace("_", " "))
            lines.append(f"- {desc}")
        return "\n".join(lines)

    def get_installed_apps_summary(self, query: Optional[str] = None) -> str:
        catalog = self.get_application_catalog()
        if query:
            matches = self.search_applications(query)
            if matches:
                names = [f"'{a.display_name}' ({a.source})" for a in matches[:10]]
                return f"Found {len(matches)} matching application(s) for '{query}' on {self.provider.get_platform_name()}:\n- " + "\n- ".join(names)
            else:
                return f"No application matching '{query}' was found on this device."
        else:
            sample = [a.display_name for a in catalog.apps[:15]]
            sample_str = ", ".join(sample)
            return f"Discovered {catalog.total_count} applications on this device using platform-native discovery.\nSample apps: {sample_str}..."


# Singleton global instance for SOL device bridge
device_bridge = DeviceBridge()
