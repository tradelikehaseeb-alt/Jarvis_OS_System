"""
Local CLI transport — TEMPORARY development transport (Phase 7).

Spawns `npx tsx orchestrator-bridge/cli.ts` which calls createOrchestratorService().
This is not suitable for production: no connection pooling, cold start per request,
and tight coupling to the monorepo filesystem layout.

Replace with HttpTransport / GrpcTransport / MessageQueueTransport when the
orchestrator runs as a standalone service.
"""

from __future__ import annotations

import asyncio
import json
from pathlib import Path
from typing import Any

# api-gateway/app/clients/transport/local_cli.py → repo root = parents[4]
_API_GATEWAY_ROOT = Path(__file__).resolve().parents[3]
_REPO_ROOT = _API_GATEWAY_ROOT.parent.parent
_BRIDGE_CLI = _API_GATEWAY_ROOT / "orchestrator-bridge" / "cli.ts"


class LocalCliTransport:
    """
    Development-only transport: stdin/stdout JSON RPC via Node tsx subprocess.

    Do not use in production deployments.
    """

    def __init__(
        self,
        *,
        cli_path: Path = _BRIDGE_CLI,
        repo_root: Path = _REPO_ROOT,
    ) -> None:
        self._cli_path = cli_path
        self._repo_root = repo_root

    async def invoke(self, method: str, payload: dict[str, Any]) -> dict[str, Any]:
        """Run orchestrator-bridge CLI and parse JSON stdout."""
        proc = await asyncio.create_subprocess_exec(
            "npx",
            "tsx",
            str(self._cli_path),
            method,
            cwd=str(self._repo_root),
            stdin=asyncio.subprocess.PIPE,
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE,
        )
        stdout, stderr = await proc.communicate(
            json.dumps(payload).encode("utf-8"),
        )
        if proc.returncode != 0:
            err_text = stderr.decode("utf-8").strip()
            if err_text:
                try:
                    err_body = json.loads(err_text)
                    code = err_body.get("code", "BRIDGE_ERROR")
                    message = err_body.get("message", err_text)
                    raise RuntimeError(json.dumps({"code": code, "message": message}))
                except json.JSONDecodeError:
                    pass
            raise RuntimeError(
                err_text or "Orchestrator local CLI transport failed",
            )
        return json.loads(stdout.decode("utf-8"))
