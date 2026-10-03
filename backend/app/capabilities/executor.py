"""
Central Capability Pipeline & Execution Router for Project SOL.
Orchestrates Intent Parsing, Application Resolution, Safety Enclave Validation, and Safe Process Execution.
"""
import os
import subprocess
import sys
import time
import psutil
from typing import Dict, Any, Tuple

from app.capabilities.models import CapabilityResult, ParsedIntent
from app.capabilities.parser import intent_parser
from app.capabilities.resolver import app_resolver
from app.capabilities.safety import validate_execution_safety, is_protected_process
from app.capabilities.windows_processes import process_controller
from app.capabilities.power import power_manager


class CapabilityPipeline:
    def execute_command(self, raw_text: str) -> CapabilityResult:
        """
        Main capability entrypoint for processing user commands.
        Returns structured CapabilityResult matching SOL protocol contract.
        """
        if not raw_text or not raw_text.strip():
            return CapabilityResult(
                status="failed",
                message="Empty command string submitted.",
            )

        # 1. Check if there is an active pending confirmation (e.g. for Power action)
        if power_manager.has_pending():
            conf_handled = power_manager.handle_confirmation(raw_text)
            if conf_handled:
                status, msg, data = conf_handled
                return CapabilityResult(
                    status=status,
                    message=msg,
                    data=data,
                    capability="power_confirmation",
                )

        # 2. Parse natural language intent & strip wake words
        intent: ParsedIntent = intent_parser.parse(raw_text)

        # If wake word only was spoken (e.g. "Hey SOL"), activate without error
        if not intent.clean_text:
            return CapabilityResult(
                status="completed",
                message="SOL wake word detected. Listening for command payload...",
                data={"wakeOnly": True},
                capability="wake_activation",
            )

        # 3. Dispatch based on Intent Type
        if intent.intent_type == "OPEN_APP":
            return self._execute_open_app(intent)

        elif intent.intent_type == "CLOSE_APP":
            return self._execute_close_app(intent)

        elif intent.intent_type == "SYSTEM_INFO":
            return self._execute_system_info(intent)

        elif intent.intent_type == "POWER_OP":
            return self._execute_power_op(intent)

        elif intent.intent_type == "CONFIRMATION":
            conf_handled = power_manager.handle_confirmation(intent.sub_action or intent.clean_text)
            if conf_handled:
                status, msg, data = conf_handled
                return CapabilityResult(
                    status=status,
                    message=msg,
                    data=data,
                    capability="power_confirmation",
                )
            return CapabilityResult(
                status="unsupported",
                message=f"No pending action awaiting confirmation for '{intent.clean_text}'.",
            )

        # Fallback unsupported capability
        return CapabilityResult(
            status="unsupported",
            message=f"No matching capability executor for '{intent.clean_text}'.",
            data={"rawCommand": raw_text},
            capability="unsupported",
        )

    def _execute_open_app(self, intent: ParsedIntent) -> CapabilityResult:
        target = intent.target_name or ""
        if not target:
            return CapabilityResult(
                status="failed",
                message="No application specified to open.",
                capability="open_application",
            )

        resolved_app = app_resolver.resolve(target)
        if not resolved_app:
            return CapabilityResult(
                status="failed",
                message=f"Application '{target}' could not be resolved on host system.",
                data={"target": target, "errorCode": "APPLICATION_NOT_FOUND"},
                capability="open_application",
            )

        target_path = resolved_app.path
        is_safe, safety_msg = validate_execution_safety(target_path)

        if not is_safe:
            return CapabilityResult(
                status="failed",
                message=f"Safety Refusal: {safety_msg}",
                data={"target": target, "path": target_path, "errorCode": "SAFETY_REFUSAL"},
                capability="open_application",
            )

        # SAFE WINDOWS PROCESS LAUNCHING (NO shell=True, NO cmd.exe /c!)
        try:
            if target_path.lower().endswith(".lnk") or target_path.lower().endswith(".url"):
                os.startfile(target_path)
            else:
                subprocess.Popen([target_path], shell=False)

            return CapabilityResult(
                status="completed",
                message=f"Opened '{resolved_app.name}'.",
                data={
                    "appName": resolved_app.name,
                    "targetPath": target_path,
                    "executable": resolved_app.executable_name,
                    "source": resolved_app.source,
                },
                capability="open_application",
            )
        except Exception as err:
            return CapabilityResult(
                status="failed",
                message=f"Failed to launch '{resolved_app.name}': {err}",
                data={"target": target, "error": str(err)},
                capability="open_application",
            )

    def _execute_close_app(self, intent: ParsedIntent) -> CapabilityResult:
        target = intent.target_name or ""
        status, message, data = process_controller.close_application(target)
        return CapabilityResult(
            status=status,
            message=message,
            data=data,
            capability="close_application",
        )

    def _execute_system_info(self, intent: ParsedIntent) -> CapabilityResult:
        cpu = psutil.cpu_percent(interval=0.1)
        mem = psutil.virtual_memory()
        boot = psutil.boot_time()
        uptime_sec = round(time.time() - boot)
        uptime_hrs = round(uptime_sec / 3600, 1)

        sub = (intent.sub_action or "").lower()
        if "cpu" in sub:
            msg = f"Host CPU Utilization: {cpu}% across {psutil.cpu_count(logical=True)} logical cores."
        elif "ram" in sub or "memory" in sub:
            msg = f"System RAM Usage: {round(mem.used / (1024**3), 1)} GB / {round(mem.total / (1024**3), 1)} GB ({mem.percent}%)."
        elif "uptime" in sub or "running" in sub:
            msg = f"Host Uptime: {uptime_hrs} hours ({uptime_sec} seconds)."
        else:
            msg = f"System Status: CPU {cpu}%, RAM {mem.percent}% ({round(mem.used / (1024**3), 1)}/{round(mem.total / (1024**3), 1)} GB), Host Uptime: {uptime_hrs} hours."

        return CapabilityResult(
            status="completed",
            message=msg,
            data={
                "cpuPct": cpu,
                "ramPct": mem.percent,
                "ramUsedGb": round(mem.used / (1024**3), 1),
                "ramTotalGb": round(mem.total / (1024**3), 1),
                "uptimeSeconds": uptime_sec,
            },
            capability="system_info",
        )

    def _execute_power_op(self, intent: ParsedIntent) -> CapabilityResult:
        sub = intent.sub_action or "shutdown"
        status, message, data = power_manager.request_power_operation(sub)
        return CapabilityResult(
            status=status,
            message=message,
            data=data,
            requires_confirmation=data.get("requires_confirmation", False),
            confirmation_id=data.get("confirmation_id"),
            capability="power_operation",
        )


capability_pipeline = CapabilityPipeline()
