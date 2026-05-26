"""
Map exceptions to ApiErrorResponse schema — structure only (Phase 3).
"""

from app.error_handling.exceptions import JarvisApiException
from app.schemas.api_error import ApiErrorBodySchema, ApiErrorResponseSchema


def exception_to_api_error(
    exc: JarvisApiException,
    *,
    request_id: str | None = None,
) -> ApiErrorResponseSchema:
    """Build standard error envelope from a JarvisApiException."""
    return ApiErrorResponseSchema(
        error=ApiErrorBodySchema(
            code=exc.code,
            message=exc.message,
            details=exc.details,
        ),
        requestId=request_id,
    )
