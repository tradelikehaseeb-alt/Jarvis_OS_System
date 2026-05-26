"""HTTP route tests — orchestrator stub client (Phase 6)."""

from fastapi.testclient import TestClient

from app.main import create_app


def test_post_tasks_returns_create_task_response() -> None:
    client = TestClient(create_app())
    response = client.post(
        "/tasks",
        json={
            "intent": {
                "kind": "automate",
                "description": "Organize downloads",
            },
            "correlationId": "corr-1",
        },
    )
    assert response.status_code == 200
    data = response.json()
    assert data["taskId"].startswith("task-test-")
    assert data["status"] == "completed"
    assert data["correlationId"] == "corr-1"


def test_get_task_status_after_create() -> None:
    client = TestClient(create_app())
    create = client.post(
        "/tasks",
        json={
            "intent": {"kind": "plan", "description": "Plan tasks"},
        },
    )
    task_id = create.json()["taskId"]
    response = client.get(f"/tasks/{task_id}")
    assert response.status_code == 200
    data = response.json()
    assert data["taskId"] == task_id
    assert data["status"] == "completed"
    assert data["progressPercent"] == 100
    assert "skill" in data["output"]


def test_post_conversations() -> None:
    client = TestClient(create_app())
    response = client.post(
        "/conversations",
        json={"message": "Hello Jarvis"},
    )
    assert response.status_code == 200
    data = response.json()
    assert "sessionId" in data
    assert "reply" in data
    assert "Jarvis stub" in data["reply"] or "Stub reply" in data["reply"]


def test_post_tasks_validation_error_envelope() -> None:
    client = TestClient(create_app())
    response = client.post(
        "/tasks",
        json={
            "intent": {
                "kind": "",
                "description": "x",
            },
        },
    )
    assert response.status_code == 422
    body = response.json()
    assert body["error"]["code"] == "VALIDATION_ERROR"


def test_post_conversations_empty_message() -> None:
    client = TestClient(create_app())
    response = client.post("/conversations", json={"message": "   "})
    assert response.status_code == 422
    assert response.json()["error"]["code"] == "VALIDATION_ERROR"


def test_no_memory_routes_exposed() -> None:
    client = TestClient(create_app())
    assert client.get("/memory").status_code == 404
    assert client.post("/memory/search").status_code == 404
