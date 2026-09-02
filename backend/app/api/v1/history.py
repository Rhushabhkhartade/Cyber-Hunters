from fastapi import APIRouter, Depends, status

from app.api.v1.auth import get_current_user
from app.db.mongodb import MongoDB

router = APIRouter(prefix="/history", tags=["history"])


@router.get("", status_code=status.HTTP_200_OK)
async def get_history(current_user: dict = Depends(get_current_user)):
    try:
        db = MongoDB.get_db()
    except Exception:
        return {"success": True, "items": []}

    results = []
    async for item in db["analyses"].find({"user_id": current_user["id"]}).sort("_id", -1):
        results.append({
            "id": str(item["_id"]),
            "media_type": item.get("media_type"),
            "source": item.get("source"),
            "prediction": item.get("prediction"),
            "confidence": item.get("confidence"),
            "details": item.get("details"),
        })
    return {"success": True, "items": results}
