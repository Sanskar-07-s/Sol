"""
Project SOL — Capabilities Package.
Real Windows computer control capabilities architecture.
"""
from app.capabilities.models import ParsedIntent, CapabilityResult, DiscoveredApp
from app.capabilities.executor import capability_pipeline

__all__ = ["ParsedIntent", "CapabilityResult", "DiscoveredApp", "capability_pipeline"]
