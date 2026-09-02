from typing import Optional
from fastapi import APIRouter, Depends, File, Form, UploadFile, status

from app.api.v1.auth import get_current_user
from app.core.exceptions import APIException
from app.schemas.analysis import (
    LiveChunkResponse,
    LiveSessionStopRequest,
    LiveSessionStopResponse,
)
from app.services.live_stream_service import LiveStreamService

router = APIRouter(prefix="/live", tags=["live"])

# Models and services loaded once on application startup, reused per chunk
live_service = LiveStreamService()


@router.post("/camera", status_code=status.HTTP_200_OK)
async def live_camera(current_user: dict = Depends(get_current_user)):
    if not current_user:
        raise APIException(401, "Authentication required")

    return {
        "success": True,
        "message": "Live camera analysis session started",
        "stream": "rtsp://localhost:8554/stream",
        "user": current_user["username"],
    }


@router.post("/audio", response_model=LiveChunkResponse, status_code=status.HTTP_200_OK)
async def live_audio_chunk(
    file: UploadFile = File(...),
    session_id: str = Form(...),
    chunk_index: int = Form(0),
    client_transcript: Optional[str] = Form(None),
    current_user: dict = Depends(get_current_user),
):
    if not current_user:
        raise APIException(401, "Authentication required")

    return await live_service.process_live_chunk(
        file=file,
        session_id=session_id,
        chunk_index=chunk_index,
        client_transcript=client_transcript,
        user_id=current_user["id"],
    )


@router.post("/session/stop", response_model=LiveSessionStopResponse, status_code=status.HTTP_200_OK)
async def stop_live_session(
    payload: LiveSessionStopRequest,
    current_user: dict = Depends(get_current_user),
):
    if not current_user:
        raise APIException(401, "Authentication required")

    data = payload.model_dump() if hasattr(payload, "model_dump") else payload.dict()
    return await live_service.stop_session(data, current_user["id"])

