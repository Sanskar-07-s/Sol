"""
SOL Security & Safety Enclave.
Enforces process protection rules and executable safety boundaries.
"""
import os
import re
from typing import Tuple

# Critical Windows system processes that must NEVER be terminated by user commands
PROTECTED_PROCESSES = {
    "system",
    "registry",
    "smss.exe",
    "csrss.exe",
    "wininit.exe",
    "services.exe",
    "lsass.exe",
    "winlogon.exe",
    "svchost.exe",
    "dwm.exe",
    "explorer.exe",
    "spoolsv.exe",
    "fontdrvhost.exe",
    "sihost.exe",
    "taskhostw.exe",
    "ctfmon.exe",
    "conhost.exe",
    "lsass",
    "svchost",
    "csrss",
    "smss",
    "winlogon",
    "services",
    "wininit",
}

# Uninstaller & Helper executable regex patterns that must NEVER be resolved as main application targets
UNINSTALLER_PATTERNS = [
    r"^uninstall.*",
    r"^unins\d+.*",
    r"^uninstaller.*",
    r".*uninstall.*",
    r"^update\.exe$",
    r"^updater\.exe$",
    r"^crash.*reporter.*",
    r"^repair\.exe$",
    r"^setup_helper.*",
    r"^vcredist.*",
    r"^dxsetup.*",
]


def is_protected_process(name_or_exe: str) -> bool:
    """Returns True if target process is a protected Windows infrastructure process"""
    if not name_or_exe:
        return False
    clean = os.path.basename(name_or_exe).strip().lower()
    clean_no_ext = clean[:-4] if clean.endswith(".exe") else clean

    return clean in PROTECTED_PROCESSES or clean_no_ext in PROTECTED_PROCESSES


def is_uninstaller_or_helper(exe_name: str, full_path: str = "") -> bool:
    """Returns True if executable is an uninstaller, updater, or maintenance utility"""
    if not exe_name:
        return False
    clean_exe = os.path.basename(exe_name).strip().lower()
    clean_path = (full_path or "").strip().lower()

    for pattern in UNINSTALLER_PATTERNS:
        if re.search(pattern, clean_exe, re.IGNORECASE):
            return True
        if clean_path and re.search(pattern, os.path.basename(clean_path), re.IGNORECASE):
            return True

    # Extra check for common uninstaller filenames
    if "unins000" in clean_exe or "uninstall" in clean_exe or "uninstall" in clean_path:
        return True

    return False


def validate_execution_safety(executable_path: str) -> Tuple[bool, str]:
    """Validates if target executable path is safe to launch"""
    if not executable_path:
        return False, "Empty executable path provided."

    clean_path = executable_path.strip()
    if not os.path.exists(clean_path):
        return False, f"Target file '{clean_path}' does not exist on disk."

    exe_name = os.path.basename(clean_path)
    if is_uninstaller_or_helper(exe_name, clean_path):
        return False, f"Safety violation: Target '{exe_name}' identified as an uninstaller or maintenance helper."

    return True, "Path validated safely."
