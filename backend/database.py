"""
Database engine and session management.
Supports PostgreSQL + PostGIS with graceful fallback for standalone demo execution.
"""

import json
import os
import logging
from typing import Generator
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

from .config import settings

logger = logging.getLogger("backend.database")

Base = declarative_base()

# Attempt to configure PostgreSQL, otherwise fallback to SQLite / Catalog Store
engine = None
SessionLocal = None
POSTGIS_AVAILABLE = False

try:
    db_url = os.getenv("DATABASE_URL")
    if db_url and "postgresql" in db_url:
        test_engine = create_engine(
            db_url, 
            connect_args={"connect_timeout": 1},
            pool_pre_ping=True
        )
        with test_engine.connect():
            pass
        engine = test_engine
        SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
        POSTGIS_AVAILABLE = True
        logger.info("Connected to PostgreSQL / PostGIS database.")
    else:
        logger.info("Using standalone demo storage engine.")
except Exception as e:
    logger.warning(f"PostgreSQL connection check ({e}). Using standalone demo storage.")

if not POSTGIS_AVAILABLE:
    # Use SQLite for standalone portable demo operation
    fallback_db_path = os.path.join(settings.BASE_DIR, "db", "demo_store.sqlite")
    engine = create_engine(f"sqlite:///{fallback_db_path}", connect_args={"check_same_thread": False})
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def get_db() -> Generator:
    """FastAPI database session dependency."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
