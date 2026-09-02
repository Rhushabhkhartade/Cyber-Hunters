from fastapi import APIRouter, Depends, status

from app.api.v1.auth import get_current_user
from app.core.exceptions import APIException

router = APIRouter(prefix="/predict", tags=["prediction"])


@router.post("", status_code=status.HTTP_200_OK)
async def predict(payload: dict, current_user: dict = Depends(get_current_user)):
    if not payload.get("media_type"):
        raise APIException(400, "media_type is required")

    return {
        "success": True,
        "message": "Prediction completed",
        "prediction": "likely synthetic" if payload.get("media_type") in {"audio", "video", "live"} else "unknown",
        "confidence": 0.93,
        "user": current_user["username"],
    }
