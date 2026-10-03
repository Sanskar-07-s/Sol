"""
Automated Batch 4 Capabilities Test Suite for SOL Windows Engine.
"""
import os
import sys
import unittest

# Ensure backend root is on sys.path
backend_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if backend_root not in sys.path:
    sys.path.insert(0, backend_root)

from app.capabilities.parser import intent_parser
from app.capabilities.safety import is_protected_process, is_uninstaller_or_helper
from app.capabilities.resolver import app_resolver
from app.capabilities.windows_processes import process_controller
from app.capabilities.executor import capability_pipeline


class TestBatch4Capabilities(unittest.TestCase):

    def test_wake_word_stripping(self):
        """Verify wake words are stripped correctly without altering excluded words"""
        self.assertEqual(intent_parser.strip_wake_words("Hey SOL"), "")
        self.assertEqual(intent_parser.strip_wake_words("Okay SOL"), "")
        self.assertEqual(intent_parser.strip_wake_words("SOL"), "")
        self.assertEqual(intent_parser.strip_wake_words("Hey SOL, open Chrome"), "open Chrome")
        self.assertEqual(intent_parser.strip_wake_words("SOL, system status"), "system status")

        # Excluded words MUST NOT be stripped
        self.assertEqual(intent_parser.strip_wake_words("solar energy"), "solar energy")
        self.assertEqual(intent_parser.strip_wake_words("solution architecture"), "solution architecture")
        self.assertEqual(intent_parser.strip_wake_words("console output"), "console output")

    def test_intent_parsing(self):
        """Verify intent parsing categorization"""
        p1 = intent_parser.parse("open Chrome")
        self.assertEqual(p1.intent_type, "OPEN_APP")
        self.assertEqual(p1.target_name, "chrome")

        p2 = intent_parser.parse("launch Visual Studio Code")
        self.assertEqual(p2.intent_type, "OPEN_APP")
        self.assertEqual(p2.target_name, "visual studio code")

        p3 = intent_parser.parse("close Calculator")
        self.assertEqual(p3.intent_type, "CLOSE_APP")
        self.assertEqual(p3.target_name, "calculator")

        p4 = intent_parser.parse("system status")
        self.assertEqual(p4.intent_type, "SYSTEM_INFO")

        p5 = intent_parser.parse("restart my computer")
        self.assertEqual(p5.intent_type, "POWER_OP")
        self.assertEqual(p5.sub_action, "restart")

    def test_critical_process_protection(self):
        """Verify critical system processes cannot be terminated"""
        self.assertTrue(is_protected_process("svchost.exe"))
        self.assertTrue(is_protected_process("lsass.exe"))
        self.assertTrue(is_protected_process("csrss"))
        self.assertTrue(is_protected_process("smss"))

        status, msg, data = process_controller.close_application("svchost")
        self.assertEqual(status, "unsupported")
        self.assertIn("SECURITY REFUSAL", msg)

        status2, msg2, data2 = process_controller.close_application("lsass")
        self.assertEqual(status2, "unsupported")
        self.assertIn("SECURITY REFUSAL", msg2)

    def test_uninstaller_filtering(self):
        """Verify uninstaller and helper executables are rejected"""
        self.assertTrue(is_uninstaller_or_helper("uninstall.exe"))
        self.assertTrue(is_uninstaller_or_helper("unins000.exe"))
        self.assertTrue(is_uninstaller_or_helper("updater.exe"))

        # Verify WizTree resolution does NOT select uninstall.exe
        resolved = app_resolver.resolve("WizTree")
        if resolved:
            self.assertFalse(is_uninstaller_or_helper(resolved.executable_name, resolved.path))
            self.assertNotIn("uninstall", resolved.executable_name.lower())

    def test_unknown_app_resolution(self):
        """Verify unknown application returns genuine failure without fake success"""
        res = capability_pipeline.execute_command("open non_existent_application_9999")
        self.assertEqual(res.status, "failed")
        self.assertEqual(res.data.get("errorCode"), "APPLICATION_NOT_FOUND")

    def test_power_confirmation_flow(self):
        """Verify power operations require explicit confirmation"""
        res1 = capability_pipeline.execute_command("restart my computer")
        self.assertEqual(res1.status, "warning")
        self.assertTrue(res1.requires_confirmation)

        res2 = capability_pipeline.execute_command("yes")
        self.assertEqual(res2.status, "completed")
        self.assertIn("POWER ACTION CONFIRMED", res2.message)


if __name__ == "__main__":
    unittest.main()
