"""
Platform Provider Factory for Project SOL Universal Device Architecture.
"""
import sys
from typing import Optional
from app.device.providers.base import BasePlatformProvider
from app.device.providers.windows import WindowsPlatformProvider
from app.device.providers.macos import MacOSPlatformProvider
from app.device.providers.linux import LinuxPlatformProvider
from app.device.providers.mobile import MobileDeviceProvider


def get_platform_provider(platform_name: Optional[str] = None) -> BasePlatformProvider:
    """
    Factory function returning the active platform provider.
    Automatically detects OS unless platform_name is overridden.
    """
    target = (platform_name or sys.platform).lower()

    if target.startswith("win"):
        return WindowsPlatformProvider()
    elif target.startswith("darwin") or target == "macos":
        return MacOSPlatformProvider()
    elif target.startswith("linux"):
        return LinuxPlatformProvider()
    elif target in ("android", "ios"):
        return MobileDeviceProvider(platform_name=target)
    else:
        # Default fallback to Windows if unknown or Windows host
        return WindowsPlatformProvider()
