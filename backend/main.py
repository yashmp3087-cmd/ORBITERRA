"""
FastAPI application entrypoint for Semantic Retrieval & Multi-Temporal Change Analysis of Satellite Imagery.
Smart India Hackathon Prototype Backend.
"""

import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from .config import settings
from .database import Base, engine
from .routers import search, compare, images, changes

# Ensure database tables exist
try:
    Base.metadata.create_all(bind=engine)
except Exception as e:
    print(f"Warning creating database tables: {e}")

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="Smart India Hackathon Full-Stack Prototype for Satellite Semantic Search & Multi-Temporal Change Detection"
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount static directories for satellite samples and generated masks
app.mount("/samples", StaticFiles(directory=settings.SAMPLES_DIR), name="samples")
app.mount("/static", StaticFiles(directory=settings.STATIC_DIR), name="static")

# Include routers under /api as well as root to satisfy both prompt endpoint specs
app.include_router(search.router, prefix="/api")
app.include_router(search.router)

app.include_router(compare.router, prefix="/api")
app.include_router(compare.router)

app.include_router(images.router, prefix="/api")
app.include_router(images.router)

app.include_router(changes.router, prefix="/api")
app.include_router(changes.router)

@app.get("/")
def health_check():
    return {
        "status": "online",
        "service": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "endpoints": [
            "POST /api/search (or /search)",
            "POST /api/compare (or /compare)",
            "GET /api/images (or /images)",
            "GET /api/changes/{location_id} (or /changes/{location_id})",
            "GET /api/scenarios",
            "GET /api/stats"
        ]
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.main:app", host="0.0.0.0", port=8000, reload=True)
