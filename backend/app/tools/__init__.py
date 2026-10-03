"""
Central Tool Registry for Project SOL AI Subsystem.
Registers all verified tools available to SOL Intelligence Core.
"""
from typing import Any, Callable, Dict, List, Optional
from app.tools.applications import (
    launch_application_tool,
    close_application_tool,
    list_applications_tool,
    search_applications_tool,
)
from app.tools.system import (
    get_system_status_tool,
    get_device_info_tool,
    get_device_capabilities_tool,
    execute_power_operation_tool,
)
from app.tools.files import (
    search_files_tool,
    read_file_tool,
    write_file_tool,
    move_file_tool,
    delete_file_tool,
)
from app.tools.browser import (
    browser_open_tool,
    browser_navigate_tool,
    browser_search_tool,
    browser_get_page_tool,
    browser_close_tool,
)
from app.tools.memory import (
    remember_tool,
    recall_memory_tool,
    search_memory_tool,
    forget_memory_tool,
)
from app.tools.vision import take_screenshot_tool, analyze_screen_tool
from app.tools.tasks import create_task_tool, list_tasks_tool


class SOLTool:
    def __init__(
        self,
        name: str,
        description: str,
        func: Callable[..., Dict[str, Any]],
        input_schema: Dict[str, Any],
        safety_level: str = "safe",
        requires_confirmation: bool = False,
    ):
        self.name = name
        self.description = description
        self.func = func
        self.input_schema = input_schema
        self.safety_level = safety_level
        self.requires_confirmation = requires_confirmation

    def to_ollama_tool(self) -> Dict[str, Any]:
        return {
            "type": "function",
            "function": {
                "name": self.name,
                "description": self.description,
                "parameters": self.input_schema,
            },
        }


class ToolRegistry:
    def __init__(self):
        self._tools: Dict[str, SOLTool] = {}
        self._register_default_tools()

    def register_tool(self, tool: SOLTool):
        self._tools[tool.name] = tool

    def get_tool(self, name: str) -> Optional[SOLTool]:
        return self._tools.get(name)

    def list_tools(self) -> List[SOLTool]:
        return list(self._tools.values())

    def get_ollama_tools_schema(self) -> List[Dict[str, Any]]:
        return [tool.to_ollama_tool() for tool in self._tools.values()]

    def _register_default_tools(self):
        # Applications
        self.register_tool(
            SOLTool(
                name="launch_application",
                description="Launch a host application dynamically resolved from the application catalog.",
                func=launch_application_tool,
                input_schema={
                    "type": "object",
                    "properties": {"app_name": {"type": "string", "description": "Target application name or alias"}},
                    "required": ["app_name"],
                },
            )
        )
        self.register_tool(
            SOLTool(
                name="close_application",
                description="Close a user application safely via platform provider.",
                func=close_application_tool,
                input_schema={
                    "type": "object",
                    "properties": {"app_name": {"type": "string", "description": "Target application name or executable"}},
                    "required": ["app_name"],
                },
            )
        )
        self.register_tool(
            SOLTool(
                name="list_applications",
                description="List or search dynamically discovered applications on the current host machine.",
                func=list_applications_tool,
                input_schema={
                    "type": "object",
                    "properties": {"query": {"type": "string", "description": "Optional search term"}},
                },
            )
        )

        # System & Telemetry
        self.register_tool(
            SOLTool(
                name="get_system_status",
                description="Retrieve host CPU utilization, RAM usage, and uptime telemetry.",
                func=get_system_status_tool,
                input_schema={"type": "object", "properties": {}},
            )
        )
        self.register_tool(
            SOLTool(
                name="get_device_info",
                description="Retrieve full hardware and OS platform specifications.",
                func=get_device_info_tool,
                input_schema={"type": "object", "properties": {}},
            )
        )
        self.register_tool(
            SOLTool(
                name="get_device_capabilities",
                description="Retrieve list of capabilities exposed on the current host device.",
                func=get_device_capabilities_tool,
                input_schema={"type": "object", "properties": {}},
            )
        )
        self.register_tool(
            SOLTool(
                name="execute_power_operation",
                description="Execute power operations (shutdown, restart, sleep) with explicit safety confirmation.",
                func=execute_power_operation_tool,
                safety_level="requires_confirmation",
                requires_confirmation=True,
                input_schema={
                    "type": "object",
                    "properties": {
                        "action": {"type": "string", "enum": ["shutdown", "restart", "sleep", "hibernate"]},
                        "safe_mode": {"type": "boolean", "default": True},
                    },
                    "required": ["action"],
                },
            )
        )

        # Filesystem
        self.register_tool(
            SOLTool(
                name="search_files",
                description="Search files in a directory using glob pattern.",
                func=search_files_tool,
                input_schema={
                    "type": "object",
                    "properties": {
                        "directory": {"type": "string"},
                        "pattern": {"type": "string", "default": "*"},
                    },
                    "required": ["directory"],
                },
            )
        )
        self.register_tool(
            SOLTool(
                name="read_file",
                description="Read textual content from a local file safely.",
                func=read_file_tool,
                input_schema={
                    "type": "object",
                    "properties": {"file_path": {"type": "string"}},
                    "required": ["file_path"],
                },
            )
        )
        self.register_tool(
            SOLTool(
                name="write_file",
                description="Write text content to a local file.",
                func=write_file_tool,
                input_schema={
                    "type": "object",
                    "properties": {
                        "file_path": {"type": "string"},
                        "content": {"type": "string"},
                    },
                    "required": ["file_path", "content"],
                },
            )
        )

        # Memory
        self.register_tool(
            SOLTool(
                name="remember",
                description="Store a structured user preference or fact in long-term memory.",
                func=remember_tool,
                input_schema={
                    "type": "object",
                    "properties": {
                        "memory_type": {"type": "string", "enum": ["preference", "fact", "device", "app", "workflow"]},
                        "key": {"type": "string"},
                        "value": {"type": "string"},
                    },
                    "required": ["memory_type", "key", "value"],
                },
            )
        )
        self.register_tool(
            SOLTool(
                name="recall_memory",
                description="Recall a stored memory record by key.",
                func=recall_memory_tool,
                input_schema={
                    "type": "object",
                    "properties": {"key": {"type": "string"}},
                    "required": ["key"],
                },
            )
        )

        # Browser
        self.register_tool(
            SOLTool(
                name="browser_open",
                description="Open or navigate an automated browser instance.",
                func=browser_open_tool,
                input_schema={
                    "type": "object",
                    "properties": {"url": {"type": "string"}},
                },
            )
        )
        self.register_tool(
            SOLTool(
                name="browser_search",
                description="Execute a web search in automated browser.",
                func=browser_search_tool,
                input_schema={
                    "type": "object",
                    "properties": {"query": {"type": "string"}},
                    "required": ["query"],
                },
            )
        )

        # Vision
        self.register_tool(
            SOLTool(
                name="take_screenshot",
                description="Capture and inspect current desktop screen state.",
                func=take_screenshot_tool,
                input_schema={"type": "object", "properties": {}},
            )
        )


tool_registry = ToolRegistry()
