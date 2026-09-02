from datetime import datetime, timedelta, timezone
from typing import Any

from jose import JWTError, jwt
from passlib.context import CryptContext

from app.core.config import settings
from app.core.exceptions import APIException
from app.db.mongodb import MongoDB

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def hash_password(password: str) -> str:
    return pwd_context.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)


def create_access_token(subject: str, expires_delta: int | None = None) -> str:
    expire = datetime.now(timezone.utc) + timedelta(minutes=expires_delta or settings.access_token_expire_minutes)
    to_encode = {"sub": subject, "exp": expire}
    return jwt.encode(to_encode, settings.secret_key, algorithm=settings.algorithm)


def decode_access_token(token: str) -> str:
    try:
        payload = jwt.decode(token, settings.secret_key, algorithms=[settings.algorithm])
        return payload.get("sub")
    except JWTError as exc:
        raise APIException(401, "Invalid or expired token") from exc


async def authenticate_user(username: str, password: str) -> dict[str, Any] | None:
    if settings.dev_auth_enabled and username == settings.dev_auth_username and password == settings.dev_auth_password:
        return {
            "username": username,
            "email": f"{username}@sentinelai.dev",
            "id": "local-dev-user",
        }

    try:
        users_collection = MongoDB.get_db()["users"]
    except Exception:
        return None

    user = await users_collection.find_one({"username": username})
    if not user:
        return None
    if not verify_password(password, user["password"]):
        return None
    return user
