"""API error envelope — mirrors @jarvis/types ApiErrorResponse."""

from typing import Any

from pydantic import BaseModel, Field


class ApiErrorBodySchema(BaseModel):
    code: str
    message: str
    details: dict[str, Any] | None = None


class ApiErrorResponseSchema(BaseModel):
    error: ApiErrorBodySchema
    request_id: str | None = Field(default=None, alias="requestId")

    model_config = {"populate_by_name": True}
