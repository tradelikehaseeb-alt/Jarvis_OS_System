"""
Internal service clients — api-gateway → orchestrator only (not memory HTTP).

Transport abstraction (Phase 7):
- HttpOrchestratorClient — HTTP to JARVIS_ORCHESTRATOR_URL (production)
- StubOrchestratorClient — in-process static responses (tests)
- LocalBridgeOrchestratorClient — LocalCliTransport (local dev CLI bridge)
"""

from app.clients.factory import (
    get_orchestrator_client,
    reset_orchestrator_client,
    set_orchestrator_client,
)
from app.clients.http_orchestrator_client import HttpOrchestratorClient
from app.clients.local_bridge_orchestrator_client import LocalBridgeOrchestratorClient
from app.clients.orchestrator_client import OrchestratorClient
from app.clients.stub_orchestrator_client_legacy import StubOrchestratorClient
from app.clients.transport import LocalCliTransport, OrchestratorTransport

# Backward compatibility (Phase 6 name)
NodeOrchestratorClient = LocalBridgeOrchestratorClient

__all__ = [
    "HttpOrchestratorClient",
    "LocalBridgeOrchestratorClient",
    "LocalCliTransport",
    "NodeOrchestratorClient",
    "OrchestratorClient",
    "OrchestratorTransport",
    "StubOrchestratorClient",
    "get_orchestrator_client",
    "reset_orchestrator_client",
    "set_orchestrator_client",
]
