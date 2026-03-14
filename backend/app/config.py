import os
from functools import lru_cache
from typing import List

from dotenv import load_dotenv
from pydantic_settings import SettingsConfigDict
from pydantic_settings import BaseSettings

load_dotenv()


class Settings(BaseSettings):
    ENVIRONMENT: str = os.getenv("ENVIRONMENT", "development")

    # API
    API_V1_STR: str = "/api/v1"
    PROJECT_NAME: str = "Coordyn"

    # Database
    # Dev default uses SQLite; production should set DATABASE_URL to PostgreSQL.
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./coordyn.db")

    # PostgreSQL pool settings (used when DATABASE_URL is postgres:// or postgresql://)
    DB_POOL_SIZE: int = int(os.getenv("DB_POOL_SIZE", "5"))
    DB_MAX_OVERFLOW: int = int(os.getenv("DB_MAX_OVERFLOW", "10"))
    DB_POOL_TIMEOUT: int = int(os.getenv("DB_POOL_TIMEOUT", "30"))

    # OpenAI
    OPENAI_API_KEY: str = os.getenv("OPENAI_API_KEY", "")
    OPENAI_MODEL: str = "gpt-4o-mini"

    # Auth
    JWT_SECRET_KEY: str = os.getenv("JWT_SECRET_KEY", "dev-insecure-secret-change-me")
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = int(
        os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "60")
    )

    # Security
    CORS_ORIGINS: str = os.getenv("CORS_ORIGINS", "http://localhost:3000")

    # Negotiation
    MAX_NEGOTIATION_ROUNDS: int = 10
    NEGOTIATION_TIMEOUT: int = 300  # seconds

    # Rate limiting
    RATE_LIMIT_PER_MINUTE: int = int(os.getenv("RATE_LIMIT_PER_MINUTE", "60"))
    RATE_LIMIT_BURST: int = int(os.getenv("RATE_LIMIT_BURST", "10"))

    model_config = SettingsConfigDict(env_file=".env")

    @property
    def is_production(self) -> bool:
        return self.ENVIRONMENT.lower() == "production"

    @property
    def cors_origins(self) -> List[str]:
        return [
            origin.strip() for origin in self.CORS_ORIGINS.split(",") if origin.strip()
        ]


@lru_cache()
def get_settings():
    s = Settings()
    if s.is_production and not s.OPENAI_API_KEY:
        raise RuntimeError("OPENAI_API_KEY is required when ENVIRONMENT=production")
    if s.is_production and s.JWT_SECRET_KEY == "dev-insecure-secret-change-me":
        raise RuntimeError("JWT_SECRET_KEY must be set to a secure value in production")
    return s


settings = get_settings()
