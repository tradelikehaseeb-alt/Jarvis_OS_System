"""Integration tests — POST /tasks through controller to orchestrator stub (Phase 14)."""

from fastapi.testclient import TestClient

from app.main import create_app


def test_post_tasks_research_returns_completed_with_search_skill() -> None:
    client = TestClient(create_app())
    create = client.post(
        "/tasks",
        json={
            "intent": {
                "kind": "research",
                "description": "Find API documentation",
            },
            "correlationId": "corr-e2e-1",
        },
    )
    assert create.status_code == 200
    created = create.json()
    assert created["status"] == "completed"
    assert created["correlationId"] == "corr-e2e-1"
    task_id = created["taskId"]

    status = client.get(f"/tasks/{task_id}")
    assert status.status_code == 200
    body = status.json()
    assert body["status"] == "completed"
    assert body["progressPercent"] == 100
    assert body["output"]["skill"]["skillId"] == "search-skill"
    assert body["output"]["routing"]["selectedAgentId"] == "hermes"


def test_post_tasks_automate_routes_to_openclaw_skills() -> None:
    client = TestClient(create_app())
    create = client.post(
        "/tasks",
        json={
            "intent": {
                "kind": "automate",
                "description": "Open the dashboard",
            },
        },
    )
    assert create.status_code == 200
    task_id = create.json()["taskId"]

    status = client.get(f"/tasks/{task_id}").json()
    assert status["output"]["routing"]["selectedAgentId"] == "openclaw-gateway"
    skill_ids = status["output"]["skill"]["skillIds"]
    assert "browser-skill" in skill_ids
    assert "file-skill" in skill_ids


def test_get_task_status_not_found() -> None:
    client = TestClient(create_app())
    response = client.get("/tasks/task-does-not-exist")
    assert response.status_code == 404
    assert response.json()["error"]["code"] == "TASK_NOT_FOUND"


def test_invalid_intent_kind_returns_validation_error() -> None:
    client = TestClient(create_app())
    response = client.post(
        "/tasks",
        json={
            "intent": {
                "kind": "unknown-kind",
                "description": "test",
            },
        },
    )
    assert response.status_code == 422
    assert response.json()["error"]["code"] == "VALIDATION_ERROR"
