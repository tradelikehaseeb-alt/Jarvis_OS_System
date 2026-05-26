"""
Conversations routes — POST /conversations (Phase 6).
"""

from fastapi import APIRouter, Depends

from app.controllers.conversations import ConversationsController
from app.dependencies import get_conversations_controller
from app.schemas.conversation import (
    ConversationRequestSchema,
    ConversationResponseSchema,
)

conversations_router = APIRouter(prefix="/conversations", tags=["conversations"])


@conversations_router.post(
    "",
    response_model=ConversationResponseSchema,
    response_model_by_alias=True,
)
async def send_conversation(
    body: ConversationRequestSchema,
    controller: ConversationsController = Depends(get_conversations_controller),
) -> ConversationResponseSchema:
    """Conversation turn — orchestrator stub (no memory HTTP)."""
    return await controller.send_message(body)
