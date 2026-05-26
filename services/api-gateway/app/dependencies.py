"""FastAPI dependencies (Phase 6)."""

from app.clients import OrchestratorClient, get_orchestrator_client
from app.controllers.conversations import ConversationsController
from app.controllers.tasks import TasksController


def get_orchestrator() -> OrchestratorClient:
    return get_orchestrator_client()


def get_tasks_controller() -> TasksController:
    return TasksController(get_orchestrator())


def get_conversations_controller() -> ConversationsController:
    return ConversationsController(get_orchestrator())
