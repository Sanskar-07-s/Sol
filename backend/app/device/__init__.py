"""
Project SOL Universal Device Module.
Exposes platform-independent device detection, application catalog management, dynamic resolution, and bridge.
"""
from app.device.models import DeviceInfo, DiscoveredApp, AppCatalog, DeviceResolutionResult, OSPlatform, CapabilityType
from app.device.bridge import device_bridge, DeviceBridge
from app.device.detector import DeviceDetector
from app.device.catalog import ApplicationCatalogManager
from app.device.resolver import ApplicationResolver

__all__ = [
    "DeviceInfo",
    "DiscoveredApp",
    "AppCatalog",
    "DeviceResolutionResult",
    "OSPlatform",
    "CapabilityType",
    "device_bridge",
    "DeviceBridge",
    "DeviceDetector",
    "ApplicationCatalogManager",
    "ApplicationResolver",
]
