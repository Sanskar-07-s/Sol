"""
Dynamic Windows Application Discovery Engine.
Scans Start Menu shortcuts, Registry App Paths, System binaries, and Program Files directories.
"""
import glob
import os
import re
import winreg
from typing import Dict, List, Optional
from app.capabilities.models import DiscoveredApp
from app.capabilities.safety import is_uninstaller_or_helper

try:
    import win32com.client
    HAS_WIN32COM = True
except Exception:
    HAS_WIN32COM = False


class AppScanner:
    def __init__(self):
        self._cache: Dict[str, DiscoveredApp] = {}
        self._last_scan_time: float = 0
        self._wscript_shell = None

    def _get_wscript_shell(self):
        if HAS_WIN32COM and self._wscript_shell is None:
            try:
                self._wscript_shell = win32com.client.Dispatch("WScript.Shell")
            except Exception:
                self._wscript_shell = None
        return self._wscript_shell

    def _resolve_shortcut_target(self, lnk_path: str) -> str:
        """Resolves target executable path from a .lnk shortcut file"""
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

    def normalize_name(self, raw_name: str) -> List[str]:
        """Generate normalized alias names for matching"""
        clean = raw_name.strip()

        # Remove extension if present
        if clean.lower().endswith(".lnk") or clean.lower().endswith(".exe"):
            clean = clean[:-4]

        # Strip version strings like "3.11", "v2", "64-bit"
        clean_base = re.sub(r"\b(v?\d+(\.\d+)*|\(64-bit\)|\(32-bit\)|64-bit|32-bit)\b", "", clean, flags=re.IGNORECASE).strip()
        lower_base = clean_base.lower()

        aliases = set()
        aliases.add(lower_base)
        aliases.add(raw_name.lower().replace(".lnk", "").replace(".exe", "").strip())

        # Common application nickname mapping
        if "visual studio code" in lower_base or lower_base == "code":
            aliases.update(["visual studio code", "vs code", "vscode", "code"])
        elif "google chrome" in lower_base or lower_base == "chrome":
            aliases.update(["google chrome", "chrome"])
        elif "microsoft edge" in lower_base or lower_base == "edge":
            aliases.update(["microsoft edge", "edge"])
        elif "mozilla firefox" in lower_base or lower_base == "firefox":
            aliases.update(["mozilla firefox", "firefox"])
        elif "file explorer" in lower_base or lower_base == "explorer":
            aliases.update(["file explorer", "explorer"])
        elif "calculator" in lower_base or lower_base == "calc":
            aliases.update(["calculator", "calc"])
        elif "notepad" in lower_base:
            aliases.add("notepad")
        elif "wiztree" in lower_base:
            aliases.add("wiztree")
        elif "discord" in lower_base:
            aliases.add("discord")

        # Strip punctuation
        no_punct = re.sub(r"[^\w\s]", "", lower_base).strip()
        if no_punct:
            aliases.add(no_punct)

        return [a for a in aliases if a]

    def scan_all(self, force_refresh: bool = False) -> Dict[str, DiscoveredApp]:
        """Discovers applications across Windows environment sources"""
        if self._cache and not force_refresh:
            return self._cache

        discovered: Dict[str, DiscoveredApp] = {}

        # 1. System Built-in Utilities
        system32_dir = os.path.expandvars(r"%SystemRoot%\System32")
        system_apps = [
            ("Calculator", os.path.join(system32_dir, "calc.exe")),
            ("Notepad", os.path.join(system32_dir, "notepad.exe")),
            ("File Explorer", os.path.expandvars(r"%SystemRoot%\explorer.exe")),
            ("Task Manager", os.path.join(system32_dir, "taskmgr.exe")),
            ("Command Prompt", os.path.join(system32_dir, "cmd.exe")),
            ("PowerShell", os.path.join(system32_dir, "WindowsPowerShell\\v1.0\\powershell.exe")),
            ("Paint", os.path.join(system32_dir, "mspaint.exe")),
        ]

        for app_name, exe_path in system_apps:
            if os.path.exists(exe_path):
                exe_name = os.path.basename(exe_path)
                if not is_uninstaller_or_helper(exe_name, exe_path):
                    norm = self.normalize_name(app_name)
                    discovered[exe_path.lower()] = DiscoveredApp(
                        name=app_name,
                        normalized_names=norm,
                        path=exe_path,
                        source="system32",
                        executable_name=exe_name,
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
                norm = self.normalize_name(app_name)

                # Store by shortcut path
                discovered[lnk.lower()] = DiscoveredApp(
                    name=app_name,
                    normalized_names=norm,
                    path=lnk,
                    source=source_tag,  # type: ignore
                    executable_name=exe_name,
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
                                    norm = self.normalize_name(app_name)
                                    discovered[clean_val.lower()] = DiscoveredApp(
                                        name=app_name,
                                        normalized_names=norm,
                                        path=clean_val,
                                        source="registry",
                                        executable_name=exe_name,
                                        score=85,
                                    )
                    except Exception:
                        continue
                winreg.CloseKey(reg_key)
            except Exception:
                pass

        self._cache = discovered
        return self._cache


app_scanner = AppScanner()
