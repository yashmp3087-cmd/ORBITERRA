"""
Endpoints for listing and filtering satellite imagery scenes and demo scenarios.
"""

import json
import os
from typing import Optional, List
from fastapi import APIRouter, Query, HTTPException

from ..config import settings
from ..schemas import SatelliteImageItem, ScenarioItem

router = APIRouter(tags=["Satellite Images"])

def load_catalog_data():
    catalog_path = os.path.join(settings.SAMPLES_DIR, "catalog.json")
    if not os.path.exists(catalog_path):
        raise HTTPException(status_code=404, detail="Imagery catalog not initialized. Run db/seed.py.")
    with open(catalog_path, "r", encoding="utf-8") as f:
        return json.load(f)

@router.get("/images")
def list_images(
    location_id: Optional[str] = Query(None, description="Filter by location identifier (e.g. LOC_BLR)"),
    tag: Optional[str] = Query(None, description="Filter by feature tag"),
    period: Optional[str] = Query(None, description="Filter by period (e.g. T1 or T2)")
):
    """
    List and filter available satellite imagery scenes with bounding boxes and metadata.
    """
    catalog = load_catalog_data()
    scenes = catalog.get("scenes", [])
    
    # Attach public URL
    enriched = []
    for scn in scenes:
        item = dict(scn)
        item["image_url"] = f"/samples/{scn['image_filename']}"
        enriched.append(item)

    # Apply filters
    filtered = enriched
    if location_id:
        filtered = [s for s in filtered if s["location_id"].lower() == location_id.lower()]
    if tag:
        tag_lower = tag.lower()
        filtered = [s for s in filtered if any(tag_lower in t.lower() for t in s.get("tags", []))]
    if period:
        filtered = [s for s in filtered if period.lower() in s.get("period", "").lower()]

    return {
        "count": len(filtered),
        "total_available": len(enriched),
        "images": filtered
    }

@router.get("/scenarios")
def list_scenarios():
    """
    List pre-configured multi-temporal comparison scenarios for quick 1-click demonstration.
    """
    catalog = load_catalog_data()
    scenarios = catalog.get("scenarios", [])
    return {
        "count": len(scenarios),
        "scenarios": scenarios
    }
