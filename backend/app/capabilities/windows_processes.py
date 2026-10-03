"""
Windows Process Controller & Safety Policy Enforcer.
Closes running user applications safely while blocking attempts on critical system infrastructure.
"""
import os
import time
import psutil
from typing import Dict, Any, List, Tuple
from app.capabilities.safety import is_protected_process
from app.capabilities.resolver import app_resolver


class ProcessController:
    def close_application(self, target_name: str) -> Tuple[str, str, Dict[str, Any]]:
        """
        Safely terminates running processes matching target_name.
        Enforces critical process protection policy.
        """
        if not target_name or not target_name.strip():
            return "failed", "No application name specified to close.", {}

        clean_target = target_name.strip().lower()

        # 1. CRITICAL PROCESS PROTECTION CHECK
        if is_protected_process(clean_target):
            return (
                "unsupported",
                f"SECURITY REFUSAL // Process '{clean_target}' is a critical Windows system component and is protected by SOL safety policy.",
                {"protected": True, "target": clean_target, "errorCode": "PROTECTED_PROCESS"},
            )

        # 2. Resolve target app candidate
        resolved_app = app_resolver.resolve(clean_target)
        target_exe_name = resolved_app.executable_name.lower() if resolved_app else f"{clean_target}.exe"
        target_stem = clean_target.replace(".exe", "").lower()

        matched_processes: List[psutil.Process] = []

        # 3. Iterate running processes
        for proc in psutil.process_iter(["pid", "name", "exe"]):
            try:
                pname = (proc.info["name"] or "").lower()
                pexe = (proc.info["exe"] or "").lower()

                # Safety re-check on actual process name
                if is_protected_process(pname) or (pexe and is_protected_process(os.path.basename(pexe))):
                    continue

                # Match against executable name or target stem
                if (
                    pname == target_exe_name
                    or pname.replace(".exe", "") == target_stem
                    or (target_stem in pname.replace(".exe", "") and len(target_stem) >= 3)
                ):
                    matched_processes.append(proc)
            except (psutil.NoSuchProcess, psutil.AccessDenied, psutil.ZombieProcess):
                continue

        if not matched_processes:
            display_name = resolved_app.name if resolved_app else target_name
            return (
                "failed",
                f"No running instances of '{display_name}' were found on host system.",
                {"target": target_name, "found": False},
            )

        # 4. Graceful termination
        closed_count = 0
        pids = []
        for proc in matched_processes:
            try:
                pids.append(proc.pid)
                proc.terminate()
                closed_count += 1
            except Exception:
                try:
                    proc.kill()
                    closed_count += 1
                except Exception:
                    pass

        # Allow processes a brief moment to exit
        time.sleep(0.3)

        display_name = resolved_app.name if resolved_app else target_name
        return (
            "completed",
            f"Successfully closed {closed_count} instance(s) of '{display_name}'.",
            {"target": display_name, "closedCount": closed_count, "pids": pids},
        )


process_controller = ProcessController()
