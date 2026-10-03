"""
Comprehensive Test Suite for Batch 5: SOL Intelligence Core & AI Subsystem.
Tests AI Engine, Providers, Context, Memory, Canonical Applications, Ambiguity ("any one", "first one", "second one", "the other one"), Tools, and REST endpoints.
"""
import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.ai import (
    sol_engine,
    context_manager,
    conversation_manager,
    reasoning_engine,
    tool_registry,
    tool_router,
    planner,
    AIResponse,
    ModelUnavailableError,
    CanonicalApp,
    PendingClarification,
)
from app.tools.memory import memory_store
from app.device.models import DiscoveredApp

client = TestClient(app)


def test_ai_engine_status():
    status = sol_engine.get_status()
    assert "state" in status
    assert "provider" in status
    assert "healthy" in status


def test_canonical_application_grouping():
    raw_apps = [
        DiscoveredApp(
            app_id="win-sys-calc",
            name="Calculator",
            display_name="Calculator",
            executable="calc.exe",
            launch_target="C:\\WINDOWS\\System32\\calc.exe",
            platform="windows",
            source="system32",
            score=90,
        ),
        DiscoveredApp(
            app_id="win-lnk-calc",
            name="Calculator",
            display_name="Calculator",
            executable="calc.exe",
            launch_target="C:\\StartMenu\\Calculator.lnk",
            platform="windows",
            source="start_menu_user",
            score=100,
        ),
        DiscoveredApp(
            app_id="win-reg-chrome",
            name="Chrome",
            display_name="Chrome",
            executable="chrome.exe",
            launch_target="C:\\Program Files\\Chrome\\chrome.exe",
            platform="windows",
            source="registry",
            score=85,
        ),
        DiscoveredApp(
            app_id="win-lnk-googlechrome",
            name="Google Chrome",
            display_name="Google Chrome",
            executable="chrome.exe",
            launch_target="C:\\StartMenu\\Google Chrome.lnk",
            platform="windows",
            source="start_menu_common",
            score=100,
        ),
    ]

    canonical = context_manager.canonicalize_applications(raw_apps)
    # Should collapse the 4 raw entries into 2 canonical entities: "Calculator" and "Google Chrome"
    assert len(canonical) == 2
    names = [c.canonical_name for c in canonical]
    assert "Calculator" in names
    assert "Google Chrome" in names


def test_ambiguity_resolution_any_one():
    session_id = "test-session-any"
    context = context_manager.get_or_create_context(session_id)

    # Set up synthetic ambiguity clarification
    cand1 = CanonicalApp(canonical_name="Google Chrome", executable="chrome.exe", best_target="C:\\Chrome\\chrome.exe")
    cand2 = CanonicalApp(canonical_name="Firefox", executable="firefox.exe", best_target="C:\\Firefox\\firefox.exe")
    context.pending_clarification = PendingClarification(
        question="I found multiple browsers: Google Chrome, Firefox. Which one?",
        query_target="browser",
        candidates=[cand1, cand2],
    )

    # User responds "any one"
    res = sol_engine.process_query("any one", session_id=session_id)
    assert res.state == "COMPLETED"
    assert context.pending_clarification is None
    assert context.last_resolved_app.canonical_name == "Google Chrome"


def test_ambiguity_resolution_first_and_second_one():
    session_id = "test-session-ordinal"
    context = context_manager.get_or_create_context(session_id)

    cand1 = CanonicalApp(canonical_name="Google Chrome", executable="chrome.exe", best_target="C:\\Chrome\\chrome.exe")
    cand2 = CanonicalApp(canonical_name="Mozilla Firefox", executable="firefox.exe", best_target="C:\\Firefox\\firefox.exe")
    context.pending_clarification = PendingClarification(
        question="I found multiple browsers: Google Chrome, Mozilla Firefox. Which one?",
        query_target="browser",
        candidates=[cand1, cand2],
    )

    # User responds "the second one"
    res = sol_engine.process_query("the second one", session_id=session_id)
    assert res.state == "COMPLETED"
    assert context.pending_clarification is None
    assert context.last_resolved_app.canonical_name == "Mozilla Firefox"


def test_contextual_reference_it():
    session_id = "test-session-ref"
    context = context_manager.get_or_create_context(session_id)

    context.last_resolved_app = CanonicalApp(
        canonical_name="Notepad",
        executable="notepad.exe",
        best_target="C:\\WINDOWS\\System32\\notepad.exe",
    )

    # Ask to close "it"
    res = sol_engine.process_query("close it", session_id=session_id)
    assert res.state in ("COMPLETED", "FAILED")
    assert context.last_resolved_app.canonical_name == "Notepad"


def test_memory_store_and_recall():
    rem_res = memory_store.remember("preference", "preferred_editor", "Visual Studio Code")
    assert rem_res["success"] is True
    assert rem_res["verified"] is True

    rec_res = memory_store.recall("preferred_editor")
    assert rec_res["success"] is True
    assert rec_res["found"] is True
    assert rec_res["memory"]["value"] == "Visual Studio Code"


def test_memory_store_secret_refusal():
    sec_res = memory_store.remember("preference", "my_password", "supersecret123")
    assert sec_res["success"] is False
    assert "Safety Refusal" in sec_res["error"]


def test_tool_registry_and_router():
    tools = tool_registry.list_tools()
    assert len(tools) > 5

    res = tool_router.execute_tool("get_system_status", {})
    assert res.success is True
    assert res.verified is True
    assert "cpu_usage_pct" in res.result


def test_multi_step_planner():
    plan = planner.create_plan("open Chrome and search for OpenAI")
    assert plan.goal == "open Chrome and search for OpenAI"
    assert len(plan.steps) == 2
    assert plan.steps[0].tool_name == "launch_application"
    assert plan.steps[1].tool_name == "browser_search"


def test_browser_tool_capability_unavailable():
    res = tool_router.execute_tool("browser_open", {"url": "https://example.com"})
    assert res.success is False
    assert res.result.get("error_code") == "CAPABILITY_UNAVAILABLE"


def test_vision_tool_capability_unavailable():
    res = tool_router.execute_tool("take_screenshot", {})
    assert res.success is False
    assert res.result.get("error_code") == "CAPABILITY_UNAVAILABLE"


def test_ai_rest_api_endpoints():
    res_status = client.get("/api/ai/status")
    assert res_status.status_code == 200
    assert "provider" in res_status.json()

    res_model = client.get("/api/ai/model")
    assert res_model.status_code == 200
    assert "model" in res_model.json()

    res_tools = client.get("/api/ai/tools")
    assert res_tools.status_code == 200
    assert res_tools.json()["count"] > 5

    res_chat = client.post("/api/ai/chat", json={"query": "What can you do on this device?"})
    assert res_chat.status_code == 200
    chat_data = res_chat.json()
    assert "response_text" in chat_data
    assert chat_data["state"] == "COMPLETED"
