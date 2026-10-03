"""
Long-Term & Structured Memory Tools for Project SOL.
Handles persistent user preferences, facts, and device configurations.
Never stores credentials, auth tokens, or passwords.
"""
import time
import uuid
from typing import Any, Dict, List, Optional
from app.ai.schemas import MemoryItem

SECRET_KEYWORDS = {"password", "secret", "token", "credential", "auth", "key", "api_key", "bearer"}


class MemoryStore:
    def __init__(self):
        self._memories: Dict[str, MemoryItem] = {}

    def is_secret(self, key: str, value: Any) -> bool:
        k_lower = str(key).lower()
        v_lower = str(value).lower()
        return any(sk in k_lower or sk in v_lower for sk in SECRET_KEYWORDS)

    def remember(
        self,
        memory_type: str,
        key: str,
        value: Any,
        confidence: float = 1.0,
    ) -> Dict[str, Any]:
        """Store a structured memory record."""
        if self.is_secret(key, value):
            return {
                "success": False,
                "verified": False,
                "error": "Safety Refusal: Sensitive credentials or secrets cannot be stored in SOL memory.",
            }

        mem_id = f"mem-{uuid.uuid4().hex[:8]}"
        item = MemoryItem(
            memory_id=mem_id,
            type=memory_type if memory_type in ("preference", "fact", "device", "app", "workflow") else "preference",
            key=key.strip(),
            value=value,
            confidence=confidence,
            timestamp=time.time(),
        )
        self._memories[mem_id] = item
        return {
            "success": True,
            "verified": True,
            "memory_id": mem_id,
            "key": item.key,
            "value": item.value,
        }

    def recall(self, key: str) -> Dict[str, Any]:
        """Recall a stored memory record by key."""
        k_lower = key.strip().lower()
        for item in self._memories.values():
            if item.key.lower() == k_lower:
                return {
                    "success": True,
                    "verified": True,
                    "found": True,
                    "memory": item.dict(),
                }
        return {"success": True, "verified": True, "found": False, "message": f"No memory record found for '{key}'."}

    def search(self, query: str) -> Dict[str, Any]:
        """Search memory records for matching key or value."""
        q_lower = query.strip().lower()
        results = []
        for item in self._memories.values():
            if q_lower in item.key.lower() or q_lower in str(item.value).lower():
                results.append(item.dict())
        return {
            "success": True,
            "verified": True,
            "count": len(results),
            "memories": results,
        }

    def forget(self, key_or_id: str) -> Dict[str, Any]:
        """Delete a stored memory record."""
        target = key_or_id.strip().lower()
        deleted = False
        to_delete = []
        for mem_id, item in self._memories.items():
            if mem_id.lower() == target or item.key.lower() == target:
                to_delete.append(mem_id)

        for mem_id in to_delete:
            del self._memories[mem_id]
            deleted = True

        return {
            "success": deleted,
            "verified": True,
            "deleted_count": len(to_delete),
        }


memory_store = MemoryStore()


def remember_tool(memory_type: str, key: str, value: Any) -> Dict[str, Any]:
    return memory_store.remember(memory_type, key, value)


def recall_memory_tool(key: str) -> Dict[str, Any]:
    return memory_store.recall(key)


def search_memory_tool(query: str) -> Dict[str, Any]:
    return memory_store.search(query)


def forget_memory_tool(key: str) -> Dict[str, Any]:
    return memory_store.forget(key)
