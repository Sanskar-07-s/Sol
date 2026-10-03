"""
Linux Platform Provider for Project SOL Universal Device Architecture.
Implements Linux application discovery (.desktop files, XDG standards), launch verification, process control, and power management.
"""
import glob
import os
import platform
import re
import subprocess
from typing import Any, Dict, List, Tuple

from app.device.models import CapabilityType, DiscoveredApp, OSPlatform
from app.device.providers.base import BasePlatformProvider

LINUX_PROTECTED_PROCESSES = {
    "init", "systemd", "kthreadd", "dbus-daemon", "xorg", "wayland", "mutter",
    "gnome-shell", "kwin", "pipewire", "pulseaudio", "networkmanager", "journald"
}


class LinuxPlatformProvider(BasePlatformProvider):
    def get_platform_name(self) -> OSPlatform:
        return "linux"

    def get_os_version(self) -> str:
        return f"Linux {platform.release()} ({platform.machine()})"

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

    def _parse_desktop_file(self, filepath: str) -> Dict[str, str]:
        data = {}
        try:
            with open(filepath, "r", encoding="utf-8", errors="ignore") as f:
                in_main_entry = False
                for line in f:
                    line = line.strip()
                    if line == "[Desktop Entry]":
                        in_main_entry = True
                        continue
                    elif line.startswith("[") and line.endswith("]"):
                        in_main_entry = False
                        continue

                    if in_main_entry and "=" in line:
                        key, val = line.split("=", 1)
                        data[key.strip()] = val.strip()
        except Exception:
            pass
        return data

    def _clean_exec_cmd(self, exec_str: str) -> str:
        # Remove XDG field codes (%f, %F, %u, %U, %d, %D, %n, %N, %i, %c, %k)
        cleaned = re.sub(r"%[fFuUdDnNick]", "", exec_str).strip()
        return cleaned

    def _build_aliases(self, app_name: str, exec_cmd: str) -> List[str]:
        name_lower = app_name.lower().strip()
        exec_base = os.path.basename(exec_cmd.split()[0]).lower() if exec_cmd else ""
        aliases = {name_lower, exec_base}

        if "chrome" in name_lower or "google-chrome" in exec_base:
            aliases.update(["google chrome", "chrome", "browser", "web browser"])
        elif "firefox" in name_lower or "firefox" in exec_base:
            aliases.update(["mozilla firefox", "firefox", "browser"])
        elif "code" in name_lower or "code" in exec_base:
            aliases.update(["vs code", "vscode", "visual studio code", "code"])
        elif "terminal" in name_lower or "gnome-terminal" in exec_base:
            aliases.update(["terminal", "console", "command line", "bash"])
        elif "files" in name_lower or "nautilus" in exec_base or "dolphin" in exec_base:
            aliases.update(["files", "file manager", "explorer"])
        elif "vlc" in name_lower or "vlc" in exec_base:
            aliases.update(["vlc", "media player", "video player"])
        elif "discord" in name_lower or "discord" in exec_base:
            aliases.update(["discord", "chat"])
        elif "spotify" in name_lower or "spotify" in exec_base:
            aliases.update(["spotify", "music", "music player"])
        return list(aliases)

    def discover_applications(self) -> List[DiscoveredApp]:
        discovered: Dict[str, DiscoveredApp] = {}
        desktop_dirs = [
            "/usr/share/applications",
            "/usr/local/share/applications",
            os.path.expanduser("~/.local/share/applications"),
            "/var/lib/flatpak/exports/share/applications",
            os.path.expanduser("~/.local/share/flatpak/exports/share/applications"),
        ]

        for ddir in desktop_dirs:
            if not os.path.exists(ddir):
                continue
            for dfile in glob.glob(os.path.join(ddir, "*.desktop")):
                desktop_data = self._parse_desktop_file(dfile)
                if desktop_data.get("Type") == "Application" and desktop_data.get("NoDisplay") != "true":
                    name = desktop_data.get("Name")
                    exec_str = desktop_data.get("Exec")
                    if name and exec_str:
                        clean_exec = self._clean_exec_cmd(exec_str)
                        exec_bin = clean_exec.split()[0] if clean_exec else ""
                        categories = [c.strip() for c in desktop_data.get("Categories", "").split(";") if c.strip()]
                        aliases = self._build_aliases(name, exec_bin)

                        desktop_id = os.path.basename(dfile).replace(".desktop", "")
                        app_id = f"linux-app-{desktop_id.lower().replace(' ', '-')}"

                        if app_id not in discovered:
                            discovered[app_id] = DiscoveredApp(
                                app_id=app_id,
                                name=name,
                                display_name=name,
                                executable=os.path.basename(exec_bin),
                                launch_target=clean_exec,
                                platform="linux",
                                source=ddir,
                                categories=categories,
                                aliases=aliases,
                                score=90,
                            )

        return list(discovered.values())

    def launch_application(self, app: DiscoveredApp) -> Tuple[bool, str, Dict[str, Any]]:
        try:
            # Try launching with nohup in background
            cmd = f"nohup {app.launch_target} >/dev/null 2>&1 &"
            subprocess.Popen(cmd, shell=True)
            return True, f"Successfully launched {app.display_name} on Linux.", {"app_id": app.app_id, "platform": "linux"}
        except Exception as e:
            return False, f"Error launching {app.display_name}: {str(e)}", {"app_id": app.app_id, "platform": "linux"}

    def verify_application_running(self, app: DiscoveredApp) -> bool:
        try:
            res = subprocess.run(["pgrep", "-fi", app.executable], capture_output=True, text=True)
            return res.returncode == 0 and len(res.stdout.strip()) > 0
        except Exception:
            return False

    def close_application(self, target_name: str) -> Tuple[str, str, Dict[str, Any]]:
        if not self.is_safe_to_terminate(target_name):
            return "failed", f"Cannot terminate protected Linux system process '{target_name}'.", {"protected": True}

        try:
            res = subprocess.run(["pkill", "-f", target_name], capture_output=True, text=True)
            if res.returncode == 0:
                return "completed", f"Closed {target_name} on Linux.", {"target": target_name}
            return "failed", f"Could not find or close {target_name}.", {"target": target_name}
        except Exception as e:
            return "failed", f"Error closing {target_name}: {str(e)}", {"target": target_name}

    def is_safe_to_terminate(self, process_name: str) -> bool:
        name_clean = process_name.lower().strip()
        return name_clean not in LINUX_PROTECTED_PROCESSES

    def execute_power_operation(self, action: str, safe_mode: bool = True) -> Tuple[str, str, Dict[str, Any]]:
        action_type = action.lower().strip()
        if safe_mode:
            return (
                "completed",
                f"POWER ACTION CONFIRMED // Simulated '{action_type}' passed safety verification on Linux. (Host system power action skipped in dev test mode).",
                {"action": action_type, "simulated": True, "platform": "linux"},
            )

        if action_type in ("shutdown", "power off"):
            os.system("systemctl poweroff")
        elif action_type in ("restart", "reboot"):
            os.system("systemctl reboot")
        elif action_type == "sleep":
            os.system("systemctl suspend")
        elif action_type == "hibernate":
            os.system("systemctl hibernate")

        return (
            "completed",
            f"Executing Linux {action_type}...",
            {"action": action_type, "simulated": False, "platform": "linux"},
        )
