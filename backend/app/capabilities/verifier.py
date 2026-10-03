"""
Process Verification Engine for Project SOL Windows Capabilities.
Verifies actual process appearance upon launch and process termination upon close.
Distinguishes freshly launched applications from already-running applications.
"""
import os
import time
import psutil
from typing import Dict, Any, List, Set, Tuple, Optional
from app.capabilities.models import DiscoveredApp
from app.capabilities.safety import is_protected_process

# Known process name aliases for Windows applications where launcher != running process
KNOWN_PROCESS_ALIASES: Dict[str, List[str]] = {
    "calc.exe": ["calculatorapp.exe", "calculator.exe", "calc.exe"],
    "calculator": ["calculatorapp.exe", "calculator.exe", "calc.exe"],
    "notepad.exe": ["notepad.exe"],
    "notepad": ["notepad.exe"],
    "explorer.exe": ["explorer.exe"],
    "file explorer": ["explorer.exe"],
    "code.exe": ["code.exe"],
    "visual studio code": ["code.exe"],
    "wiztree": ["wiztree64.exe", "wiztree.exe"],
    "wiztree64.exe": ["wiztree64.exe", "wiztree.exe"],
    "chrome.exe": ["chrome.exe"],
    "google chrome": ["chrome.exe"],
    "msedge.exe": ["msedge.exe"],
    "microsoft edge": ["msedge.exe"],
    "discord.exe": ["discord.exe"],
    "discord": ["discord.exe"],
}


def get_process_candidate_names(app_name: str, executable_name: str, path: str = "") -> Set[str]:
    """Generates all possible process names that could represent this application"""
    candidates = set()

    exe_lower = os.path.basename(executable_name or "").lower()
    if exe_lower:
        candidates.add(exe_lower)
        candidates.add(exe_lower.replace(".exe", ""))

    app_lower = (app_name or "").lower()
    if app_lower:
        candidates.add(app_lower)
        candidates.add(app_lower.replace(".lnk", "").replace(".exe", ""))

    # Add known aliases
    for key, aliases in KNOWN_PROCESS_ALIASES.items():
        if key in exe_lower or key in app_lower or (path and key in path.lower()):
            for a in aliases:
                candidates.add(a.lower())
                candidates.add(a.lower().replace(".exe", ""))

    return candidates


def get_matching_pids(app_name: str, executable_name: str, path: str = "") -> Set[int]:
    """Finds all currently running PIDs matching candidate process names"""
    candidate_names = get_process_candidate_names(app_name, executable_name, path)
    matching_pids: Set[int] = set()

    for proc in psutil.process_iter(["pid", "name", "exe"]):
        try:
            pname = (proc.info["name"] or "").lower()
            pexe = (proc.info["exe"] or "").lower()

            if pname in candidate_names or pname.replace(".exe", "") in candidate_names:
                matching_pids.add(proc.pid)
            elif pexe and any(c == os.path.basename(pexe) or c == os.path.basename(pexe).replace(".exe", "") for c in candidate_names):
                matching_pids.add(proc.pid)
        except (psutil.NoSuchProcess, psutil.AccessDenied, psutil.ZombieProcess):
            continue

    return matching_pids


