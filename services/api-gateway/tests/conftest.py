"""Pytest fixtures — stub orchestrator client (no Node required)."""

import os

import pytest

from app.clients import (
    StubOrchestratorClient,
    reset_orchestrator_client,
    set_orchestrator_client,
)


@pytest.fixture(autouse=True)
def _use_stub_orchestrator() -> None:
    os.environ["JARVIS_ORCHESTRATOR_CLIENT"] = "stub"
    reset_orchestrator_client()
    set_orchestrator_client(StubOrchestratorClient())
    yield
    reset_orchestrator_client()
