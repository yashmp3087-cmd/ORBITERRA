"""
SQLAlchemy ORM models for Satellite Images, Change Detections, and Search Audits.
"""

from datetime import datetime
from sqlalchemy import Column, String, Float, Integer, DateTime, JSON, Text
from .database import Base

class SatelliteImageModel(Base):
    __tablename__ = "satellite_images"

    id = Column(String(64), primary_key=True, index=True)
    location_id = Column(String(64), nullable=False, index=True)
    area_name = Column(String(255), nullable=False)
    capture_date = Column(String(32), nullable=False)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    resolution_m = Column(Float, default=10.0)
    image_filename = Column(String(255), nullable=False)
    bbox = Column(JSON, nullable=False) # [min_lat, min_lon, max_lat, max_lon]
    tags = Column(JSON, default=list)
    created_at = Column(DateTime, default=datetime.utcnow)

class ChangeDetectionRecord(Base):
    __tablename__ = "change_detections"

    id = Column(String(64), primary_key=True, index=True)
    location_id = Column(String(64), nullable=False, index=True)
    image_id_before = Column(String(64), nullable=False)
    image_id_after = Column(String(64), nullable=False)
    change_type = Column(String(64), nullable=False)
    confidence_score = Column(Float, nullable=False)
    area_sq_m = Column(Float, nullable=False)
    area_hectares = Column(Float, nullable=False)
    change_mask_url = Column(String(512), nullable=True)
    geojson = Column(JSON, nullable=True)
    breakdown = Column(JSON, nullable=True)
    detected_at = Column(DateTime, default=datetime.utcnow)

class SearchQueryRecord(Base):
    __tablename__ = "search_queries"

    id = Column(Integer, primary_key=True, autoincrement=True)
    query_text = Column(Text, nullable=False)
    parsed_intent = Column(JSON, nullable=True)
    matched_count = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)
