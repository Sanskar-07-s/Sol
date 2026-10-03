"""
Application Catalog Manager for Project SOL.
Handles background discovery scanning, caching, periodic refresh, and target validity verification.
"""
import os
import threading
import time
from typing import List, Optional
from app.device.models import AppCatalog, DiscoveredApp
from app.device.providers.base import BasePlatformProvider


class ApplicationCatalogManager:
    def __init__(self, provider: BasePlatformProvider, cache_ttl_seconds: float = 300.0):
        self.provider = provider
        self.cache_ttl_seconds = cache_ttl_seconds
        self._catalog = AppCatalog(total_count=0, last_scanned_at=0.0, is_scanning=False, apps=[])
        self._lock = threading.Lock()

    def get_catalog(self, force_refresh: bool = False) -> AppCatalog:
        now = time.time()
        should_refresh = (
            force_refresh
            or self._catalog.total_count == 0
            or (now - self._catalog.last_scanned_at > self.cache_ttl_seconds)
        )

        if should_refresh and not self._catalog.is_scanning:
            self.refresh_catalog()

        return self._catalog

    def refresh_catalog(self, async_scan: bool = False) -> AppCatalog:
        if async_scan:
            thread = threading.Thread(target=self._run_scan, daemon=True)
            thread.start()
            return self._catalog
        else:
            return self._run_scan()

    def _run_scan(self) -> AppCatalog:
        with self._lock:
            self._catalog.is_scanning = True
            try:
                apps = self.provider.discover_applications()
                now = time.time()
                self._catalog = AppCatalog(
                    total_count=len(apps),
                    last_scanned_at=now,
                    is_scanning=False,
                    apps=apps,
                )
            except Exception as e:
                self._catalog.is_scanning = False
            return self._catalog

    def search_apps(self, query: str) -> List[DiscoveredApp]:
        catalog = self.get_catalog()
        q = query.lower().strip()
        if not q:
            return catalog.apps

        matches = []
        for app in catalog.apps:
            if (
                q in app.name.lower()
                or q in app.display_name.lower()
                or q in app.executable.lower()
                or any(q in alias for alias in app.aliases)
            ):
                matches.append(app)
        return matches

    def invalidate_app(self, app_id: str):
        with self._lock:
            self._catalog.apps = [a for a in self._catalog.apps if a.app_id != app_id]
            self._catalog.total_count = len(self._catalog.apps)

    def is_target_valid(self, app: DiscoveredApp) -> bool:
        if not app.launch_target:
            return False
        # If launch_target is a file path, check existence
        if app.launch_target.lower().endswith((".exe", ".lnk", ".app", ".bat", ".cmd", ".sh")):
            return os.path.exists(app.launch_target)
        return True
