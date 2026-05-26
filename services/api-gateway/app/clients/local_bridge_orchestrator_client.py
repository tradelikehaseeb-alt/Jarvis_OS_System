"""
LocalBridgeOrchestratorClient — orchestrator access via pluggable transport (Phase 7–14).

Default transport: LocalCliTransport (temporary subprocess bridge to tsx CLI).
"""

from __future__ import annotations

import json

from app.clients.orchestrator_client import OrchestratorClient, model_to_bridge_payload
from app.error_handling.exceptions import JarvisApiException
from app.clients.transport.local_cli import LocalCliTransport
from app.clients.transport.protocol import OrchestratorTransport
from app.schemas.conversation import (
    ConversationRequestSchema,
    ConversationResponseSchema,
)
from app.schemas.tasks import (
    CreateTaskRequestSchema,
    CreateTaskResponseSchema,
    TaskStatusResponseSchema,
)


class LocalBridgeOrchestratorClient:
    """
    Orchestrator client using a local development bridge transport.

    Wires application methods to {@link OrchestratorTransport.invoke}.
    Swap `transport` for HTTP/gRPC/MQ when orchestrator is a remote service.
    """

    def __init__(self, transport: OrchestratorTransport | None = None) -> None:
        self._transport = transport or LocalCliTransport()

    async def create_task(
        self, body: CreateTaskRequestSchema
    ) -> CreateTaskResponseSchema:
        data = await self._transport.invoke(
            "createTask",
            model_to_bridge_payload(body),
        )
        return CreateTaskResponseSchema.model_validate(data)

    async def get_task_status(self, task_id: str) -> TaskStatusResponseSchema:
        try:
            data = await self._transport.invoke("getTaskStatus", {"taskId": task_id})
        except RuntimeError as exc:
            self._raise_bridge_error(exc)
        return TaskStatusResponseSchema.model_validate(data)

    @staticmethod
    def _raise_bridge_error(exc: RuntimeError) -> None:
        """Map bridge stderr JSON codes to API exceptions."""
        try:
            body = json.loads(str(exc))
            code = body.get("code", "ORCHESTRATOR_BRIDGE_ERROR")
            message = body.get("message", str(exc))
        except json.JSONDecodeError:
            raise exc
        if code == "TASK_NOT_FOUND":
            raise JarvisApiException(code, message, status_code=404) from exc
        raise JarvisApiException(
            "ORCHESTRATOR_BRIDGE_ERROR",
            message,
            status_code=502,
        ) from exc

    async def send_conversation(
        self, body: ConversationRequestSchema
    ) -> ConversationResponseSchema:
        data = await self._transport.invoke(
            "sendConversation",
            {
                "message": body.message,
                "sessionId": body.session_id,
            },
        )
        return ConversationResponseSchema.model_validate(data)
