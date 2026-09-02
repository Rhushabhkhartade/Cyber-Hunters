from functools import lru_cache
from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=Path(__file__).resolve().parents[2] / ".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    app_name: str = "SentinelAI API"
    app_env: str = "development"
    app_debug: bool = True
    secret_key: str = "change-me"
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 60
    mongo_uri: str = "mongodb://localhost:27017"
    mongo_db_name: str = "sentinelai"
    upload_dir: str = "uploads"
    max_audio_upload_mb: int = 25
    dev_auth_enabled: bool = False
    dev_auth_username: str = "demo"
    dev_auth_password: str = "demo123"
    supabase_url: str = ""
    supabase_key: str = ""


@lru_cache()
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
