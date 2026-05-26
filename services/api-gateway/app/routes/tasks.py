"""
Tasks routes — POST /tasks, GET /tasks/{taskId} (Phase 6).
"""

from fastapi import APIRouter, Depends

from app.controllers.tasks import TasksController
from app.dependencies import get_tasks_controller
from app.schemas.tasks import (
    CreateTaskRequestSchema,
    CreateTaskResponseSchema,
    TaskStatusResponseSchema,
)

tasks_router = APIRouter(prefix="/tasks", tags=["tasks"])


@tasks_router.post(
    "",
    response_model=CreateTaskResponseSchema,
    response_model_by_alias=True,
)
async def create_task(
    body: CreateTaskRequestSchema,
    controller: TasksController = Depends(get_tasks_controller),
) -> CreateTaskResponseSchema:
    """Create task — full lifecycle via orchestrator (Phase 14)."""
    return await controller.create_task(body)


@tasks_router.get(
    "/{task_id}",
    response_model=TaskStatusResponseSchema,
    response_model_by_alias=True,
)
async def get_task_status(
    task_id: str,
    controller: TasksController = Depends(get_tasks_controller),
) -> TaskStatusResponseSchema:
    """Task status — orchestrator stub response."""
    return await controller.get_task_status(task_id)
