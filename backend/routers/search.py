"""
Semantic retrieval endpoint for natural language satellite imagery search.
"""

import logging
from typing import List, Dict, Any, Optional
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from ..config import settings
from ..database import get_db, POSTGIS_AVAILABLE
from ..models import SearchQueryRecord, SatelliteImageModel
from ..schemas import SearchRequest, SearchResponse
from ai_core.semantic_search import SemanticRetrievalEngine

logger = logging.getLogger("backend.routers.search")
router = APIRouter(tags=["Semantic Retrieval"])
semantic_engine = SemanticRetrievalEngine()

@router.post("/search", response_model=SearchResponse)
def semantic_search(request: SearchRequest, db: Session = Depends(get_db)):
    """
    Accepts a natural language query (e.g. 'find new buildings in Bengaluru', 'deforestation in western ghats'),
    parses spatial and thematic intent, queries database spatial/metadata indices, and returns ranked matching
    imagery scenes or geocoded navigation coordinates.
    """
    logger.info(f"[SEARCH] Step 1: Search input received -> '{request.query}'")
    
    raw_results = semantic_engine.search(query=request.query, top_k=request.top_k)
    intent = raw_results["parsed_intent"]
    geocoded = raw_results.get("geocoded_location")
    
    logger.info(
        f"[SEARCH] Step 2: Intent parsed -> change_type='{intent.get('target_change_type')}', "
        f"location='{intent.get('detected_location')}', geocoded={geocoded.get('name') if geocoded else None}"
    )

    # Step 3: Spatial and metadata database query verification
    db_matches = []
    try:
        if geocoded and geocoded.get("bbox"):
            min_lat, min_lon, max_lat, max_lon = geocoded["bbox"]
            # Query satellite_images for records overlapping the bounding box
            db_candidates = db.query(SatelliteImageModel).filter(
                SatelliteImageModel.latitude >= min_lat,
                SatelliteImageModel.latitude <= max_lat,
                SatelliteImageModel.longitude >= min_lon,
                SatelliteImageModel.longitude <= max_lon
            ).all()
            db_matches = [img.id for img in db_candidates]
            logger.info(f"[SEARCH] Step 3: DB Spatial Query -> {len(db_matches)} records matched in satellite_images table: {db_matches}")
        else:
            db_total = db.query(SatelliteImageModel).count()
            logger.info(f"[SEARCH] Step 3: DB Table Check -> {db_total} total satellite_images available in database")
    except Exception as db_err:
        logger.warning(f"[SEARCH] Step 3: DB spatial query check note: {db_err}")

    # Enrich image items with URL
    enriched_results = []
    for res in raw_results["results"]:
        scene_data = dict(res["scene"])
        scene_data["image_url"] = f"/samples/{scene_data['image_filename']}"
        enriched_results.append({
            "scene": scene_data,
            "relevance_score": res["relevance_score"],
            "confidence_percentage": res["confidence_percentage"],
            "explanation": res["explanation"]
        })

    logger.info(
        f"[SEARCH] Step 4: Results returned -> count={len(enriched_results)}, "
        f"suggested_scenario={raw_results.get('suggested_scenario', {}).get('scenario_id') if raw_results.get('suggested_scenario') else None}"
    )

    # Record search query for hackathon analytics audit
    try:
        audit = SearchQueryRecord(
            query_text=request.query,
            parsed_intent=raw_results["parsed_intent"],
            matched_count=len(enriched_results)
        )
        db.add(audit)
        db.commit()
    except Exception:
        db.rollback()

    return {
        "query": request.query,
        "parsed_intent": raw_results["parsed_intent"],
        "results_count": len(enriched_results),
        "results": enriched_results,
        "suggested_scenario": raw_results.get("suggested_scenario"),
        "geocoded_location": geocoded,
        "message": raw_results.get("message")
    }
