"""
SOL AI Subsystem Exceptions & Error Definitions.
"""


class AIException(Exception):
    """Base exception for all SOL AI errors"""
    def __init__(self, message: str, error_code: str = "AI_ERROR", details: dict = None):
        super().__init__(message)
        self.message = message
        self.error_code = error_code
        self.details = details or {}


class ModelUnavailableError(AIException):
    """Raised when the requested LLM provider or model is offline/unreachable"""
    def __init__(self, message: str = "AI Model provider is currently unavailable.", details: dict = None):
        super().__init__(message, error_code="AI_UNAVAILABLE", details=details)


class ToolExecutionError(AIException):
    """Raised when a tool fails safety or execution boundaries"""
    def __init__(self, message: str, tool_name: str, details: dict = None):
        d = details or {}
        d["tool_name"] = tool_name
        super().__init__(message, error_code="TOOL_EXECUTION_FAILED", details=d)


class InvalidToolSchemaError(AIException):
    """Raised when tool arguments fail schema validation"""
    def __init__(self, message: str, tool_name: str, details: dict = None):
        d = details or {}
        d["tool_name"] = tool_name
        super().__init__(message, error_code="INVALID_TOOL_SCHEMA", details=d)


class MaxIterationsExceededError(AIException):
    """Raised when agent planning loop exceeds maximum allowed iterations"""
    def __init__(self, message: str = "Maximum planning iterations exceeded.", details: dict = None):
        super().__init__(message, error_code="MAX_ITERATIONS_EXCEEDED", details=details)
