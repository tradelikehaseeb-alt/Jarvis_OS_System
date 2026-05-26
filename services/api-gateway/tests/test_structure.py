"""Verify API gateway package structure (Phase 6)."""

import importlib

from fastapi.testclient import TestClient

from app.main import create_app


def test_app_factory_exists() -> None:
    module = importlib.import_module("app.main")
    assert hasattr(module, "create_app")
    assert hasattr(module, "app")


def test_routes_registered() -> None:
    client = TestClient(create_app())
    openapi = client.get("/openapi.json").json()
    paths = openapi["paths"]
    assert "/tasks" in paths
    assert "post" in paths["/tasks"]
    assert "/tasks/{task_id}" in paths
    assert "/conversations" in paths


def test_controllers_export_implementations() -> None:
    controllers = importlib.import_module("app.controllers")
    assert "TasksController" in controllers.__all__
    assert "ConversationsController" in controllers.__all__


def test_orchestrator_client_factory() -> None:
    clients = importlib.import_module("app.clients")
    assert hasattr(clients, "LocalBridgeOrchestratorClient")
    assert hasattr(clients, "StubOrchestratorClient")
    assert hasattr(clients, "OrchestratorTransport")
    assert hasattr(clients, "LocalCliTransport")
    # Phase 6 alias
    assert clients.NodeOrchestratorClient is clients.LocalBridgeOrchestratorClient


def test_error_handling_mapper() -> None:
    from app.error_handling import JarvisApiException, exception_to_api_error

    exc = JarvisApiException("TEST", "Test error", status_code=400)
    body = exception_to_api_error(exc, request_id="req-1")
    assert body.error.code == "TEST"
    assert body.request_id == "req-1"
