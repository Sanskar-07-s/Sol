"""
AI Reasoning & Ambiguity Resolver for Project SOL.
"""
from typing import Any, Dict, List, Optional, Tuple
from app.ai.schemas import CanonicalApp, PendingClarification
from app.ai.context import context_manager
from app.device import device_bridge


class ReasoningEngine:
    def resolve_application_intent(
        self, query: str, session_id: str = "default"
    ) -> Tuple[bool, Optional[CanonicalApp], Optional[PendingClarification], str]:
        """
        Resolves requested application using canonical application grouping and conversational context.
        Returns (resolved, canonical_app, pending_clarification, message).
        """
        context = context_manager.get_or_create_context(session_id)

        # 1. Check conversational reference resolution ("any one", "first one", "second one", "the other one", "it")
        ref_name, ref_app = context_manager.resolve_conversational_reference(query, context)
        if ref_app:
            context_manager.update_context_after_resolution(context, app=ref_app)
            return True, ref_app, None, f"Resolved conversational reference to '{ref_app.canonical_name}'."

        # 2. Query device catalog and canonicalize applications
        raw_catalog = device_bridge.get_application_catalog()
        canonical_apps = context_manager.canonicalize_applications(raw_catalog.apps)

        q_clean = query.strip().lower()
        q_target = re.sub(r"^(open|launch|start|run|show|bring up)\s+", "", q_clean, flags=re.IGNORECASE).strip()

        # Exact match on canonical name, executable, or alias
        exact_matches: List[CanonicalApp] = []
        for app in canonical_apps:
            c_name = app.canonical_name.lower()
            c_exe = app.executable.lower().replace(".exe", "")
            if q_target == c_name or q_target == c_exe or any(q_target == a.lower() for a in app.aliases):
                exact_matches.append(app)

        if len(exact_matches) == 1:
            best_app = exact_matches[0]
            context_manager.update_context_after_resolution(context, app=best_app)
            return True, best_app, None, f"Resolved to {best_app.canonical_name}."
        elif len(exact_matches) > 1:
            # Genuine ambiguity between different canonical apps
            pending = PendingClarification(
                question=f"I found multiple applications matching '{q_target}'. Which one would you like to open?",
                query_target=q_target,
                candidates=exact_matches,
            )
            context_manager.update_context_after_resolution(context, pending=pending)
            cand_names = [a.canonical_name for a in exact_matches]
            msg = f"I found multiple applications matching '{q_target}': {', '.join(cand_names)}. Which one should I open?"
            return False, None, pending, msg

        # Substring / category matching
        partial_matches: List[CanonicalApp] = []
        for app in canonical_apps:
            c_name = app.canonical_name.lower()
            if q_target in c_name or any(q_target in a.lower() for a in app.aliases):
                if app not in partial_matches:
                    partial_matches.append(app)

        if len(partial_matches) == 1:
            best_app = partial_matches[0]
            context_manager.update_context_after_resolution(context, app=best_app)
            return True, best_app, None, f"Resolved to {best_app.canonical_name}."
        elif len(partial_matches) > 1:
            pending = PendingClarification(
                question=f"I found multiple applications matching '{q_target}'. Which one would you like to open?",
                query_target=q_target,
                candidates=partial_matches[:4],
            )
            context_manager.update_context_after_resolution(context, pending=pending)
            cand_names = [a.canonical_name for a in partial_matches[:4]]
            msg = f"I found multiple applications matching '{q_target}': {', '.join(cand_names)}. Which one should I open?"
            return False, None, pending, msg

        return False, None, None, f"Application '{q_target}' is not installed or discoverable on this device."


import re
reasoning_engine = ReasoningEngine()
