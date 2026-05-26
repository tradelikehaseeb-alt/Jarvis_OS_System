"""
Task request validators — structural checks (Phase 6, Phase 14).
"""

from app.error_handling.exceptions import JarvisApiException
from app.schemas.tasks import CreateTaskRequestSchema

ALLOWED_INTENT_KINDS = frozenset(
    {"automate", "plan", "research", "draft", "default"},
)

MAX_INTENT_DESCRIPTION_LENGTH = 4096


def validate_create_task_request(body: CreateTaskRequestSchema) -> CreateTaskRequestSchema:
    """Validate create-task payload after Pydantic parse."""
    kind = body.intent.kind.strip()
    description = body.intent.description.strip()

    if not kind:
        raise JarvisApiException(
            "VALIDATION_ERROR",
            "intent.kind must not be empty",
            status_code=422,
        )
    if not description:
        raise JarvisApiException(
            "VALIDATION_ERROR",
            "intent.description must not be empty",
            status_code=422,
        )
    if kind not in ALLOWED_INTENT_KINDS:
        raise JarvisApiException(
            "VALIDATION_ERROR",
            f"intent.kind must be one of: {', '.join(sorted(ALLOWED_INTENT_KINDS))}",
            status_code=422,
            details={"kind": kind, "allowed": sorted(ALLOWED_INTENT_KINDS)},
        )
    if len(description) > MAX_INTENT_DESCRIPTION_LENGTH:
        raise JarvisApiException(
            "VALIDATION_ERROR",
            f"intent.description must be at most {MAX_INTENT_DESCRIPTION_LENGTH} characters",
            status_code=422,
        )

    return body.model_copy(
        update={
            "intent": body.intent.model_copy(
                update={"kind": kind, "description": description},
            ),
        },
    )
