"""
Production orchestrator client — HTTP to Jarvis API (default).

Legacy in-process stub: stub_orchestrator_client_legacy.StubOrchestratorClient
"""

from app.clients.http_orchestrator_client import HttpOrchestratorClient
from app.clients.stub_orchestrator_client_legacy import (
    StubOrchestratorClient as StubOrchestratorClientLegacy,
)

# Backward-compatible export name used in tests.
StubOrchestratorClient = StubOrchestratorClientLegacy

__all__ = ["HttpOrchestratorClient", "StubOrchestratorClient", "StubOrchestratorClientLegacy"]
