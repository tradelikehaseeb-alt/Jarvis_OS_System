"""
Jarvis API Gateway — Phase 14: routes → controllers → orchestrator → agents → skills.

No authentication, database, memory HTTP, LLM, or real automation.
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.error_handling.handlers import register_exception_handlers
from app.middleware.request_context import register_request_context_middleware
from app.routes import api_data_router, conversations_router, tasks_router


def create_app() -> FastAPI:
    """Build FastAPI app with orchestrator-backed routes."""
    application = FastAPI(
        title="Jarvis API Gateway",
        version="0.14.0",
        description="HTTP boundary: UI → orchestrator → agents → skills",
    )

    application.add_middleware(
        CORSMiddleware,
        allow_origins=["http://localhost:3000", "http://localhost:5173"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    register_request_context_middleware(application)
    register_exception_handlers(application)

    application.include_router(tasks_router)
    application.include_router(conversations_router)
    application.include_router(api_data_router)

    return application


app = create_app()
