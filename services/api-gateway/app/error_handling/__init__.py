"""Error handling — maps exceptions to ApiErrorResponse."""

from app.error_handling.exceptions import JarvisApiException
from app.error_handling.handlers import register_exception_handlers
from app.error_handling.mapper import exception_to_api_error

__all__ = [
    "JarvisApiException",
    "exception_to_api_error",
    "register_exception_handlers",
]
