"""Validator unit tests (Phase 14)."""

import pytest

from app.error_handling.exceptions import JarvisApiException
from app.schemas.task_intent import TaskIntentSchema
from app.schemas.tasks import CreateTaskRequestSchema
from app.validators.tasks import validate_create_task_request


def test_rejects_unknown_intent_kind() -> None:
    body = CreateTaskRequestSchema(
        intent=TaskIntentSchema(kind="not-a-real-kind", description="test"),
    )
    with pytest.raises(JarvisApiException) as exc_info:
        validate_create_task_request(body)
    assert exc_info.value.code == "VALIDATION_ERROR"
    assert exc_info.value.status_code == 422


def test_accepts_automate_kind() -> None:
    body = CreateTaskRequestSchema(
        intent=TaskIntentSchema(kind="automate", description="Run workflow"),
    )
    result = validate_create_task_request(body)
    assert result.intent.kind == "automate"
