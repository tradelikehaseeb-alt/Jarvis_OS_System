"""
Conversations controller — orchestrator stub wiring only (Phase 6).
"""

from app.clients import OrchestratorClient
from app.schemas.conversation import (
    ConversationRequestSchema,
    ConversationResponseSchema,
)
from app.validators.conversation import validate_conversation_request


class ConversationsController:
    """HTTP conversation operations → orchestrator (no direct memory HTTP)."""

    def __init__(self, orchestrator: OrchestratorClient) -> None:
        self._orchestrator = orchestrator

    async def send_message(
        self, body: ConversationRequestSchema
    ) -> ConversationResponseSchema:
        validated = validate_conversation_request(body)
        return await self._orchestrator.send_conversation(validated)
