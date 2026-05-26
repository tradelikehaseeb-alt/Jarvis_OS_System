"""Task API schemas — mirrors @jarvis/types CreateTask* and TaskStatusResponse."""

from typing import Any, Literal

from pydantic import BaseModel, Field

from app.schemas.task_intent import TaskIntentSchema

TaskResultStatus = Literal[
    "pending",
    "queued",
    "running",
    "completed",
    "failed",
    "cancelled",
]


class CreateTaskRequestSchema(BaseModel):
    """POST /tasks request body (Phase 4+)."""

    intent: TaskIntentSchema
    correlation_id: str | None = Field(default=None, alias="correlationId")
    metadata: dict[str, Any] | None = None

    model_config = {"populate_by_name": True}


class CreateTaskResponseSchema(BaseModel):
    """POST /tasks response body."""

    task_id: str = Field(..., alias="taskId")
    status: TaskResultStatus
    created_at: str = Field(..., alias="createdAt")
    correlation_id: str | None = Field(default=None, alias="correlationId")

    model_config = {"populate_by_name": True}


class TaskErrorSchema(BaseModel):
    code: str
    message: str
    details: dict[str, Any] | None = None


class TaskStatusResponseSchema(BaseModel):
    """GET /tasks/{id} response body."""

    task_id: str = Field(..., alias="taskId")
    status: TaskResultStatus
    progress_percent: int | None = Field(default=None, alias="progressPercent", ge=0, le=100)
    output: dict[str, Any] | None = None
    error: TaskErrorSchema | None = None
    updated_at: str = Field(..., alias="updatedAt")

    model_config = {"populate_by_name": True}
