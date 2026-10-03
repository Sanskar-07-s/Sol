"""
SOL System Power Operations Engine.
Manages shutdown, restart, sleep, and hibernate capabilities.
Enforces explicit confirmation rules for all destructive power operations.
Includes safe confirmation test mode for development environments.
"""
import os
import sys
import time
from typing import Dict, Any, Optional, Tuple

# Enable safe mode by default during development/testing to prevent accidental OS shutdown
SAFE_CONFIRMATION_TEST_MODE = True


class PowerManager:
    def __init__(self):
        self._pending_action: Optional[Dict[str, Any]] = None

    def request_power_operation(self, action: str) -> Tuple[str, str, Dict[str, Any]]:
        """
        Initiates a power operation request.
        Always returns status="warning" requiring explicit user confirmation.
        """
        norm_action = action.strip().lower()
        if norm_action in ("shutdown", "shut down", "power off"):
            action_type = "shutdown"
            description = "Shutting down the computer will close all active applications and turn off host power."
        elif norm_action in ("restart", "reboot"):
            action_type = "restart"
            description = "Restarting the computer will close your current session and reboot the system."
        elif norm_action == "sleep":
            action_type = "sleep"
            description = "Putting the computer to sleep will enter low-power state."
        elif norm_action == "hibernate":
            action_type = "hibernate"
            description = "Hibernating will save session state to disk and enter deep sleep."
        else:
            return "failed", f"Unknown power operation '{action}'.", {}

        # Store pending action
        self._pending_action = {
            "action": action_type,
            "timestamp": time.time(),
            "confirmation_id": f"power-{action_type}-{int(time.time())}",
        }

        msg = f"POWER CONFIRMATION REQUIRED // {description} Respond with 'confirm' or 'yes' to proceed, or 'cancel' to abort."

        return (
            "warning",
            msg,
            {
                "requires_confirmation": True,
                "confirmation_id": self._pending_action["confirmation_id"],
                "action": action_type,
                "capability": "power_operation",
            },
        )

    def handle_confirmation(self, user_response: str) -> Optional[Tuple[str, str, Dict[str, Any]]]:
        """
        Processes user confirmation or cancellation for pending power requests.
        Returns Tuple if a pending confirmation was handled, or None if no pending action.
        """
        if not self._pending_action:
            return None

        # Expire confirmation after 60 seconds
        if time.time() - self._pending_action["timestamp"] > 60:
            self._pending_action = None
            return None

        clean = user_response.strip().lower()
        action_type = self._pending_action["action"]

        if clean in ("yes", "confirm", "do it", "proceed", action_type):
            self._pending_action = None

            if SAFE_CONFIRMATION_TEST_MODE:
                return (
                    "completed",
                    f"POWER ACTION CONFIRMED // Simulated '{action_type}' passed safety verification. (Host system power action skipped in dev test mode).",
                    {"action": action_type, "simulated": True, "executed": True},
                )
            else:
                # Real System Execution
                if action_type == "shutdown":
                    os.system("shutdown /s /t 10")
                elif action_type == "restart":
                    os.system("shutdown /r /t 10")
                elif action_type == "sleep":
                    os.system("rundll32.exe powrprof.dll,SetSuspendState 0,1,0")
                elif action_type == "hibernate":
                    os.system("shutdown /h")

                return (
                    "completed",
                    f"Executing system {action_type}...",
                    {"action": action_type, "simulated": False, "executed": True},
                )

        elif clean in ("no", "cancel", "abort", "stop", "dont", "don't"):
            self._pending_action = None
            return (
                "completed",
                f"POWER ACTION CANCELED // System {action_type} request aborted.",
                {"action": action_type, "canceled": True},
            )

        return None

    def has_pending(self) -> bool:
        return self._pending_action is not None and (time.time() - self._pending_action["timestamp"] <= 60)


power_manager = PowerManager()
