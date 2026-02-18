# Configuration Management
# Handles environment variables and production settings

import logging
from pathlib import Path
from typing import List
try:
    from pydantic_settings import BaseSettings
except ImportError:
    try:
        from pydantic import BaseSettings
    except ImportError:
        raise ImportError(
            "pydantic-settings is required. Install it with: pip install pydantic-settings"
        )
from pydantic import Field, validator
from functools import lru_cache

logger = logging.getLogger(__name__)

# Resolve backend/.env path so it works regardless of cwd
_BACKEND_DIR = Path(__file__).resolve().parent.parent
_ENV_FILE = _BACKEND_DIR / ".env"

# Load .env into os.environ before Settings reads it (works regardless of cwd)
if _ENV_FILE.exists():
    try:
        from dotenv import load_dotenv
        load_dotenv(_ENV_FILE, override=True)
    except ImportError:
        pass


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    # Server Configuration
    host: str = Field(default="0.0.0.0", env="KUIPER_HOST")
    port: int = Field(default=8000, env="KUIPER_PORT")

    # Environment
    environment: str = Field(default="development", env="KUIPER_ENV")
    debug: bool = Field(default=False, env="KUIPER_DEBUG")

    # Supabase
    supabase_url: str = Field(default="", env="SUPABASE_URL")
    supabase_key: str = Field(default="", env="SUPABASE_KEY")

    # Security
    admin_password: str = Field(default="DovKrugersRecording", env="ADMIN_PASSWORD")
    cors_origins: List[str] = Field(
        default=[
            "http://localhost:5173",
            "http://127.0.0.1:5173",
            "http://localhost:3000",
            "http://127.0.0.1:3000",
            "https://kuiper-tts-recording.vercel.app",
        ],
        env="KUIPER_CORS_ORIGINS"
    )
    max_upload_size_mb: int = Field(default=100, env="KUIPER_MAX_UPLOAD_SIZE_MB")
    rate_limit_per_minute: int = Field(default=120, env="KUIPER_RATE_LIMIT")

    # Logging
    log_level: str = Field(default="INFO", env="KUIPER_LOG_LEVEL")

    @validator("cors_origins", pre=True)
    def parse_cors_origins(cls, v):
        if isinstance(v, str):
            origins = [o.strip() for o in v.split(",") if o.strip()]
            if not origins:
                return [
                    "http://localhost:5173",
                    "http://127.0.0.1:5173",
                    "https://kuiper-tts-recording.vercel.app",
                ]
            return origins
        return v

    @property
    def is_production(self) -> bool:
        return self.environment.lower() == "production"

    @property
    def is_development(self) -> bool:
        return self.environment.lower() == "development"

    class Config:
        env_file = str(_ENV_FILE) if _ENV_FILE.exists() else ".env"
        env_file_encoding = "utf-8"
        case_sensitive = False


@lru_cache()
def get_settings() -> Settings:
    """Get cached settings instance."""
    return Settings()
