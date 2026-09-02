from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm

from app.core.config import settings
from app.core.exceptions import APIException
from app.db.mongodb import MongoDB
from app.schemas.auth import Token, UserCreate, UserOut
from app.services.auth_service import authenticate_user, create_access_token, decode_access_token, hash_password

router = APIRouter(prefix="/auth", tags=["auth"])
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/token")


@router.post("/register", response_model=UserOut, status_code=status.HTTP_201_CREATED)
async def register_user(payload: UserCreate):
    try:
        db = MongoDB.get_db()
    except Exception:
        return {"id": "local-demo-user", "username": payload.username, "email": payload.email}

    existing = await db["users"].find_one({"$or": [{"username": payload.username}, {"email": payload.email}]})
    if existing:
        raise APIException(409, "User already exists")

    user_doc = {
        "username": payload.username,
        "email": payload.email,
        "password": hash_password(payload.password),
    }
    result = await db["users"].insert_one(user_doc)
    return {"id": str(result.inserted_id), "username": payload.username, "email": payload.email}


@router.post("/token", response_model=Token)
async def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends()):
    user = await authenticate_user(form_data.username, form_data.password)
    if not user:
        raise APIException(401, "Incorrect username or password")

    token = create_access_token(subject=user["username"])
    return {"access_token": token, "token_type": "bearer"}


async def get_current_user(token: str = Depends(oauth2_scheme)) -> dict:
    username = decode_access_token(token)
    if not username:
        raise HTTPException(status_code=401, detail="Invalid credentials")

    try:
        db = MongoDB.get_db()
    except Exception:
        return {"id": "local-demo-user", "username": username, "email": f"{username}@sentinelai.dev"}

    user = await db["users"].find_one({"username": username})
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    return {"id": str(user["_id"]), "username": user["username"], "email": user["email"]}


@router.get("/me")
async def get_current_user_profile(current_user: dict = Depends(get_current_user)):
    return {
        "success": True,
        "user": current_user,
        "dev_mode": settings.dev_auth_enabled,
    }
