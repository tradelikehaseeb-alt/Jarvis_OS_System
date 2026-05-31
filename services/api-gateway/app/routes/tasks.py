"""
Tasks routes — POST /tasks, GET /tasks/{taskId}, SSE stream (Phase 6).
"""

import asyncio
import json

from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse

from app.clients import get_orchestrator_client
from app.clients.http_orchestrator_client import HttpOrchestratorClient
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
    """Task status — orchestrator response."""
    return await controller.get_task_status(task_id)


@tasks_router.get("/{task_id}/stream")
async def stream_task_status(task_id: str) -> StreamingResponse:
    """SSE stream — proxies orchestrator stream or polls task status."""

    async def event_generator():
        client = get_orchestrator_client()
        if isinstance(client, HttpOrchestratorClient):
            async for event in client.stream_task_events(task_id):
                yield (
                    f"event: {event.get('event', 'message')}\n"
                    f"data: {json.dumps(event.get('data', {}))}\n\n"
                )
            return

        terminal = {"completed", "failed", "cancelled"}
        for _ in range(60):
            status = await client.get_task_status(task_id)
            payload = status.model_dump(by_alias=True)
            yield f"event: status\ndata: {json.dumps(payload)}\n\n"
            if status.status in terminal:
                break
            await asyncio.sleep(0.5)

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "Connection": "keep-alive"},
    )
