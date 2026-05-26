"""Controller unit tests with stub orchestrator client."""

import pytest

from app.clients import StubOrchestratorClient
from app.controllers.conversations import ConversationsController
from app.controllers.tasks import TasksController
from app.error_handling.exceptions import JarvisApiException
from app.schemas.conversation import ConversationRequestSchema
from app.schemas.task_intent import TaskIntentSchema
from app.schemas.tasks import CreateTaskRequestSchema


@pytest.mark.asyncio
async def test_tasks_controller_create() -> None:
    controller = TasksController(StubOrchestratorClient())
    body = CreateTaskRequestSchema(
        intent=TaskIntentSchema(kind="research", description="Find flights"),
    )
    result = await controller.create_task(body)
    assert result.task_id.startswith("task-test-")
    assert result.status == "completed"


@pytest.mark.asyncio
async def test_tasks_controller_validation_raises() -> None:
    controller = TasksController(StubOrchestratorClient())
    body = CreateTaskRequestSchema(
        intent=TaskIntentSchema(kind="", description="x"),
    )
    with pytest.raises(JarvisApiException) as exc_info:
        await controller.create_task(body)
    assert exc_info.value.code == "VALIDATION_ERROR"


@pytest.mark.asyncio
async def test_conversations_controller() -> None:
    controller = ConversationsController(StubOrchestratorClient())
    result = await controller.send_message(
        ConversationRequestSchema(message="Hi"),
    )
    assert result.session_id == "sess-test-001"
