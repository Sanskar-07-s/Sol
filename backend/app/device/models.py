"""
Universal Device Architecture Models for Project SOL.
Platform-agnostic data structures for device info, capabilities, and dynamic application metadata.
"""
import time
from typing import Any, Dict, List, Literal, Optional
from pydantic import BaseModel, Field

OSPlatform = Literal["windows", "macos", "linux", "android", "ios", "unknown"]

CapabilityType = Literal[
    "application_discovery",
    "application_launch",
    "application_close",
    "process_control",
    "filesystem",
    "system_telemetry",
    "power_management",
    "browser_control",
    "screen_capture",
    "notifications",
]


class DeviceInfo(BaseModel):
    device_id: str
    hostname: str
    platform: OSPlatform
    os_version: str
    architecture: str
    cpu_count: int
    memory_total_gb: float
    capabilities: List[CapabilityType]
    timestamp: float = Field(default_factory=time.time)


class DiscoveredApp(BaseModel):
    app_id: str
    name: str
    display_name: str
    executable: str
    launch_target: str
    platform: OSPlatform
    source: str
    publisher: Optional[str] = None
    version: Optional[str] = None
    categories: List[str] = Field(default_factory=list)
    aliases: List[str] = Field(default_factory=list)
    score: int = 0


class AppCatalog(BaseModel):
    total_count: int
    last_scanned_at: float
    is_scanning: bool = False
    apps: List[DiscoveredApp] = Field(default_factory=list)


class DeviceResolutionResult(BaseModel):
    resolved: bool
    app: Optional[DiscoveredApp] = None
    multiple_matches: List[DiscoveredApp] = Field(default_factory=list)
    ambiguous: bool = False
    message: str
