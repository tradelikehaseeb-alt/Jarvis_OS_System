"""
Route modules — Phase 3 structure only.

Phase 4: register handlers on routers and include in app.main.
"""

from app.routes.api_data import api_data_router
from app.routes.conversations import conversations_router
from app.routes.tasks import tasks_router

__all__ = ["api_data_router", "conversations_router", "tasks_router"]
