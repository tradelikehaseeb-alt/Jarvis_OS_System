"""
StubOrchestratorClient — in-process E2E task lifecycle for tests and CI (Phase 14).
"""

from __future__ import annotations

from datetime import datetime, timezone

from app.error_handling.exceptions import JarvisApiException
from app.schemas.conversation import (
    ConversationRequestSchema,
    ConversationResponseSchema,
)
from app.schemas.tasks import (
    CreateTaskRequestSchema,
    CreateTaskResponseSchema,
    TaskStatusResponseSchema,
)

_AUTOMATE_KINDS = frozenset({"automate"})


def _utc_now() -> str:
    return datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%S.000Z")


def _build_skill_output(kind: str) -> dict:
    if kind in _AUTOMATE_KINDS:
        return {
            "skillIds": ["browser-skill", "file-skill"],
            "browser": {
                "stub": True,
                "action": "navigate",
                "url": "https://stub.local/task",
            },
            "file": {
                "stub": True,
                "operation": "read",
                "path": "/stub/workspace/output.txt",
            },
        }
    return {
        "skillId": "search-skill",
        "data": {
            "stub": True,
            "query": "stub",
            "results": [
                {"title": "Stub result A", "url": "https://stub.local/a", "score": 0.9},
                {"title": "Stub result B", "url": "https://stub.local/b", "score": 0.7},
            ],
            "total": 2,
        },
    }


def _selected_agent_id(kind: str) -> str:
    return "openclaw-gateway" if kind in _AUTOMATE_KINDS else "hermes"


class StubOrchestratorClient:
    """Test double — simulates full Phase 14 task lifecycle in-process."""

    def __init__(self) -> None:
        self._tasks: dict[str, TaskStatusResponseSchema] = {}
        self._counter = 0

    async def create_task(
        self, body: CreateTaskRequestSchema
    ) -> CreateTaskResponseSchema:
        self._counter += 1
        task_id = f"task-test-{self._counter:03d}"
        created_at = _utc_now()
        kind = body.intent.kind
        agent_id = _selected_agent_id(kind)

        output = {
            "stub": True,
            "phase": 14,
            "routing": {
                "selectedAgentId": agent_id,
                "reason": f"Selected {agent_id} (score=stub)",
                "policyId": "default-static-v1",
                "matches": 1,
            },
            "agent": {
                "agentId": agent_id,
                "requestId": f"req-stub-{task_id}",
                "success": True,
            },
            "skill": _build_skill_output(kind),
        }

        status = TaskStatusResponseSchema.model_validate(
            {
                "taskId": task_id,
                "status": "completed",
                "progressPercent": 100,
                "output": output,
                "updatedAt": created_at,
            }
        )
        self._tasks[task_id] = status

        return CreateTaskResponseSchema.model_validate(
            {
                "taskId": task_id,
                "status": "completed",
                "createdAt": created_at,
                "correlationId": body.correlation_id,
            }
        )

    async def get_task_status(self, task_id: str) -> TaskStatusResponseSchema:
        stored = self._tasks.get(task_id)
        if stored is None:
            raise JarvisApiException(
                "TASK_NOT_FOUND",
                f"Task {task_id} not found",
                status_code=404,
            )
        return stored

    async def send_conversation(
        self, body: ConversationRequestSchema
    ) -> ConversationResponseSchema:
        return ConversationResponseSchema.model_validate(
            {
                "sessionId": body.session_id or "sess-test-001",
                "reply": f"Stub reply: {body.message[:40]}",
                "createdAt": _utc_now(),
            }
        )
