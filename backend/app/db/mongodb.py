from motor.motor_asyncio import AsyncIOMotorClient

from app.core.config import settings


class MongoDB:
    client: AsyncIOMotorClient | None = None
    db = None

    @classmethod
    async def connect(cls) -> None:
        if cls.client is None:
            try:
                cls.client = AsyncIOMotorClient(settings.mongo_uri, serverSelectionTimeoutMS=2000, connectTimeoutMS=2000)
                cls.db = cls.client[settings.mongo_db_name]
                await cls.db.command("ping")
            except Exception:
                cls.client = None
                cls.db = None

    @classmethod
    async def disconnect(cls) -> None:
        if cls.client is not None:
            cls.client.close()
            cls.client = None
            cls.db = None

    @classmethod
    def get_db(cls):
        if cls.db is None:
            raise RuntimeError("Database is not connected")
        return cls.db
