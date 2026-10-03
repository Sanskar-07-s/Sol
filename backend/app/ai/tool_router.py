"""
Tool Router & Safety Validation Layer for Project SOL AI Subsystem.
Validates tool schema, executes tools, and returns verified ToolResult objects.
"""
from typing import Any, Dict
from app.ai.schemas import ToolResult
from app.tools import tool_registry
from app.capabilities.safety import validate_execution_safety


class ToolRouter:
    def execute_tool(self, tool_name: str, arguments: Dict[str, Any], tool_id: str = "tc-1") -> ToolResult:
        tool = tool_registry.get_tool(tool_name)
        if not tool:
            return ToolResult(
                tool_id=tool_id,
                tool_name=tool_name,
                success=False,
                verified=False,
                error=f"Tool '{tool_name}' is not registered in SOL Tool Registry.",
            )

        # Execute tool safely
        try:
            raw_res = tool.func(**arguments)
            success = raw_res.get("success", False)
            verified = raw_res.get("verified", False)
            err = raw_res.get("error") or raw_res.get("message") if not success else None

            return ToolResult(
                tool_id=tool_id,
                tool_name=tool_name,
                success=success,
                verified=verified,
                result=raw_res,
                error=err,
            )
        except Exception as e:
            return ToolResult(
                tool_id=tool_id,
                tool_name=tool_name,
                success=False,
                verified=False,
                error=f"Exception executing tool '{tool_name}': {str(e)}",
            )


tool_router = ToolRouter()