def launch_and_verify_application(
    resolved_app: DiscoveredApp, timeout: float = 3.0
) -> Tuple[bool, str, Dict[str, Any]]:
    """
    Launches target application and performs bounded process verification.
    Distinguishes newly launched process from already-running application.
    """
    target_path = resolved_app.path
    app_name = resolved_app.name
    exe_name = resolved_app.executable_name

    # Step 1: Pre-snapshot matching PIDs before launching
    before_pids = get_matching_pids(app_name, exe_name, target_path)

    # Step 2: Attempt safe launch (NO shell=True, NO cmd.exe /c)
    try:
        if target_path.lower().endswith(".lnk") or target_path.lower().endswith(".url"):
            os.startfile(target_path)
        elif exe_name.lower() in ("calc.exe", "calculatorapp.exe"):
            # Universal Windows launch for calculator
            os.startfile(target_path)
        else:
            os.startfile(target_path)
    except Exception as launch_err:
        return (
            False,
            f"Failed to launch '{app_name}': {launch_err}",
            {"target": app_name, "error": str(launch_err), "errorCode": "LAUNCH_EXCEPTION"},
        )

    # Step 3: Bounded polling to verify process appearance
    poll_interval = 0.2
    elapsed = 0.0
    deadline = time.time() + timeout

    while time.time() < deadline:
        time.sleep(poll_interval)
        current_pids = get_matching_pids(app_name, exe_name, target_path)
        new_pids = current_pids - before_pids

        if new_pids:
            # Process appearance confirmed on Windows!
            return (
                True,
                f"Opened '{app_name}'.",
                {
                    "appName": app_name,
                    "targetPath": target_path,
                    "executable": exe_name,
                    "pids": list(new_pids),
                    "already_running": False,
                    "verified": True,
                },
            )

    # Step 4: After timeout, check if application was already running
    final_pids = get_matching_pids(app_name, exe_name, target_path)
    if final_pids:
        # App was already running and did not spawn a second process
        return (
            True,
            f"'{app_name}' is already running.",
            {
                "appName": app_name,
                "targetPath": target_path,
                "executable": exe_name,
                "pids": list(final_pids),
                "already_running": True,
                "verified": True,
            },
        )

    # Step 5: Process never appeared — return real failure without fake success!
    return (
        False,
        f"'{app_name}' could not be opened (application process did not appear).",
        {
            "appName": app_name,
            "targetPath": target_path,
            "executable": exe_name,
            "already_running": False,
            "verified": False,
            "errorCode": "PROCESS_NOT_DETECTED",
        },
    )


def close_and_verify_application(target_name: str, timeout: float = 2.5) -> Tuple[str, str, Dict[str, Any]]:
    """
    Terminates matching running processes and verifies that they have actually exited.
    """
    if not target_name or not target_name.strip():
        return "failed", "No application specified to close.", {}

    clean_target = target_name.strip().lower()

    # Safety check on protected processes
    if is_protected_process(clean_target):
        return (
            "unsupported",
            f"SECURITY REFUSAL // Process '{clean_target}' is a critical Windows system component and is protected by SOL safety policy.",
            {"protected": True, "target": clean_target, "errorCode": "PROTECTED_PROCESS"},
        )

    # Find running PIDs
    matching_pids = get_matching_pids(clean_target, f"{clean_target}.exe")
    if not matching_pids:
        return (
            "failed",
            f"No running instances of '{target_name}' were found on host system.",
            {"target": target_name, "found": False},
        )

    # Request graceful termination
    target_procs = []
    for pid in list(matching_pids):
        try:
            p = psutil.Process(pid)
            p.terminate()
            target_procs.append(p)
        except (psutil.NoSuchProcess, psutil.AccessDenied):
            pass

    # Bounded verification of termination
    deadline = time.time() + timeout
    while time.time() < deadline:
        time.sleep(0.2)
        alive = [p.pid for p in target_procs if psutil.pid_exists(p.pid)]
        if not alive:
            break

    # If any still alive after 1.5s, force kill
    remaining = [p for p in target_procs if psutil.pid_exists(p.pid)]
    for p in remaining:
        try:
            p.kill()
        except Exception:
            pass

    time.sleep(0.2)
    still_alive = [p.pid for p in target_procs if psutil.pid_exists(p.pid)]

    if still_alive:
        return (
            "failed",
            f"'{target_name}' could not be closed (PID {still_alive} remained active).",
            {"target": target_name, "stillAlive": still_alive, "errorCode": "CLOSE_FAILED"},
        )

    closed_count = len(matching_pids)
    return (
        "completed",
        f"Successfully closed {closed_count} instance(s) of '{target_name}'.",
        {"target": target_name, "closedCount": closed_count, "pids": list(matching_pids), "verified": True},
    )
