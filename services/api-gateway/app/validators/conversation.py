"""Conversation validators — Phase 6."""

from app.error_handling.exceptions import JarvisApiException
from app.schemas.conversation import ConversationRequestSchema


def validate_conversation_request(
    body: ConversationRequestSchema,
) -> ConversationRequestSchema:
    """Structural validation beyond Pydantic."""
    message = body.message.strip()
    if not message:
        raise JarvisApiException(
            "VALIDATION_ERROR",
            "message must not be empty",
            status_code=422,
        )
    if len(message) > 32_000:
        raise JarvisApiException(
            "VALIDATION_ERROR",
            "message exceeds maximum length",
            status_code=422,
        )
    return body.model_copy(update={"message": message})
