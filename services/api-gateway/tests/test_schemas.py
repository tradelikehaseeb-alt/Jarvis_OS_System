"""Pydantic schema tests aligned with @jarvis/types API contracts."""

import pytest
from pydantic import ValidationError

from app.schemas import (
    ApiErrorResponseSchema,
    ConversationRequestSchema,
    ConversationResponseSchema,
    CreateTaskRequestSchema,
    CreateTaskResponseSchema,
    TaskStatusResponseSchema,
)


def test_create_task_request_schema() -> None:
    body = CreateTaskRequestSchema.model_validate(
        {
            "intent": {
                "kind": "automate",
                "description": "Organize files",
            },
            "correlationId": "corr-1",
        }
    )
    assert body.intent.kind == "automate"
    assert body.correlation_id == "corr-1"


def test_create_task_response_schema_aliases() -> None:
    res = CreateTaskResponseSchema.model_validate(
        {
            "taskId": "task-1",
            "status": "queued",
            "createdAt": "2026-05-25T00:00:00Z",
        }
    )
    dumped = res.model_dump(by_alias=True)
    assert dumped["taskId"] == "task-1"
    assert dumped["status"] == "queued"


def test_task_status_response_progress_bounds() -> None:
    TaskStatusResponseSchema.model_validate(
        {
            "taskId": "task-1",
            "status": "running",
            "progressPercent": 50,
            "updatedAt": "2026-05-25T00:00:00Z",
        }
    )
    with pytest.raises(ValidationError):
        TaskStatusResponseSchema.model_validate(
            {
                "taskId": "task-1",
                "status": "running",
                "progressPercent": 101,
                "updatedAt": "2026-05-25T00:00:00Z",
            }
        )


def test_conversation_schemas() -> None:
    req = ConversationRequestSchema.model_validate({"message": "Hello"})
    res = ConversationResponseSchema.model_validate(
        {
            "sessionId": "sess-1",
            "reply": "Hi",
            "createdAt": "2026-05-25T00:00:00Z",
        }
    )
    assert req.message == "Hello"
    assert res.session_id == "sess-1"


def test_api_error_response_schema() -> None:
    err = ApiErrorResponseSchema.model_validate(
        {
            "error": {"code": "NOT_FOUND", "message": "Missing"},
            "requestId": "req-9",
        }
    )
    assert err.error.code == "NOT_FOUND"
    assert err.request_id == "req-9"
