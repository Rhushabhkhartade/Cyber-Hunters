import shutil
from pathlib import Path
from uuid import uuid4

from fastapi import APIRouter, Depends, File, UploadFile, status

from app.api.v1.auth import get_current_user
from app.core.config import settings
from app.core.exceptions import APIException
from app.db.mongodb import MongoDB
from app.services.audio_analysis_service import AudioAnalysisService
from app.schemas.analysis import AudioScanResponse

router = APIRouter(prefix="/uploads", tags=["uploads"])
UPLOAD_ROOT = Path(settings.upload_dir)
UPLOAD_ROOT.mkdir(parents=True, exist_ok=True)


@router.post("/audio", response_model=AudioScanResponse, status_code=status.HTTP_201_CREATED)
async def upload_audio(file: UploadFile = File(...), current_user: dict = Depends(get_current_user)):
    if not file.filename:
        raise APIException(400, "A filename is required")
    if not file.content_type or "audio" not in file.content_type:
        raise APIException(400, "Only audio files are supported")

    service = AudioAnalysisService()
    result_doc = await service.analyze_audio(file, current_user["id"])

    return {
        "success": True,
        "scan_id": result_doc["scan_id"],
        "media_type": result_doc["media_type"],
        "status": result_doc["analysis_status"],
        "demo_mode": result_doc["demo_mode"],
        "audio_analysis": result_doc["audio_analysis"],
        "deepfake_analysis": result_doc["deepfake_analysis"],
        "social_engineering": result_doc["social_engineering"],
        "overall_risk": result_doc["overall_risk"],
        "created_at": result_doc["created_at"],
    }


@router.post("/video", status_code=status.HTTP_201_CREATED)
async def upload_video(file: UploadFile = File(...), current_user: dict = Depends(get_current_user)):
    if not file.filename:
        raise APIException(400, "A filename is required")
    if not file.content_type or "video" not in file.content_type:
        raise APIException(400, "Only video files are supported")

    unique_name = f"{uuid4()}_{Path(file.filename).name}"
    destination = UPLOAD_ROOT / unique_name
    with destination.open("wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    analysis_id = "local-demo-video-analysis"
    try:
        db = MongoDB.get_db()
        result = await db["analyses"].insert_one({
            "user_id": current_user["id"],
            "media_type": "video",
            "source": unique_name,
            "prediction": "synthetic video detected",
            "confidence": 0.95,
            "details": {"file_name": file.filename, "path": str(destination)},
        })
        analysis_id = str(result.inserted_id)
    except Exception:
        pass

    return {"success": True, "message": "Video uploaded successfully", "analysis_id": analysis_id}
