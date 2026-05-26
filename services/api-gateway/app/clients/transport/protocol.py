"""
Orchestrator transport protocol — replaceable wire layer (Phase 7).

Implementations map api-gateway operations to the orchestrator runtime.
"""

from __future__ import annotations

from typing import Any, Protocol


class OrchestratorTransport(Protocol):
    """
    Low-level transport for orchestrator RPC-style calls.

    Future replacements:
    - HTTP REST to `services/orchestrator` host
    - gRPC OrchestratorService stub
    - Message queue (e.g. task commands on a bus)
    """

    async def invoke(self, method: str, payload: dict[str, Any]) -> dict[str, Any]:
        """
        Invoke an orchestrator bridge method and return a JSON-serializable dict.

        :param method: Bridge operation name (e.g. createTask, getTaskStatus).
        :param payload: Request body aligned with @jarvis/types contracts.
        """
        ...
