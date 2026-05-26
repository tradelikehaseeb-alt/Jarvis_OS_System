"""FastAPI exception handlers → ApiErrorResponse."""

import uuid

from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from starlette.exceptions import HTTPException as StarletteHTTPException

from app.error_handling.exceptions import JarvisApiException
from app.error_handling.mapper import exception_to_api_error


def _request_id(request: Request) -> str:
    return getattr(request.state, "request_id", None) or str(uuid.uuid4())


def register_exception_handlers(app: FastAPI) -> None:
    """Attach Jarvis error envelope handlers."""

    @app.exception_handler(JarvisApiException)
    async def jarvis_api_exception_handler(
        request: Request, exc: JarvisApiException
    ) -> JSONResponse:
        body = exception_to_api_error(exc, request_id=_request_id(request))
        return JSONResponse(
            status_code=exc.status_code,
            content=body.model_dump(by_alias=True),
        )

    @app.exception_handler(RequestValidationError)
    async def validation_exception_handler(
        request: Request, exc: RequestValidationError
    ) -> JSONResponse:
        jarvis_exc = JarvisApiException(
            "VALIDATION_ERROR",
            "Request validation failed",
            status_code=422,
            details={"errors": exc.errors()},
        )
        body = exception_to_api_error(jarvis_exc, request_id=_request_id(request))
        return JSONResponse(status_code=422, content=body.model_dump(by_alias=True))

    @app.exception_handler(StarletteHTTPException)
    async def http_exception_handler(
        request: Request, exc: StarletteHTTPException
    ) -> JSONResponse:
        jarvis_exc = JarvisApiException(
            "HTTP_ERROR",
            str(exc.detail),
            status_code=exc.status_code,
        )
        body = exception_to_api_error(jarvis_exc, request_id=_request_id(request))
        return JSONResponse(
            status_code=exc.status_code,
            content=body.model_dump(by_alias=True),
        )

    @app.exception_handler(RuntimeError)
    async def runtime_exception_handler(
        request: Request, exc: RuntimeError
    ) -> JSONResponse:
        jarvis_exc = JarvisApiException(
            "ORCHESTRATOR_BRIDGE_ERROR",
            str(exc),
            status_code=502,
        )
        body = exception_to_api_error(jarvis_exc, request_id=_request_id(request))
        return JSONResponse(status_code=502, content=body.model_dump(by_alias=True))
