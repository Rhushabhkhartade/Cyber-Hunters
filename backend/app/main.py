import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.v1 import auth, history, live, predictions, uploads, threat
from app.core.config import settings
from app.core.exceptions import register_exception_handlers
from app.db.mongodb import MongoDB

app = FastAPI(title=settings.app_name, debug=settings.app_debug)

allowed_origins = [
    origin.strip()
    for origin in os.getenv(
        "CORS_ORIGINS",
        "http://127.0.0.1:5173,http://localhost:5173,http://127.0.0.1:3000,http://localhost:3000",
    ).split(",")
    if origin.strip()
]
if "http://127.0.0.1:5173" not in allowed_origins:
    allowed_origins.append("http://127.0.0.1:5173")
if "http://localhost:5173" not in allowed_origins:
    allowed_origins.append("http://localhost:5173")

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

register_exception_handlers(app)

app.include_router(auth.router, prefix="/api/v1")
app.include_router(uploads.router, prefix="/api/v1")
app.include_router(live.router, prefix="/api/v1")
app.include_router(predictions.router, prefix="/api/v1")
app.include_router(history.router, prefix="/api/v1")
app.include_router(threat.router, prefix="/api/v1")


@app.on_event("startup")
async def startup_event() -> None:
    await MongoDB.connect()


@app.on_event("shutdown")
async def shutdown_event() -> None:
    await MongoDB.disconnect()


@app.get("/health")
async def health() -> dict:
    return {"success": True, "message": "SentinelAI API is running"}
