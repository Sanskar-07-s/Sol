"""
Conversational Context & Application Canonicalization Manager for Project SOL.
Handles entity canonicalization, reference resolution ("it", "any one", "first one"), and session tracking.
"""
import re
import time
from typing import Dict, List, Optional, Tuple
from app.ai.schemas import CanonicalApp, ConversationalContext, PendingClarification
from app.device.models import DiscoveredApp


class ContextManager:
    def __init__(self):
        self._contexts: Dict[str, ConversationalContext] = {}

    def get_or_create_context(self, session_id: str = "default") -> ConversationalContext:
        if session_id not in self._contexts:
            self._contexts[session_id] = ConversationalContext(session_id=session_id)
        return self._contexts[session_id]

    def canonicalize_applications(self, raw_apps: List[DiscoveredApp]) -> List[CanonicalApp]:
        """
        Groups discovered application entries representing the same underlying application into canonical entities.
        Groups entries sharing the same executable (e.g., chrome.exe, calc.exe) or display name.
        """
        grouped: Dict[str, List[DiscoveredApp]] = {}

        for app in raw_apps:
            # Group key: normalized executable name if valid, else clean display name
            exe_key = app.executable.lower().replace(".exe", "").strip() if app.executable else ""
            clean_name = re.sub(
                r"\b(v?\d+(\.\d+)*|\(64-bit\)|\(32-bit\)|64-bit|32-bit|\.lnk|\.exe)\b",
                "",
                app.display_name,
                flags=re.IGNORECASE,
            ).strip().lower()

            group_key = exe_key if exe_key and exe_key not in ("app", "shortcut") else clean_name

            grouped.setdefault(group_key, []).append(app)

        canonical_list: List[CanonicalApp] = []
        for group_key, app_group in grouped.items():
            # Pick display name with highest score and longest descriptive name (e.g. Google Chrome > Chrome)
            best_app = max(app_group, key=lambda a: (a.score, len(a.display_name)))
            canonical_name = best_app.display_name
            all_aliases = set()
            all_targets = []
            all_sources = []

            for app in app_group:
                all_aliases.update(app.aliases)
                all_aliases.add(app.display_name.lower())
                all_aliases.add(app.executable.lower().replace(".exe", ""))
                if app.launch_target:
                    all_targets.append(app.launch_target)
                if app.source:
                    all_sources.append(app.source)

            canonical_list.append(
                CanonicalApp(
                    canonical_name=canonical_name,
                    aliases=list(all_aliases),
                    executable=best_app.executable,
                    launch_targets=all_targets,
                    best_target=best_app.launch_target,
                    sources=all_sources,
                    score=best_app.score,
                )
            )

        return canonical_list

    def resolve_conversational_reference(
        self, query: str, context: ConversationalContext
    ) -> Tuple[Optional[str], Optional[CanonicalApp]]:
        """
        Resolves conversational references ("any one", "first one", "second one", "the other one", "it")
        against pending clarifications or recent session state BEFORE normal application resolution.
        """
        q_clean = query.strip().lower()

        # 1. Resolve pending clarification answers ("any one", "first one", "second one", "no, the other one")
        if context.pending_clarification and context.pending_clarification.candidates:
            cands = context.pending_clarification.candidates
            if q_clean in ("any one", "any", "either one", "either", "whichever", "doesnt matter", "don't care"):
                selected = cands[0]
                context.pending_clarification = None
                return selected.canonical_name, selected

            elif q_clean in ("first one", "the first one", "1st", "number one", "first"):
                selected = cands[0]
                context.pending_clarification = None
                return selected.canonical_name, selected

            elif q_clean in ("second one", "the second one", "2nd", "number two", "second") and len(cands) > 1:
                selected = cands[1]
                context.pending_clarification = None
                return selected.canonical_name, selected

            elif q_clean in ("the other one", "other one", "no the other one", "alternate") and len(cands) > 1:
                selected = cands[1] if context.last_resolved_app != cands[1] else cands[0]
                context.pending_clarification = None
                return selected.canonical_name, selected

        # 2. Resolve pronouns ("it", "that", "the app you mentioned", "the browser")
        if q_clean in ("it", "that", "that app", "the app", "the previous app", "the app you mentioned") or q_clean.startswith("close it"):
            if context.last_resolved_app:
                return context.last_resolved_app.canonical_name, context.last_resolved_app

        return None, None

    def update_context_after_resolution(
        self, context: ConversationalContext, app: Optional[CanonicalApp] = None, pending: Optional[PendingClarification] = None
    ):
        if app:
            context.last_resolved_app = app
            context.pending_clarification = None
        if pending:
            context.pending_clarification = pending
        context.updated_at = time.time()


context_manager = ContextManager()
