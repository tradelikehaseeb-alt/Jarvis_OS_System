"""Request context middleware — attaches request_id for error envelopes."""

import uuid

from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response


class RequestContextMiddleware(BaseHTTPMiddleware):
    """Sets request.state.request_id for ApiErrorResponse."""

    async def dispatch(self, request: Request, call_next) -> Response:
        request.state.request_id = request.headers.get("x-request-id") or str(
            uuid.uuid4()
        )
        return await call_next(request)


def register_request_context_middleware(app) -> None:
    app.add_middleware(RequestContextMiddleware)
