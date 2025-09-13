from pydantic_settings import BaseSettings
from typing import Optional


class Settings(BaseSettings):
    # Database - Connection pooling for app, direct for migrations
    database_url: str = "postgresql://postgres:postgres@localhost:5432/career_creator"
    direct_database_url: Optional[str] = None  # For migrations
    
    # JWT
    jwt_secret: str = "your-secret-key-change-in-production"
    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = 15
    refresh_token_expire_days: int = 7
    
    # Environment
    environment: str = "development"
    
    # Supabase (Optional - if using Supabase client)
    supabase_url: Optional[str] = None
    supabase_anon_key: Optional[str] = None
    supabase_service_role_key: Optional[str] = None
    
    class Config:
        env_file = ".env"
        case_sensitive = False


settings = Settings()