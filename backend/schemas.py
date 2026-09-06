"""
Pydantic schemas for API request and response validation.
"""

from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field

class SearchRequest(BaseModel):
    query: str = Field(..., example="find new buildings near the river")
    top_k: int = Field(default=4, ge=1, le=20)

class SatelliteImageItem(BaseModel):
    id: str
    location_id: str
    area_name: str
    capture_date: str
    latitude: float
    longitude: float
    resolution_m: float
    image_filename: str
    image_url: str
    bbox: List[float]
    tags: List[str]
    period: Optional[str] = None

class SearchResultItem(BaseModel):
    scene: SatelliteImageItem
    relevance_score: float
    confidence_percentage: str
    explanation: str

class ScenarioItem(BaseModel):
    scenario_id: str
    title: str
    location_name: str
    location_id: str
    image_id_before: str
    image_id_after: str
    primary_change_type: str
    description: str

class SearchResponse(BaseModel):
    query: str
    parsed_intent: Dict[str, Any]
    results_count: int
    results: List[SearchResultItem]
    suggested_scenario: Optional[ScenarioItem] = None
    geocoded_location: Optional[Dict[str, Any]] = None
    message: Optional[str] = None

class CompareRequest(BaseModel):
    image_id_before: Optional[str] = Field(None, example="IMG_BLR_2021")
    image_id_after: Optional[str] = Field(None, example="IMG_BLR_2024")
    location_id: Optional[str] = Field(None, example="LOC_BLR")
    scenario_id: Optional[str] = Field(None, example="SCN_URBAN")
    custom_bbox: Optional[List[float]] = Field(None, example=[12.965, 77.720, 12.978, 77.735])
    custom_geometry: Optional[Dict[str, Any]] = Field(None, description="GeoJSON geometry of custom selection")
    target_change_type: Optional[str] = Field(None, description="Target change category like Road Development or Water Body Shrinkage")

class TimelineEventItem(BaseModel):
    date: str
    change_type: str
    area_hectares: float
    confidence: float
    notes: str
    badge_color: Optional[str] = None
    is_custom: Optional[bool] = False

class TimelineQueryRequest(BaseModel):
    location_id: Optional[str] = None
    custom_bbox: Optional[List[float]] = None
    custom_geometry: Optional[Dict[str, Any]] = None

class CompareResponse(BaseModel):
    id: str
    location_id: str
    location_name: str
    image_id_before: str
    image_id_after: str
    image_before_url: str
    image_after_url: str
    primary_change_type: str
    overall_confidence: float
    confidence_percentage: str
    total_area_sq_m: float
    total_area_hectares: float
    regions_count: int
    mask_url: str
    breakdown: Dict[str, float]
    geojson: Dict[str, Any]
    detected_at: str
    is_custom_selection: Optional[bool] = False
    custom_bbox: Optional[List[float]] = None
    timeline_events: Optional[List[TimelineEventItem]] = None
    centroid_lat: Optional[float] = None
    centroid_lng: Optional[float] = None
    google_maps_url: Optional[str] = None
    google_earth_url: Optional[str] = None
    raster_bounds: Optional[List[float]] = None

class ChangeHistoryItem(BaseModel):
    date: str
    change_type: str
    area_hectares: float
    confidence: float
    notes: str
    badge_color: Optional[str] = None

class LocationChangesResponse(BaseModel):
    location_id: str
    location_name: str
    latitude: float
    longitude: float
    total_historical_events: int
    timeline: List[ChangeHistoryItem]
    summary_chart_data: List[Dict[str, Any]]
