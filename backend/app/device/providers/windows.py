"""
Windows Platform Provider for Project SOL Universal Device Architecture.
Implements dynamic Windows application discovery, launch verification, process control, and power management.
"""
import glob
import os
import platform
import re
import sys
import winreg
from typing import Any, Dict, List, Set, Tuple

from app.device.models import CapabilityType, DiscoveredApp, OSPlatform
from app.device.providers.base import BasePlatformProvider
from app.capabilities.safety import is_protected_process, is_uninstaller_or_helper
from app.capabilities.verifier import launch_and_verify_application, close_and_verify_application, get_matching_pids

try:
    import win32com.client
    HAS_WIN32COM = True
except Exception:
    HAS_WIN32COM = False


class WindowsPlatformProvider(BasePlatformProvider):
    def __init__(self):
        self._wscript_shell = None

    def _get_wscript_shell(self):
        if HAS_WIN32COM and self._wscript_shell is None:
            try:
                self._wscript_shell = win32com.client.Dispatch("WScript.Shell")
            except Exception:
                self._wscript_shell = None
        return self._wscript_shell

    def get_platform_name(self) -> OSPlatform:
        return "windows"

    def get_os_version(self) -> str:
        return f"{platform.system()} {platform.release()} ({platform.version()})"

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

    def _resolve_shortcut_target(self, lnk_path: str) -> str:
        shell = self._get_wscript_shell()
        if shell:
            try:
                shortcut = shell.CreateShortcut(lnk_path)
                target = shortcut.TargetPath
                if target and os.path.exists(target):
                    return target
            except Exception:
                pass
        return lnk_path

    def _build_aliases(self, app_name: str, exe_name: str) -> List[str]:
        clean = app_name.strip()
        if clean.lower().endswith(".lnk") or clean.lower().endswith(".exe"):
            clean = clean[:-4]

        clean_base = re.sub(
            r"\b(v?\d+(\.\d+)*|\(64-bit\)|\(32-bit\)|64-bit|32-bit)\b",
            "",
            clean,
            flags=re.IGNORECASE,
        ).strip()
        lower_base = clean_base.lower()

        aliases = set()
        aliases.add(lower_base)
        aliases.add(app_name.lower().replace(".lnk", "").replace(".exe", "").strip())
        aliases.add(exe_name.lower().replace(".exe", ""))

        # Category / Browser / Common Nicknames
        if "visual studio code" in lower_base or lower_base == "code":
            aliases.update(["visual studio code", "vs code", "vscode", "code"])
        elif "google chrome" in lower_base or lower_base == "chrome":
            aliases.update(["google chrome", "chrome", "browser", "web browser"])
        elif "microsoft edge" in lower_base or lower_base == "edge":
            aliases.update(["microsoft edge", "edge", "browser"])
        elif "mozilla firefox" in lower_base or lower_base == "firefox":
            aliases.update(["mozilla firefox", "firefox", "browser"])
        elif "file explorer" in lower_base or lower_base == "explorer":
            aliases.update(["file explorer", "explorer", "files", "my computer"])
        elif "calculator" in lower_base or lower_base == "calc":
            aliases.update(["calculator", "calc"])
        elif "notepad" in lower_base:
            aliases.update(["notepad", "text editor"])
        elif "wiztree" in lower_base:
            aliases.update(["wiztree", "disk analyzer"])

        no_punct = re.sub(r"[^\w\s]", "", lower_base).strip()
        if no_punct:
            aliases.add(no_punct)

        return [a for a in aliases if a]

    def discover_applications(self) -> List[DiscoveredApp]:
        discovered: Dict[str, DiscoveredApp] = {}

        # 1. System Built-in Utilities
        system32_dir = os.path.expandvars(r"%SystemRoot%\System32")
        system_apps = [
            ("Calculator", os.path.join(system32_dir, "calc.exe"), ["calculator", "utility"]),
            ("Notepad", os.path.join(system32_dir, "notepad.exe"), ["text editor", "utility"]),
            ("File Explorer", os.path.expandvars(r"%SystemRoot%\explorer.exe"), ["file manager", "utility"]),
            ("Task Manager", os.path.join(system32_dir, "taskmgr.exe"), ["system", "utility"]),
            ("Command Prompt", os.path.join(system32_dir, "cmd.exe"), ["terminal", "developer"]),
            ("PowerShell", os.path.join(system32_dir, "WindowsPowerShell\\v1.0\\powershell.exe"), ["terminal", "developer"]),
            ("Paint", os.path.join(system32_dir, "mspaint.exe"), ["graphics", "utility"]),
        ]

        for app_name, exe_path, cats in system_apps:
            if os.path.exists(exe_path):
                exe_name = os.path.basename(exe_path)
                if not is_uninstaller_or_helper(exe_name, exe_path):
                    aliases = self._build_aliases(app_name, exe_name)
                    app_id = f"win-sys-{exe_name.lower().replace('.exe', '')}"
                    discovered[app_id] = DiscoveredApp(
                        app_id=app_id,
                        name=app_name,
                        display_name=app_name,
                        executable=exe_name,
                        launch_target=exe_path,
                        platform="windows",
                        source="system32",
                        categories=cats,
                        aliases=aliases,
                        score=90,
                    )

        # 2. User & Common Start Menu Shortcuts (.lnk files)
        start_menu_paths = [
            (os.path.expandvars(r"%APPDATA%\Microsoft\Windows\Start Menu\Programs"), "start_menu_user"),
            (r"C:\ProgramData\Microsoft\Windows\Start Menu\Programs", "start_menu_common"),
        ]

        for base_dir, source_tag in start_menu_paths:
            if not os.path.exists(base_dir):
                continue
            lnk_files = glob.glob(os.path.join(base_dir, "**", "*.lnk"), recursive=True)
            for lnk in lnk_files:
                file_name = os.path.basename(lnk)
                target_path = self._resolve_shortcut_target(lnk)
                exe_name = os.path.basename(target_path or lnk)

                if is_uninstaller_or_helper(exe_name, target_path or lnk):
                    continue

                app_name = file_name[:-4]  # Strip .lnk
                aliases = self._build_aliases(app_name, exe_name)
                clean_id = re.sub(r'[^\w]', '', app_name.lower())
                app_id = f"win-lnk-{clean_id}"

                discovered[app_id] = DiscoveredApp(
                    app_id=app_id,
                    name=app_name,
                    display_name=app_name,
                    executable=exe_name,
                    launch_target=lnk,
                    platform="windows",
                    source=source_tag,
                    aliases=aliases,
                    score=100,
                )

        # 3. Registry App Paths
        registry_keys = [
            (winreg.HKEY_LOCAL_MACHINE, r"SOFTWARE\Microsoft\Windows\CurrentVersion\App Paths"),
            (winreg.HKEY_CURRENT_USER, r"SOFTWARE\Microsoft\Windows\CurrentVersion\App Paths"),
        ]

        for root_key, key_path in registry_keys:
            try:
                reg_key = winreg.OpenKey(root_key, key_path, 0, winreg.KEY_READ)
                count = winreg.QueryInfoKey(reg_key)[0]
                for i in range(count):
                    try:
                        sub_name = winreg.EnumKey(reg_key, i)
                        sub_key = winreg.OpenKey(reg_key, sub_name, 0, winreg.KEY_READ)
                        val, _ = winreg.QueryValueEx(sub_key, "")
                        winreg.CloseKey(sub_key)

                        if val and isinstance(val, str):
                            clean_val = val.strip('"')
                            if os.path.exists(clean_val):
                                exe_name = os.path.basename(clean_val)
                                if not is_uninstaller_or_helper(exe_name, clean_val):
                                    app_name = sub_name.replace(".exe", "").title()
                                    aliases = self._build_aliases(app_name, exe_name)
                                    app_id = f"win-reg-{exe_name.lower().replace('.exe', '')}"
                                    if app_id not in discovered:
                                        discovered[app_id] = DiscoveredApp(
                                            app_id=app_id,
                                            name=app_name,
                                            display_name=app_name,
                                            executable=exe_name,
                                            launch_target=clean_val,
                                            platform="windows",
                                            source="registry",
                                            aliases=aliases,
                                            score=85,
                                        )
                    except Exception:
                        continue
                winreg.CloseKey(reg_key)
            except Exception:
                pass

        return list(discovered.values())

    def launch_application(self, app: DiscoveredApp) -> Tuple[bool, str, Dict[str, Any]]:
        return launch_and_verify_application(app, timeout=3.0)

    def verify_application_running(self, app: DiscoveredApp) -> bool:
        pids = get_matching_pids(app.name, app.executable, app.launch_target)
        return len(pids) > 0

    def close_application(self, target_name: str) -> Tuple[str, str, Dict[str, Any]]:
        return close_and_verify_application(target_name, timeout=2.5)

    def is_safe_to_terminate(self, process_name: str) -> bool:
        return not is_protected_process(process_name)

    def execute_power_operation(self, action: str, safe_mode: bool = True) -> Tuple[str, str, Dict[str, Any]]:
        action_type = action.lower().strip()
        if safe_mode:
            return (
                "completed",
                f"POWER ACTION CONFIRMED // Simulated '{action_type}' passed safety verification on Windows. (Host system power action skipped in dev test mode).",
                {"action": action_type, "simulated": True, "platform": "windows"},
            )

        if action_type in ("shutdown", "power off"):
            os.system("shutdown /s /t 10")
        elif action_type in ("restart", "reboot"):
            os.system("shutdown /r /t 10")
        elif action_type == "sleep":
            os.system("rundll32.exe powrprof.dll,SetSuspendState 0,1,0")
        elif action_type == "hibernate":
            os.system("shutdown /h")

        return (
            "completed",
            f"Executing Windows {action_type}...",
            {"action": action_type, "simulated": False, "platform": "windows"},
        )
