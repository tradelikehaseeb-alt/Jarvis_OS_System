"""
Orchestrator client factory and test injection (Phase 7).
"""

from __future__ import annotations

import os

from app.clients.http_orchestrator_client import HttpOrchestratorClient
from app.clients.local_bridge_orchestrator_client import LocalBridgeOrchestratorClient
from app.clients.orchestrator_client import OrchestratorClient
from app.clients.stub_orchestrator_client_legacy import StubOrchestratorClient

_default_client: OrchestratorClient | None = None

# JARVIS_ORCHESTRATOR_CLIENT: stub | http | local_bridge | node
_VALID_MODES = frozenset({"stub", "http", "local_bridge", "node"})


def get_orchestrator_client() -> OrchestratorClient:
    """
    Resolve OrchestratorClient for the current process.

    - stub: StubOrchestratorClient (tests, CI)
    - http: HttpOrchestratorClient → JARVIS_ORCHESTRATOR_URL (default :8787)
    - local_bridge / node: LocalBridgeOrchestratorClient + LocalCliTransport
    """
    global _default_client
    if _default_client is not None:
        return _default_client

    mode = os.environ.get("JARVIS_ORCHESTRATOR_CLIENT", "http").lower()
    if mode not in _VALID_MODES:
        mode = "http"

    if mode == "stub":
        _default_client = StubOrchestratorClient()
    elif mode == "http":
        _default_client = HttpOrchestratorClient()
    else:
        _default_client = LocalBridgeOrchestratorClient()

    return _default_client


def reset_orchestrator_client() -> None:
    """Reset singleton (tests)."""
    global _default_client
    _default_client = None


def set_orchestrator_client(client: OrchestratorClient) -> None:
    """Inject client (tests)."""
    global _default_client
    _default_client = client
