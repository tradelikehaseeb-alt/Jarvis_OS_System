"""
HttpOrchestratorClient — production HTTP client to Jarvis orchestrator API.
"""

from __future__ import annotations

import json
import os
from collections.abc import AsyncIterator
from typing import Any

import httpx

from app.clients.orchestrator_client import model_to_bridge_payload
from app.error_handling.exceptions import JarvisApiException
from app.schemas.conversation import (
    ConversationRequestSchema,
    ConversationResponseSchema,
)
from app.schemas.tasks import (
    CreateTaskRequestSchema,
    CreateTaskResponseSchema,
    TaskStatusResponseSchema,
)

_DEFAULT_BASE_URL = "http://localhost:8787"
_TIMEOUT_SEC = 30.0
_NETWORK_RETRIES = 2


def resolve_orchestrator_base_url() -> str:
    return (
        os.environ.get("JARVIS_ORCHESTRATOR_URL", "").strip()
        or os.environ.get("ORCHESTRATOR_URL", "").strip()
        or _DEFAULT_BASE_URL
    ).rstrip("/")


def resolve_internal_token() -> str | None:
    token = os.environ.get("JARVIS_INTERNAL_TOKEN", "").strip()
    return token or None


def _auth_headers() -> dict[str, str]:
    headers = {"Content-Type": "application/json", "Accept": "application/json"}
    token = resolve_internal_token()
    if token:
        headers["X-Jarvis-Internal-Token"] = token
        headers["Authorization"] = f"Bearer {token}"
    return headers


def _map_http_error(exc: httpx.HTTPStatusError) -> JarvisApiException:
    try:
        payload = exc.response.json()
        error = payload.get("error", payload)
        code = str(error.get("code", "ORCHESTRATOR_HTTP_ERROR"))
        message = str(error.get("message", exc.response.text))
    except (json.JSONDecodeError, AttributeError, TypeError):
        code = "ORCHESTRATOR_HTTP_ERROR"
        message = f"Orchestrator HTTP {exc.response.status_code}: {exc.response.text}"

    status = exc.response.status_code
    if code == "TASK_NOT_FOUND":
        return JarvisApiException(code, message, status_code=404)
    if status == 404:
        return JarvisApiException("TASK_NOT_FOUND", message, status_code=404)
    if status >= 500:
        return JarvisApiException(code, message, status_code=502)
    return JarvisApiException(code, message, status_code=status)


def _map_connect_error(exc: httpx.RequestError) -> JarvisApiException:
    base = resolve_orchestrator_base_url()
    message = (
        f"Orchestrator is unreachable at {base}. "
        "Start the Jarvis API runtime (desktop embedded server or api-gateway) "
        f"and verify JARVIS_ORCHESTRATOR_URL. Details: {exc}"
    )
    return JarvisApiException("ORCHESTRATOR_UNAVAILABLE", message, status_code=503)


class HttpOrchestratorClient:
    """
    HTTP orchestrator client — POST/GET /tasks and SSE /tasks/{id}/stream.
    """

    def __init__(
        self,
        base_url: str | None = None,
        timeout_sec: float = _TIMEOUT_SEC,
    ) -> None:
        self._base_url = (base_url or resolve_orchestrator_base_url()).rstrip("/")
        self._timeout = httpx.Timeout(timeout_sec)

    @property
    def base_url(self) -> str:
        return self._base_url

    async def _request(
        self,
        method: str,
        path: str,
        *,
        json_body: dict[str, Any] | None = None,
    ) -> dict[str, Any]:
        url = f"{self._base_url}{path}"
        last_error: Exception | None = None

        for attempt in range(_NETWORK_RETRIES + 1):
            try:
                async with httpx.AsyncClient(timeout=self._timeout) as client:
                    response = await client.request(
                        method,
                        url,
                        headers=_auth_headers(),
                        json=json_body,
                    )
                    response.raise_for_status()
                    if not response.content:
                        return {}
                    return response.json()
            except httpx.HTTPStatusError as exc:
                raise _map_http_error(exc) from exc
            except httpx.RequestError as exc:
                last_error = exc
                if attempt < _NETWORK_RETRIES:
                    continue
                raise _map_connect_error(exc) from exc

        raise _map_connect_error(last_error or httpx.RequestError("request failed"))

    async def create_task(
        self, body: CreateTaskRequestSchema
    ) -> CreateTaskResponseSchema:
        payload = model_to_bridge_payload(body)
        data = await self._request("POST", "/tasks", json_body=payload)
        return CreateTaskResponseSchema.model_validate(data)

    async def get_task_status(self, task_id: str) -> TaskStatusResponseSchema:
        task_id = task_id.strip()
        if not task_id:
            raise JarvisApiException(
                "VALIDATION_ERROR",
                "taskId must not be empty",
                status_code=422,
            )
        data = await self._request("GET", f"/tasks/{task_id}")
        return TaskStatusResponseSchema.model_validate(data)

    async def stream_task_events(self, task_id: str) -> AsyncIterator[dict[str, Any]]:
        """Read SSE events from GET /tasks/{taskId}/stream."""
        task_id = task_id.strip()
        if not task_id:
            raise JarvisApiException(
                "VALIDATION_ERROR",
                "taskId must not be empty",
                status_code=422,
            )

        url = f"{self._base_url}/tasks/{task_id}/stream"
        headers = _auth_headers()
        headers["Accept"] = "text/event-stream"

        try:
            async with httpx.AsyncClient(timeout=None) as client:
                async with client.stream("GET", url, headers=headers) as response:
                    if response.status_code >= 400:
                        text = await response.aread()
                        raise JarvisApiException(
                            "ORCHESTRATOR_STREAM_ERROR",
                            f"Stream failed: {response.status_code} {text.decode(errors='replace')}",
                            status_code=502,
                        )

                    event_name = "message"
                    data_lines: list[str] = []

                    async for line in response.aiter_lines():
                        if line.startswith("event:"):
                            event_name = line[6:].strip() or "message"
                            continue
                        if line.startswith("data:"):
                            data_lines.append(line[5:].strip())
                            continue
                        if line == "" and data_lines:
                            raw = "\n".join(data_lines)
                            data_lines = []
                            try:
                                payload = json.loads(raw)
                            except json.JSONDecodeError:
                                payload = {"raw": raw}
                            yield {"event": event_name, "data": payload}
                            event_name = "message"
                return
        except httpx.RequestError as exc:
            raise _map_connect_error(exc) from exc

    async def send_conversation(
        self, body: ConversationRequestSchema
    ) -> ConversationResponseSchema:
        payload = {
            "message": body.message,
            "sessionId": body.session_id,
            "metadata": body.metadata,
        }
        try:
            data = await self._request("POST", "/conversations", json_body=payload)
        except JarvisApiException as exc:
            if exc.code != "NOT_FOUND":
                raise
            data = {
                "sessionId": body.session_id or "sess-default",
                "reply": f"Conversation endpoint unavailable: {body.message[:80]}",
                "createdAt": "",
            }
        return ConversationResponseSchema.model_validate(data)
