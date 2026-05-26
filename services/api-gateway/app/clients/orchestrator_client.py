"""
OrchestratorClient — api-gateway port to the orchestrator layer (Phase 7).

Controllers depend on this interface only, not on transport details.
"""

from __future__ import annotations

from typing import Any, Protocol

from app.schemas.conversation import (
    ConversationRequestSchema,
    ConversationResponseSchema,
)
from app.schemas.tasks import (
    CreateTaskRequestSchema,
    CreateTaskResponseSchema,
    TaskStatusResponseSchema,
)


class OrchestratorClient(Protocol):
    """
    Application-level client for orchestrator operations.

    Implementations: StubOrchestratorClient, LocalBridgeOrchestratorClient.
    """

    async def create_task(
        self, body: CreateTaskRequestSchema
    ) -> CreateTaskResponseSchema: ...

    async def get_task_status(self, task_id: str) -> TaskStatusResponseSchema: ...

    async def send_conversation(
        self, body: ConversationRequestSchema
    ) -> ConversationResponseSchema: ...


def model_to_bridge_payload(body: CreateTaskRequestSchema) -> dict[str, Any]:
    """Map Pydantic request → bridge JSON (aligned with @jarvis/types)."""
    intent = body.intent
    return {
        "intent": {
            "kind": intent.kind,
            "description": intent.description,
            "parameters": intent.parameters,
            "priority": intent.priority,
        },
        "correlationId": body.correlation_id,
        "metadata": body.metadata,
    }
