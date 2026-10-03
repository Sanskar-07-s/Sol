"""
SOL Natural Language Intent Parser & Wake-Word Stripper.
Extracts operational intent from spoken or typed user input.
"""
import re
from typing import Optional
from app.capabilities.models import ParsedIntent, IntentType


class IntentParser:
    """Natural Language Intent Parser for SOL Command Pipeline"""

    WAKE_PATTERNS = [
        r"^(hey|okay|ok|hi|hello|please|can you|could you)?\s*\bsol\b[\s,.:;\-]*",
        r"[\s,.:;\-]*\bsol\b\s*(please)?$",
    ]

    def strip_wake_words(self, raw_text: str) -> str:
        """Strips leading/trailing wake phrase ('Hey SOL', 'SOL', 'Okay SOL')"""
        clean = raw_text.strip()
        if not clean:
            return ""

        # Avoid stripping wake phrase if user says "solar", "solution", "console", "solenoid"
        # Only strip token-boundary "SOL"
        for pattern in self.WAKE_PATTERNS:
            clean = re.sub(pattern, "", clean, flags=re.IGNORECASE).strip()

        # Clean leading punctuation or conjunction fillers
        clean = re.sub(r"^[\s,.:;!?\-]+", "", clean).strip()
        clean = re.sub(r"^(please|can you|could you|i want you to)\s+", "", clean, flags=re.IGNORECASE).strip()
        return clean

    def parse(self, raw_text: str) -> ParsedIntent:
        """Parses raw user input text into structured ParsedIntent"""
        clean_text = self.strip_wake_words(raw_text)
        lower = clean_text.lower()

        if not lower:
            return ParsedIntent(
                intent_type="UNKNOWN",
                raw_text=raw_text,
                clean_text="",
                confidence=0.0
            )

        # 1. CONFIRMATION / CANCELLATION
        if lower in ("yes", "confirm", "do it", "proceed", "cancel", "no", "abort", "stop power"):
            return ParsedIntent(
                intent_type="CONFIRMATION",
                raw_text=raw_text,
                clean_text=clean_text,
                sub_action=lower,
                confidence=1.0,
            )

        # 2. SYSTEM INFO / TELEMETRY
        sys_keywords = [
            "system status", "runtime status", "cpu usage", "ram usage",
            "memory usage", "uptime", "how long has the computer been running",
            "what is my cpu", "how much ram", "status"
        ]
        for sys_kw in sys_keywords:
            if sys_kw in lower:
                return ParsedIntent(
                    intent_type="SYSTEM_INFO",
                    raw_text=raw_text,
                    clean_text=clean_text,
                    sub_action=sys_kw,
                    confidence=0.95,
                )

        # 3. POWER OPERATIONS
        power_patterns = [
            (r"\b(shut\s*down|shutdown|power\s*off)\b", "shutdown"),
            (r"\b(restart|reboot)\b", "restart"),
            (r"\b(sleep)\b", "sleep"),
            (r"\b(hibernate)\b", "hibernate"),
        ]
        for pat, sub_act in power_patterns:
            if re.search(pat, lower):
                return ParsedIntent(
                    intent_type="POWER_OP",
                    raw_text=raw_text,
                    clean_text=clean_text,
                    sub_action=sub_act,
                    confidence=0.95,
                )

        # 4. OPEN APPLICATION
        open_match = re.match(r"^(open|launch|start|run)\s+(.+)$", lower)
        if open_match:
            target = open_match.group(2).strip()
            return ParsedIntent(
                intent_type="OPEN_APP",
                raw_text=raw_text,
                clean_text=clean_text,
                target_name=target,
                sub_action="open",
                confidence=0.9,
            )

        # 5. CLOSE APPLICATION
        close_match = re.match(r"^(close|quit|exit|stop|kill)\s+(.+)$", lower)
        if close_match:
            target = close_match.group(2).strip()
            return ParsedIntent(
                intent_type="CLOSE_APP",
                raw_text=raw_text,
                clean_text=clean_text,
                target_name=target,
                sub_action="close",
                confidence=0.9,
            )

        # Fallback heuristic: single word or short phrase that might be an app name to open (e.g. "calculator", "chrome", "wiztree")
        if len(lower.split()) <= 3 and not any(kw in lower for kw in ["what", "how", "why", "tell", "where"]):
            return ParsedIntent(
                intent_type="OPEN_APP",
                raw_text=raw_text,
                clean_text=clean_text,
                target_name=lower,
                sub_action="open",
                confidence=0.6,
            )

        return ParsedIntent(
            intent_type="UNKNOWN",
            raw_text=raw_text,
            clean_text=clean_text,
            confidence=0.0,
        )


intent_parser = IntentParser()
