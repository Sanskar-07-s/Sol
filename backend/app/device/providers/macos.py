"""
macOS Platform Provider for Project SOL Universal Device Architecture.
Implements macOS application discovery (.app bundles), launch verification, process control, and power management.
"""
import glob
import os
import platform
import subprocess
from typing import Any, Dict, List, Tuple

from app.device.models import CapabilityType, DiscoveredApp, OSPlatform
from app.device.providers.base import BasePlatformProvider

MACOS_PROTECTED_PROCESSES = {
    "launchd", "kernelmanagerd", "windowserver", "syslogd", "opendirectoryd",
    "powerd", "coreaudiod", "loginwindow", "finder", "dock", "systemuiserver"
}


class MacOSPlatformProvider(BasePlatformProvider):
    def get_platform_name(self) -> OSPlatform:
        return "macos"

    def get_os_version(self) -> str:
        return f"macOS {platform.mac_ver()[0]} ({platform.machine()})"

    def get_supported_capabilities(self) -> List[CapabilityType]:
        return [
            "application_discovery",
            "application_launch",
            "application_close",
            "process_control",
            "filesystem",
            "system_telemetry",
            "power_management",
            "browser_control",
            "notifications",
        ]

    def _build_aliases(self, app_name: str) -> List[str]:
        name_lower = app_name.lower().replace(".app", "").strip()
        aliases = {name_lower}
        if "safari" in name_lower:
            aliases.update(["safari", "browser", "web browser"])
        elif "chrome" in name_lower:
            aliases.update(["google chrome", "chrome", "browser"])
        elif "firefox" in name_lower:
            aliases.update(["mozilla firefox", "firefox", "browser"])
        elif "visual studio code" in name_lower or name_lower == "code":
            aliases.update(["vs code", "vscode", "code", "visual studio code"])
        elif "terminal" in name_lower or name_lower == "iterm":
            aliases.update(["terminal", "console", "command line"])
        elif "finder" in name_lower:
            aliases.update(["finder", "files", "file manager"])
        elif "spotify" in name_lower:
            aliases.update(["spotify", "music player", "music"])
        elif "discord" in name_lower:
            aliases.update(["discord", "chat"])
        return list(aliases)

    def discover_applications(self) -> List[DiscoveredApp]:
        discovered: Dict[str, DiscoveredApp] = {}
        app_dirs = [
            "/Applications",
            "/System/Applications",
            "/System/Applications/Utilities",
            os.path.expanduser("~/Applications"),
        ]

        for app_dir in app_dirs:
            if not os.path.exists(app_dir):
                continue
            for root, dirs, _ in os.walk(app_dir):
                for d in dirs:
                    if d.endswith(".app"):
                        app_name = d[:-4]
                        bundle_path = os.path.join(root, d)
                        app_id = f"mac-app-{app_name.lower().replace(' ', '-')}"
                        if app_id not in discovered:
                            aliases = self._build_aliases(app_name)
                            discovered[app_id] = DiscoveredApp(
                                app_id=app_id,
                                name=app_name,
                                display_name=app_name,
                                executable=app_name,
                                launch_target=bundle_path,
                                platform="macos",
                                source=app_dir,
                                aliases=aliases,
                                score=90,
                            )
                # Don't descend inside .app directories
                dirs[:] = [d for d in dirs if not d.endswith(".app")]

        return list(discovered.values())

    def launch_application(self, app: DiscoveredApp) -> Tuple[bool, str, Dict[str, Any]]:
        try:
            # Use 'open -a <bundle_path_or_name>'
            target = app.launch_target if os.path.exists(app.launch_target) else app.name
            res = subprocess.run(["open", "-a", target], capture_output=True, text=True, timeout=5)
            if res.returncode == 0:
                return True, f"Successfully launched {app.display_name} on macOS.", {"app_id": app.app_id, "platform": "macos"}
            return False, f"Failed to launch {app.display_name}: {res.stderr.strip()}", {"app_id": app.app_id, "platform": "macos"}
        except Exception as e:
            return False, f"Error launching {app.display_name}: {str(e)}", {"app_id": app.app_id, "platform": "macos"}

    def verify_application_running(self, app: DiscoveredApp) -> bool:
        try:
            res = subprocess.run(["pgrep", "-fi", app.executable], capture_output=True, text=True)
            return res.returncode == 0 and len(res.stdout.strip()) > 0
        except Exception:
            return False

    def close_application(self, target_name: str) -> Tuple[str, str, Dict[str, Any]]:
        if not self.is_safe_to_terminate(target_name):
            return "failed", f"Cannot terminate protected macOS system process '{target_name}'.", {"protected": True}

        try:
            # Gracefully request quit via AppleScript
            applescript = f'tell application "{target_name}" to quit'
            res = subprocess.run(["osascript", "-e", applescript], capture_output=True, text=True, timeout=5)
            if res.returncode == 0:
                return "completed", f"Closed {target_name} on macOS.", {"target": target_name, "method": "applescript"}
            
            # Fallback to pkill
            res_kill = subprocess.run(["pkill", "-f", target_name], capture_output=True, text=True)
            if res_kill.returncode == 0:
                return "completed", f"Terminated {target_name} process on macOS.", {"target": target_name, "method": "pkill"}
            
            return "failed", f"Could not close {target_name}: {res.stderr.strip()}", {"target": target_name}
        except Exception as e:
            return "failed", f"Error closing {target_name}: {str(e)}", {"target": target_name}

    def is_safe_to_terminate(self, process_name: str) -> bool:
        name_clean = process_name.lower().strip().replace(".app", "")
        return name_clean not in MACOS_PROTECTED_PROCESSES

    def execute_power_operation(self, action: str, safe_mode: bool = True) -> Tuple[str, str, Dict[str, Any]]:
        action_type = action.lower().strip()
        if safe_mode:
            return (
                "completed",
                f"POWER ACTION CONFIRMED // Simulated '{action_type}' passed safety verification on macOS. (Host system power action skipped in dev test mode).",
                {"action": action_type, "simulated": True, "platform": "macos"},
            )

        if action_type in ("shutdown", "power off"):
            os.system("sudo shutdown -h now")
        elif action_type in ("restart", "reboot"):
            os.system("sudo shutdown -r now")
        elif action_type == "sleep":
            os.system("pmset sleepnow")

        return (
            "completed",
            f"Executing macOS {action_type}...",
            {"action": action_type, "simulated": False, "platform": "macos"},
        )
