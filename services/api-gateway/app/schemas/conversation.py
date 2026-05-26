"""Conversation API schemas — mirrors @jarvis/types Conversation*."""

from typing import Any

from pydantic import BaseModel, Field


class ConversationRequestSchema(BaseModel):
    """POST /conversations request body (Phase 4+)."""

    session_id: str | None = Field(default=None, alias="sessionId")
    message: str
    metadata: dict[str, Any] | None = None

    model_config = {"populate_by_name": True}


class ConversationResponseSchema(BaseModel):
    """Conversation turn response."""

    session_id: str = Field(..., alias="sessionId")
    reply: str
    task_id: str | None = Field(default=None, alias="taskId")
    created_at: str = Field(..., alias="createdAt")

    model_config = {"populate_by_name": True}
