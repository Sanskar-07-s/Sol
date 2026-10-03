"""
AI Provider Factory for Project SOL.
"""
import os
from typing import Optional
from app.ai.providers.base import BaseAIProvider
from app.ai.providers.ollama import OllamaProvider
from app.ai.providers.local import LocalFallbackProvider


def get_ai_provider(provider_name: Optional[str] = None) -> BaseAIProvider:
    name = (provider_name or os.getenv("SOL_AI_PROVIDER", "ollama")).lower().strip()

    if name == "ollama":
        provider = OllamaProvider()
        # Test health; if Ollama daemon is offline, return OllamaProvider (which handles health check errors transparently)
        return provider
    elif name == "local" or name == "fallback":
        return LocalFallbackProvider()
    else:
        return OllamaProvider()
