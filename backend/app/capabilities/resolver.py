"""
Application Resolution Engine for Project SOL.
Delegates to universal DeviceBridge for dynamic, platform-agnostic application resolution.
"""
from typing import Optional
from app.capabilities.models import DiscoveredApp
from app.device import device_bridge


class AppResolver:
    def resolve(self, target_name: str) -> Optional[DiscoveredApp]:
        if not target_name or not target_name.strip():
            return None

        result = device_bridge.resolve_application(target_name)
        if result.resolved and result.app:
            # Map device DiscoveredApp model to legacy capabilities DiscoveredApp for backwards compatibility
            d_app = result.app
            return DiscoveredApp(
                name=d_app.name,
                normalized_names=d_app.aliases,
                path=d_app.launch_target,
                source="start_menu_user",
                executable_name=d_app.executable,
                score=d_app.score or 100,
            )
        return None


app_resolver = AppResolver()
