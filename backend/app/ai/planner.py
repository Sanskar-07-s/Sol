"""
Lightweight Multi-Step Task Planner for Project SOL.
Decomposes complex goals into verified step-by-step tool execution plans.
"""
import re
from typing import Dict, List, Optional
from app.ai.schemas import AIPlan, AIPlanStep


class Planner:
    def create_plan(self, goal: str) -> AIPlan:
        clean_goal = goal.strip()
        lower = clean_goal.lower()

        # Multi-step pattern check (e.g. "open Chrome and search for OpenAI")
        and_match = re.search(r"^(open|launch|start)\s+([a-z0-9\s]+?)\s+and\s+(search for|find|open)\s+(.+)$", lower)
        if and_match:
            app_target = and_match.group(2).strip()
            action_type = and_match.group(3).strip()
            query_target = and_match.group(4).strip()

            step1 = AIPlanStep(
                step_index=1,
                description=f"Launch application '{app_target}'",
                tool_name="launch_application",
                arguments={"app_name": app_target},
            )
            step2 = AIPlanStep(
                step_index=2,
                description=f"Execute browser search for '{query_target}'",
                tool_name="browser_search",
                arguments={"query": query_target},
            )
            return AIPlan(goal=clean_goal, steps=[step1, step2])

        # Simple single-step fallback
        step = AIPlanStep(
            step_index=1,
            description=f"Execute primary goal: '{clean_goal}'",
            tool_name="auto_dispatch",
            arguments={"query": clean_goal},
        )
        return AIPlan(goal=clean_goal, steps=[step])


planner = Planner()
