"""
Orchestrator transport layer — how api-gateway reaches @jarvis/orchestrator.

Phase 7: LocalCliTransport (temporary dev — subprocess + tsx CLI).

Future (not implemented): HttpTransport, GrpcTransport, MessageQueueTransport.
"""

from app.clients.transport.local_cli import LocalCliTransport
from app.clients.transport.protocol import OrchestratorTransport

__all__ = ["LocalCliTransport", "OrchestratorTransport"]
