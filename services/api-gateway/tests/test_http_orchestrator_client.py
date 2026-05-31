"""HttpOrchestratorClient tests."""

import json

import httpx
import pytest

from app.clients.http_orchestrator_client import HttpOrchestratorClient
from app.error_handling.exceptions import JarvisApiException
from app.schemas.tasks import CreateTaskRequestSchema
from app.schemas.task_intent import TaskIntentSchema


@pytest.mark.asyncio
async def test_create_task_when_orchestrator_up(httpx_mock) -> None:
    httpx_mock.add_response(
        method="POST",
        url="http://localhost:8787/tasks",
        json={
            "taskId": "task-live-001",
            "status": "queued",
            "createdAt": "2026-05-30T12:00:00.000Z",
        },
    )

    client = HttpOrchestratorClient(base_url="http://localhost:8787")
    body = CreateTaskRequestSchema(
        intent=TaskIntentSchema(kind="research", description="test task"),
    )
    response = await client.create_task(body)
    assert response.task_id == "task-live-001"


@pytest.mark.asyncio
async def test_get_task_status_when_orchestrator_up(httpx_mock) -> None:
    httpx_mock.add_response(
        method="GET",
        url="http://localhost:8787/tasks/task-live-001",
        json={
            "taskId": "task-live-001",
            "status": "completed",
            "progressPercent": 100,
            "updatedAt": "2026-05-30T12:00:00.000Z",
        },
    )

    client = HttpOrchestratorClient(base_url="http://localhost:8787")
    status = await client.get_task_status("task-live-001")
    assert status.status == "completed"


@pytest.mark.asyncio
async def test_clear_error_when_orchestrator_down(httpx_mock) -> None:
    for _ in range(3):
        httpx_mock.add_exception(httpx.ConnectError("connection refused"))

    client = HttpOrchestratorClient(base_url="http://localhost:8787")
    body = CreateTaskRequestSchema(
        intent=TaskIntentSchema(kind="research", description="offline"),
    )

    with pytest.raises(JarvisApiException) as exc:
        await client.create_task(body)

    assert exc.value.code == "ORCHESTRATOR_UNAVAILABLE"
    assert "unreachable" in exc.value.message.lower()


@pytest.mark.asyncio
async def test_stream_task_events_parses_sse(httpx_mock) -> None:
    sse_body = (
        'event: status\ndata: {"taskId":"task-1","status":"running"}\n\n'
        'event: status\ndata: {"taskId":"task-1","status":"completed"}\n\n'
    )

    httpx_mock.add_response(
        method="GET",
        url="http://localhost:8787/tasks/task-1/stream",
        text=sse_body,
        headers={"Content-Type": "text/event-stream"},
    )

    client = HttpOrchestratorClient(base_url="http://localhost:8787")
    events = [event async for event in client.stream_task_events("task-1")]
    assert len(events) == 2
    assert events[0]["data"]["status"] == "running"
    assert events[1]["data"]["status"] == "completed"
