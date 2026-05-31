"""
Dashboard and data routes for desktop loaders.
"""

from __future__ import annotations

import os
from datetime import datetime, timezone
from typing import Any

import httpx
from fastapi import APIRouter, Query
from fastapi.responses import JSONResponse

api_data_router = APIRouter(tags=["data"])


def _utc_now() -> str:
    return datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%S.000Z")


def _memory_base_url() -> str:
    return os.environ.get("MEMORY_SERVICE_URL", "http://localhost:8001").rstrip("/")


@api_data_router.get("/api/dashboard")
async def get_dashboard() -> dict[str, Any]:
    """Aggregate dashboard snapshot for desktop UI."""
    memory_url = _memory_base_url()
    facts_count = 0
    memory_status = "unknown"

    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            response = await client.get(f"{memory_url}/memory/facts")
            if response.status_code == 200:
                payload = response.json()
                facts = payload.get("facts", [])
                facts_count = len(facts) if isinstance(facts, list) else 0
                memory_status = "ok"
            else:
                memory_status = "degraded"
    except httpx.RequestError:
        memory_status = "down"

    return {
        "status": "ok",
        "orchestratorUrl": os.environ.get(
            "JARVIS_ORCHESTRATOR_URL", "http://localhost:8787"
        ),
        "memoryServiceUrl": memory_url,
        "memoryStatus": memory_status,
        "factsCount": facts_count,
        "activeTasks": 0,
        "checkedAt": _utc_now(),
    }


@api_data_router.get("/tasks/recent")
async def get_recent_tasks(
    limit: int = Query(default=10, ge=1, le=50),
) -> dict[str, Any]:
    """Recent tasks placeholder — extended when task store HTTP is available."""
    return {
        "tasks": [],
        "limit": limit,
        "source": "api-gateway",
        "checkedAt": _utc_now(),
    }


@api_data_router.get("/memory/facts")
async def proxy_memory_facts(
    user_id: str = Query(default="default", alias="userId"),
) -> JSONResponse:
    """Proxy user facts from Jarvis Memory Service."""
    url = f"{_memory_base_url()}/memory/facts"
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.get(url, params={"userId": user_id})
            return JSONResponse(
                status_code=response.status_code,
                content=response.json(),
            )
    except httpx.RequestError as exc:
        return JSONResponse(
            status_code=503,
            content={
                "error": {
                    "code": "MEMORY_SERVICE_UNAVAILABLE",
                    "message": f"Memory service unreachable at {_memory_base_url()}: {exc}",
                }
            },
        )
