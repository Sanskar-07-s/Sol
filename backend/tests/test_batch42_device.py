"""
Automated Test Suite for Batch 4.2: Universal Device + Dynamic Application Discovery.
"""
import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.device import device_bridge, DeviceBridge
from app.device.models import DeviceInfo, DiscoveredApp, AppCatalog, DeviceResolutionResult
from app.device.providers.windows import WindowsPlatformProvider
from app.device.providers.macos import MacOSPlatformProvider
from app.device.providers.linux import LinuxPlatformProvider
from app.device.providers.mobile import MobileDeviceProvider
from app.capabilities.executor import capability_pipeline

client = TestClient(app)


def test_device_info_detection():
    info = device_bridge.get_device_info()
    assert isinstance(info, DeviceInfo)
    assert info.hostname != ""
    assert info.platform in ("windows", "macos", "linux", "android", "ios", "unknown")
    assert info.cpu_count >= 1
    assert info.memory_total_gb > 0
    assert len(info.capabilities) > 0
    assert "application_discovery" in info.capabilities


def test_dynamic_application_discovery_count():
    catalog = device_bridge.get_application_catalog(force_refresh=True)
    assert isinstance(catalog, AppCatalog)
    assert catalog.total_count > 0
    # On Windows host, discovery should find numerous installed apps dynamically (typically > 50)
    assert len(catalog.apps) == catalog.total_count
    print(f"\n[Test] Dynamically discovered {catalog.total_count} apps from current host platform.")


def test_no_hardcoded_app_restriction():
    catalog = device_bridge.get_application_catalog()
    sources = set(app.source for app in catalog.apps)
    assert len(sources) >= 1
    # Check that discovered apps contain real metadata fields
    for app_item in catalog.apps[:5]:
        assert app_item.app_id != ""
        assert app_item.name != ""
        assert app_item.executable != ""


def test_application_resolver_exact_and_alias():
    # Test built-in system app resolution
    res_calc = device_bridge.resolve_application("open Calculator")
    assert res_calc.resolved is True
    assert res_calc.app is not None
    assert "calc" in res_calc.app.executable.lower() or "calculator" in res_calc.app.display_name.lower()

    res_note = device_bridge.resolve_application("launch Notepad")
    assert res_note.resolved is True
    assert res_note.app is not None
    assert "notepad" in res_note.app.executable.lower() or "notepad" in res_note.app.display_name.lower()


def test_application_resolver_unknown():
    res_unknown = device_bridge.resolve_application("open non_existent_application_xyz_99")
    assert res_unknown.resolved is False
    assert res_unknown.app is None
    assert "not installed" in res_unknown.message.lower() or "no applications" in res_unknown.message.lower()


def test_application_resolver_ambiguity():
    res_browser = device_bridge.resolve_application("open browser")
    if res_browser.ambiguous:
        assert len(res_browser.multiple_matches) > 1
        assert "multiple" in res_browser.message.lower()
    else:
        # If only 1 browser is installed on system, it resolves cleanly
        assert res_browser.resolved is True


def test_macos_provider_contract():
    mac_provider = MacOSPlatformProvider()
    assert mac_provider.get_platform_name() == "macos"
    assert "macos" in mac_provider.get_os_version().lower()
    assert "application_discovery" in mac_provider.get_supported_capabilities()
    assert mac_provider.is_safe_to_terminate("Finder") is False
    assert mac_provider.is_safe_to_terminate("CustomApp") is True


def test_linux_provider_contract():
    linux_provider = LinuxPlatformProvider()
    assert linux_provider.get_platform_name() == "linux"
    assert "linux" in linux_provider.get_os_version().lower()
    assert "application_discovery" in linux_provider.get_supported_capabilities()
    assert linux_provider.is_safe_to_terminate("systemd") is False
    assert linux_provider.is_safe_to_terminate("custom_tool") is True


def test_mobile_provider_capability_unavailable():
    mobile = MobileDeviceProvider(platform_name="android")
    assert mobile.get_platform_name() == "android"
    dummy_app = DiscoveredApp(
        app_id="android-app-test",
        name="TestApp",
        display_name="TestApp",
        executable="com.example.test",
        launch_target="com.example.test",
        platform="android",
        source="bridge",
    )
    success, msg, details = mobile.launch_application(dummy_app)
    assert success is False
    assert details.get("error_code") == "CAPABILITY_UNAVAILABLE"


def test_capability_pipeline_device_commands():
    res_caps = capability_pipeline.execute_command("What can you do on this device?")
    assert res_caps.status == "completed"
    assert "I can currently" in res_caps.message or "On this device" in res_caps.message

    res_apps = capability_pipeline.execute_command("What apps are installed?")
    assert res_apps.status == "completed"
    assert "Discovered" in res_apps.message or "Found" in res_apps.message


def test_rest_api_device_endpoints():
    res_info = client.get("/api/device/info")
    assert res_info.status_code == 200
    info_data = res_info.json()
    assert "hostname" in info_data
    assert "capabilities" in info_data

    res_caps = client.get("/api/device/capabilities")
    assert res_caps.status_code == 200
    caps_data = res_caps.json()
    assert "capabilities" in caps_data

    res_apps = client.get("/api/device/applications")
    assert res_apps.status_code == 200
    apps_data = res_apps.json()
    assert "total_count" in apps_data
    assert "apps" in apps_data
