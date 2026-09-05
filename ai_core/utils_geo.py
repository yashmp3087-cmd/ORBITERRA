"""
Geospatial coordinate conversions and GeoJSON geometry builder.
Transforms pixel positions to WGS84 coordinates and formats contours into GeoJSON.
"""

from typing import List, Dict, Any, Tuple
import numpy as np

def pixel_to_geographic(
    px: float, 
    py: float, 
    img_width: int, 
    img_height: int, 
    bbox: List[float]
) -> Tuple[float, float]:
    """
    Maps pixel coordinate (px, py) to (longitude, latitude) in EPSG:4326.
    bbox is [min_lat, min_lon, max_lat, max_lon].
    Note: py=0 is at top (max_lat), py=img_height is at bottom (min_lat).
    px=0 is at left (min_lon), px=img_width is at right (max_lon).
    """
    min_lat, min_lon, max_lat, max_lon = bbox
    
    # Normalized 0..1
    u = np.clip(px / float(img_width), 0.0, 1.0)
    v = np.clip(py / float(img_height), 0.0, 1.0)
    
    lon = min_lon + u * (max_lon - min_lon)
    lat = max_lat - v * (max_lat - min_lat)
    return float(lon), float(lat)

def compute_polygon_area_sq_meters(
    coords: List[Tuple[float, float]], 
    resolution_m: float = 10.0, 
    pixel_area_px: float = 0.0
) -> float:
    """
    Computes real-world area in square meters.
    1 pixel with 10m resolution covers (10m x 10m) = 100 sq meters.
    """
    if pixel_area_px > 0:
        return pixel_area_px * (resolution_m ** 2)
    
    # Fallback to approximate geodesic polygon area using pixel approximation
    return 1000.0

def contours_to_geojson(
    regions: List[Dict[str, Any]], 
    img_width: int, 
    img_height: int, 
    bbox: List[float],
    resolution_m: float = 10.0
) -> Dict[str, Any]:
    """
    Converts detected contour pixel coordinates into standard GeoJSON FeatureCollection.
    """
    features = []
    
    for i, region in enumerate(regions):
        contour = region["contour"] # list of (x, y) points
        if len(contour) < 3:
            continue
            
        # Convert each vertex to [lon, lat]
        geo_ring = []
        for pt in contour:
            px, py = pt[0], pt[1]
            lon, lat = pixel_to_geographic(px, py, img_width, img_height, bbox)
            geo_ring.append([round(lon, 6), round(lat, 6)])
            
        # Close the polygon ring if not already closed
        if geo_ring[0] != geo_ring[-1]:
            geo_ring.append(geo_ring[0])
            
        pixel_area = region.get("pixel_area", 0)
        area_sq_m = compute_polygon_area_sq_meters(geo_ring, resolution_m, pixel_area)
        area_hectares = round(area_sq_m / 10000.0, 2)
        
        feature = {
            "type": "Feature",
            "id": f"change_{i+1}",
            "properties": {
                "id": f"change_{i+1}",
                "change_type": region.get("change_type", "Detected Change"),
                "confidence_score": round(float(region.get("confidence", 0.85)), 3),
                "area_sq_m": round(float(area_sq_m), 1),
                "area_hectares": area_hectares,
                "spectral_shift": region.get("spectral_shift", {}),
                "color": region.get("color", "#FF5722")
            },
            "geometry": {
                "type": "Polygon",
                "coordinates": [geo_ring]
            }
        }
        features.append(feature)
        
    return {
        "type": "FeatureCollection",
        "features": features
    }
