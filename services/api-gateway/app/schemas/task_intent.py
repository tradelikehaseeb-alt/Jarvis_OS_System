"""Task intent schema — mirrors packages/types TaskIntent."""

from typing import Any, Literal

from pydantic import BaseModel, Field

TaskIntentPriority = Literal["low", "normal", "high", "critical"]


class TaskIntentSchema(BaseModel):
    """Declared intent behind a user task."""

    kind: str = Field(..., description="Intent category")
    description: str = Field(..., description="Natural-language or structured description")
    parameters: dict[str, Any] | None = Field(default=None)
    priority: TaskIntentPriority | None = Field(default=None)
