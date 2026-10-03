"""
Device Capability Detector for Project SOL.
Detects real system information, OS, hardware specs, and available capabilities.
"""
import os
import platform
import socket
import psutil
from typing import List, Optional
from app.device.models import DeviceInfo, OSPlatform
from app.device.providers import get_platform_provider


class DeviceDetector:
    def __init__(self, platform_override: Optional[str] = None):
        self.provider = get_platform_provider(platform_override)

    def detect_device_info(self) -> DeviceInfo:
        hostname = socket.gethostname()
        plat = self.provider.get_platform_name()
        os_ver = self.provider.get_os_version()
        arch = platform.machine() or platform.architecture()[0]
        cpu_count = psutil.cpu_count(logical=True) or 1
        
        try:
            mem_total = round(psutil.virtual_memory().total / (1024 ** 3), 2)
        except Exception:
            mem_total = 8.0

        capabilities = self.provider.get_supported_capabilities()

        device_id = f"sol-device-{plat}-{hostname.lower()}"

        return DeviceInfo(
            device_id=device_id,
            hostname=hostname,
            platform=plat,
            os_version=os_ver,
            architecture=arch,
            cpu_count=cpu_count,
            memory_total_gb=mem_total,
            capabilities=capabilities,
        )
