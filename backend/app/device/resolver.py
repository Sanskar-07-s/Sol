"""
Dynamic Application Resolver for Project SOL.
Resolves natural language requests against dynamically discovered application catalogs.
Handles exact matches, alias matching, category matching, and multiple-candidate ambiguity.
"""
import re
from typing import List, Optional
from app.device.models import DiscoveredApp, DeviceResolutionResult
from app.device.catalog import ApplicationCatalogManager

# Common category mapping for generic natural language terms
CATEGORY_MAP = {
    "browser": ["browser", "web browser"],
    "web browser": ["browser", "web browser"],
    "text editor": ["text editor", "editor"],
    "editor": ["text editor", "editor"],
    "terminal": ["terminal", "console", "command line"],
    "console": ["terminal", "console"],
    "file manager": ["file manager", "explorer", "files"],
    "explorer": ["file manager", "explorer", "files"],
    "media player": ["media player", "video player", "music player"],
    "music player": ["music player", "music"],
}


class ApplicationResolver:
    def __init__(self, catalog_manager: ApplicationCatalogManager):
        self.catalog_manager = catalog_manager

    def resolve(self, command_text: str) -> DeviceResolutionResult:
        # Strip common verb prefixes like open, launch, start, run
        clean_text = command_text.strip()
        clean_target = re.sub(
            r"^(open|launch|start|run|show|bring up|exec|execute|fire up)\s+",
            "",
            clean_text,
            flags=re.IGNORECASE,
        ).strip().lower()

        catalog = self.catalog_manager.get_catalog()
        apps = catalog.apps

        if not apps:
            return DeviceResolutionResult(
                resolved=False,
                message="No applications discovered on this device.",
            )

        # 1. Exact Match on Display Name, Executable, or Alias
        exact_matches: List[DiscoveredApp] = []
        for app in apps:
            name_lower = app.display_name.lower()
            exe_lower = app.executable.lower().replace(".exe", "").replace(".app", "")

            if clean_target == name_lower or clean_target == exe_lower:
                exact_matches.append(app)
            elif any(clean_target == alias for alias in app.aliases):
                exact_matches.append(app)

        if len(exact_matches) > 0:
            # Check if all exact matches are the same app (same display name)
            unique_display_names = {a.display_name.lower() for a in exact_matches}
            if len(unique_display_names) == 1:
                # Pick the highest score candidate (e.g. System32 or Start Menu shortcut over Registry duplicate)
                best_app = max(exact_matches, key=lambda a: a.score)
                return DeviceResolutionResult(
                    resolved=True,
                    app=best_app,
                    message=f"Resolved to {best_app.display_name}.",
                )
            else:
                # Multiple distinctly named apps match (e.g. "Notepad" vs "Notepad++")
                cand_names = list({a.display_name for a in exact_matches})
                names_str = ", ".join(cand_names)
                return DeviceResolutionResult(
                    resolved=False,
                    ambiguous=True,
                    multiple_matches=exact_matches,
                    message=f"I found multiple applications matching '{clean_target}': {names_str}. Which one should I open?",
                )

        # 2. Substring / High Confidence Alias Matches
        partial_matches: List[DiscoveredApp] = []
        for app in apps:
            name_lower = app.display_name.lower()
            if clean_target in name_lower or any(clean_target in alias for alias in app.aliases):
                if app not in partial_matches:
                    partial_matches.append(app)

        if len(partial_matches) > 0:
            unique_display_names = {a.display_name.lower() for a in partial_matches}
            if len(unique_display_names) == 1:
                best_app = max(partial_matches, key=lambda a: a.score)
                return DeviceResolutionResult(
                    resolved=True,
                    app=best_app,
                    message=f"Resolved to {best_app.display_name}.",
                )

            # Check if one partial match has exact target matching its primary display name
            strict = [a for a in partial_matches if a.display_name.lower() == clean_target]
            if len(strict) >= 1:
                best_app = max(strict, key=lambda a: a.score)
                return DeviceResolutionResult(
                    resolved=True,
                    app=best_app,
                    message=f"Resolved to {best_app.display_name}.",
                )

            cand_names = list({a.display_name for a in partial_matches})[:4]
            names_str = ", ".join(cand_names)
            return DeviceResolutionResult(
                resolved=False,
                ambiguous=True,
                multiple_matches=partial_matches[:5],
                message=f"I found multiple applications matching '{clean_target}': {names_str}. Which one should I open?",
            )

        # 3. Generic Category Resolution (e.g., "my browser", "browser")
        category_matches: List[DiscoveredApp] = []
        for generic_term, category_aliases in CATEGORY_MAP.items():
            if generic_term in clean_target or any(ca in clean_target for ca in category_aliases):
                for app in apps:
                    if any(ca in alias for alias in app.aliases for ca in category_aliases):
                        if app not in category_matches:
                            category_matches.append(app)

        if len(category_matches) > 0:
            unique_display_names = {a.display_name.lower() for a in category_matches}
            if len(unique_display_names) == 1:
                best_app = max(category_matches, key=lambda a: a.score)
                return DeviceResolutionResult(
                    resolved=True,
                    app=best_app,
                    message=f"Resolved generic browser request to {best_app.display_name}.",
                )
            else:
                cand_names = list({a.display_name for a in category_matches})[:4]
                names_str = ", ".join(cand_names)
                return DeviceResolutionResult(
                    resolved=False,
                    ambiguous=True,
                    multiple_matches=category_matches,
                    message=f"I found multiple matching applications: {names_str}. Which one should I open?",
                )

        return DeviceResolutionResult(
            resolved=False,
            message=f"Application '{clean_target}' is not installed or discoverable on this device.",
        )
