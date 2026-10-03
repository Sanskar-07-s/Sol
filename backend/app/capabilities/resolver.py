"""
Application Resolution Engine for Project SOL.
Matches requested application names against dynamically discovered system applications.
Strictly filters out uninstallers, updaters, and helper executables.
"""
import os
import re
from typing import Optional, Tuple
from app.capabilities.models import DiscoveredApp
from app.capabilities.windows_apps import app_scanner
from app.capabilities.safety import is_uninstaller_or_helper


class AppResolver:
    def resolve(self, target_name: str) -> Optional[DiscoveredApp]:
        """
        Resolves requested target_name to the best matching safe DiscoveredApp candidate.
        Returns None if no suitable application candidate is found.
        """
        if not target_name or not target_name.strip():
            return None

        query = target_name.strip().lower()
        # Clean filler words
        query = re.sub(r"^(open|launch|start|run|close|quit|exit|stop)\s+", "", query, flags=re.IGNORECASE).strip()
        query_no_punct = re.sub(r"[^\w\s]", "", query).strip()

        all_apps = app_scanner.scan_all()

        best_app: Optional[DiscoveredApp] = None
        best_score = 0

        for key, app in all_apps.items():
            # SAFETY FILTER: Reject any candidate that points to an uninstaller or updater
            if is_uninstaller_or_helper(app.executable_name, app.path):
                continue

            score = 0
            app_name_lower = app.name.lower()
            exe_lower = app.executable_name.lower().replace(".exe", "")

            # 1. Exact alias match
            if query in app.normalized_names or query_no_punct in app.normalized_names:
                score += 100
            elif query == app_name_lower or query_no_punct == app_name_lower:
                score += 95
            elif query == exe_lower:
                score += 90

            # 2. Substring or word match
            else:
                for alias in app.normalized_names:
                    if query in alias or alias in query:
                        score += 65
                        break
                if score == 0 and (query in app_name_lower or app_name_lower in query):
                    score += 55
                if score == 0 and (query in exe_lower or exe_lower in query):
                    score += 50

            if score == 0:
                continue

            # 3. Source preference bonus
            if app.source in ("start_menu_user", "start_menu_common"):
                score += 30
            elif app.source == "system32":
                score += 25
            elif app.source == "registry":
                score += 20

            # 4. Anti-installer / helper penalty check on path
            path_lower = app.path.lower()
            if "uninstall" in path_lower or "unins000" in path_lower or "updater" in path_lower:
                score -= 1000

            if score > best_score:
                best_score = score
                best_app = app
                best_app.score = score

        # Only accept candidates with score >= 50
        if best_app and best_score >= 50:
            return best_app

        return None


app_resolver = AppResolver()
