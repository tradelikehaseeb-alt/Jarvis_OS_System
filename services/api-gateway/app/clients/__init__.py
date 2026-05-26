"""
Internal service clients — api-gateway → orchestrator only (not memory HTTP).

Transport abstraction (Phase 7):
- StubOrchestratorClient — in-process static responses
- LocalBridgeOrchestratorClient — LocalCliTransport (temp dev; replace with HTTP/gRPC/MQ)
"""

from app.clients.factory import (
    get_orchestrator_client,
    reset_orchestrator_client,
    set_orchestrator_client,
)
from app.clients.local_bridge_orchestrator_client import LocalBridgeOrchestratorClient
from app.clients.orchestrator_client import OrchestratorClient
from app.clients.stub_orchestrator_client import StubOrchestratorClient
from app.clients.transport import LocalCliTransport, OrchestratorTransport

# Backward compatibility (Phase 6 name)
NodeOrchestratorClient = LocalBridgeOrchestratorClient

__all__ = [
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
