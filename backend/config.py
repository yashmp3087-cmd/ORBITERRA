"""
Application configuration and environment variables.
"""

import os
from pydantic import BaseModel

class Settings(BaseModel):
    PROJECT_NAME: str = "Semantic Satellite Change Analysis API"
    VERSION: str = "1.0.0"
    API_PREFIX: str = "/api"
    
    # Database Settings (PostgreSQL + PostGIS)
    DATABASE_URL: str = os.getenv(
        "DATABASE_URL", 
        "postgresql://postgres:postgres@localhost:5432/satellite_db"
    )
    
    # Base paths
    BASE_DIR: str = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
    SAMPLES_DIR: str = os.path.join(BASE_DIR, "samples")
    STATIC_DIR: str = os.path.join(BASE_DIR, "static")
    MASKS_DIR: str = os.path.join(STATIC_DIR, "masks")
    
    # CORS
    CORS_ORIGINS: list = [
        "http://localhost:5173",
        "http://localhost:3000",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:3000",
        "*"
    ]

settings = Settings()
os.makedirs(settings.STATIC_DIR, exist_ok=True)
os.makedirs(settings.MASKS_DIR, exist_ok=True)
