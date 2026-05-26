"""
Tasks controller — delegates to orchestrator via OrchestratorClient (Phase 6).
"""

from typing import Protocol

from app.clients import OrchestratorClient
from app.schemas.tasks import (
    CreateTaskRequestSchema,
    CreateTaskResponseSchema,
    TaskStatusResponseSchema,
)
from app.validators.tasks import validate_create_task_request


class TasksControllerProtocol(Protocol):
    """Contract for task HTTP operations."""

    async def create_task(
        self, body: CreateTaskRequestSchema
    ) -> CreateTaskResponseSchema: ...

    async def get_task_status(self, task_id: str) -> TaskStatusResponseSchema: ...


class TasksController:
    """
    HTTP task operations → orchestrator (Phase 14).

    Flow: validate → OrchestratorClient → capability route → agent → skill.
    """

    def __init__(self, orchestrator: OrchestratorClient) -> None:
        self._orchestrator = orchestrator

    async def create_task(
        self, body: CreateTaskRequestSchema
    ) -> CreateTaskResponseSchema:
        validated = validate_create_task_request(body)
        return await self._orchestrator.create_task(validated)

    async def get_task_status(self, task_id: str) -> TaskStatusResponseSchema:
        task_id = task_id.strip()
        if not task_id:
            from app.error_handling.exceptions import JarvisApiException

            raise JarvisApiException(
                "VALIDATION_ERROR",
                "taskId must not be empty",
                status_code=422,
            )
        return await self._orchestrator.get_task_status(task_id)
