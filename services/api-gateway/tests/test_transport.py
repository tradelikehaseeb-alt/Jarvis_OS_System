"""Transport abstraction tests (Phase 7)."""

from pathlib import Path

import pytest

from app.clients import LocalBridgeOrchestratorClient, LocalCliTransport, StubOrchestratorClient
from app.clients.transport.local_cli import _API_GATEWAY_ROOT, _BRIDGE_CLI, _REPO_ROOT


def test_local_cli_transport_paths() -> None:
    assert _BRIDGE_CLI.name == "cli.ts"
    assert _BRIDGE_CLI.parent.name == "orchestrator-bridge"
    assert (_API_GATEWAY_ROOT / "app" / "clients").exists()
    assert _REPO_ROOT.name  # monorepo root directory


@pytest.mark.asyncio
async def test_local_bridge_uses_injected_transport() -> None:
    calls: list[tuple[str, dict]] = []

    class FakeTransport:
        async def invoke(self, method: str, payload: dict) -> dict:
            calls.append((method, payload))
            if method == "createTask":
                return {
                    "taskId": "task-fake",
                    "status": "queued",
                    "createdAt": "2026-01-01T00:00:00.000Z",
                }
            return {}

    client = LocalBridgeOrchestratorClient(transport=FakeTransport())
    from app.schemas.task_intent import TaskIntentSchema
    from app.schemas.tasks import CreateTaskRequestSchema

    body = CreateTaskRequestSchema(
        intent=TaskIntentSchema(kind="test", description="desc"),
    )
    result = await client.create_task(body)
    assert result.task_id == "task-fake"
    assert calls[0][0] == "createTask"


def test_stub_client_unchanged_behavior() -> None:
    """Stub remains the default for conftest / CI."""
    import inspect

    assert hasattr(StubOrchestratorClient, "create_task")
    assert Path(inspect.getfile(StubOrchestratorClient)).name == "stub_orchestrator_client_legacy.py"
