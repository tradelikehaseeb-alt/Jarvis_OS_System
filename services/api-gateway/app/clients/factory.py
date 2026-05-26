"""
Orchestrator client factory and test injection (Phase 7).
"""

from __future__ import annotations

import os

from app.clients.local_bridge_orchestrator_client import LocalBridgeOrchestratorClient
from app.clients.orchestrator_client import OrchestratorClient
from app.clients.stub_orchestrator_client import StubOrchestratorClient

_default_client: OrchestratorClient | None = None

# JARVIS_ORCHESTRATOR_CLIENT: stub | local_bridge | node (alias for local_bridge)
_VALID_MODES = frozenset({"stub", "local_bridge", "node"})


def get_orchestrator_client() -> OrchestratorClient:
    """
    Resolve OrchestratorClient for the current process.

    - stub: StubOrchestratorClient (tests, CI)
    - local_bridge / node: LocalBridgeOrchestratorClient + LocalCliTransport
    """
    global _default_client
    if _default_client is not None:
        return _default_client

    mode = os.environ.get("JARVIS_ORCHESTRATOR_CLIENT", "local_bridge").lower()
    if mode not in _VALID_MODES:
        mode = "local_bridge"

    if mode == "stub":
        _default_client = StubOrchestratorClient()
    else:
        # node → backward-compatible alias for local CLI bridge
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
