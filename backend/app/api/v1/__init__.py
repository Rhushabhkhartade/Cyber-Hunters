from .auth import router as auth_router
from .history import router as history_router
from .live import router as live_router
from .predictions import router as predictions_router
from .uploads import router as uploads_router
from .threat import router as threat_router

__all__ = ["auth_router", "history_router", "live_router", "predictions_router", "uploads_router", "threat_router"]
