"""
Integration test suite for FastAPI backend endpoints.
Verifies /api/images, /api/search, /api/compare, and /api/changes/{location_id}.
"""

import sys
import os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from fastapi.testclient import TestClient
from backend.main import app

client = TestClient(app)

def test_health():
    res = client.get("/")
    assert res.status_code == 200
    assert res.json()["status"] == "online"
    print("Health check passed.")

def test_list_images():
    res = client.get("/api/images")
    assert res.status_code == 200
    data = res.json()
    assert data["count"] == 8
    print("GET /api/images passed with", data["count"], "images.")

def test_semantic_search():
    res = client.post("/api/search", json={"query": "find new buildings in Bengaluru tech corridor", "top_k": 3})
    assert res.status_code == 200
    data = res.json()
    assert data["parsed_intent"]["target_change_type"] == "New Construction"
    assert len(data["results"]) > 0
    print("POST /api/search passed. Top match:", data["results"][0]["scene"]["area_name"])

def test_compare_pipeline():
    res = client.post("/api/compare", json={"scenario_id": "SCN_URBAN"})
    assert res.status_code == 200
    data = res.json()
    assert data["primary_change_type"] in [
        "New Construction", 
        "Agricultural land converted to buildings", 
        "New buildings/houses", 
        "New industrial/commercial areas"
    ]
    assert "mask_url" in data
    assert len(data["geojson"]["features"]) > 0
    print("POST /api/compare passed. Detected:", data["primary_change_type"], "Confidence:", data["confidence_percentage"])

def test_location_changes():
    res = client.get("/api/changes/LOC_BLR")
    assert res.status_code == 200
    data = res.json()
    assert len(data["timeline"]) > 0
    assert len(data["summary_chart_data"]) > 0
    print("GET /api/changes/LOC_BLR passed with", len(data["timeline"]), "timeline events.")

def test_custom_area_compare():
    custom_bbox = [12.965, 77.720, 12.978, 77.735]
    res = client.post("/api/compare", json={"custom_bbox": custom_bbox})
    assert res.status_code == 200
    data = res.json()
    assert data["is_custom_selection"] is True
    assert data["custom_bbox"] == custom_bbox
    assert "timeline_events" in data
    assert len(data["timeline_events"]) > 0
    assert "google_maps_url" in data and "google.com/maps" in data["google_maps_url"]
    assert "centroid_lat" in data and data["centroid_lat"] > 0
    assert "raster_bounds" in data and len(data["raster_bounds"]) == 4
    print("POST /api/compare with custom_bbox & GPS passed! Centroid:", data["centroid_lat"], data["centroid_lng"], "Maps URL:", data["google_maps_url"])

def test_timeline_query():
    res = client.post("/api/changes/timeline", json={"location_id": "LOC_BLR", "custom_bbox": [12.965, 77.720, 12.978, 77.735]})
    assert res.status_code == 200
    data = res.json()
    assert data["is_custom_selection"] is True
    assert len(data["timeline_events"]) >= 4
    # verify date is >= 2021
    for evt in data["timeline_events"]:
        assert evt["date"] >= "2021-01"
    print("POST /api/changes/timeline passed! 2021-to-current events verified.")

def test_search_unseeded_no_fallback():
    """Verify searching for an unseeded city (Mumbai) never silently defaults to Bengaluru."""
    res = client.post("/api/search", json={"query": "new construction in Mumbai", "top_k": 3})
    assert res.status_code == 200
    data = res.json()
    assert data["suggested_scenario"] is None, "Must not silently default to demo scenario!"
    assert data["results_count"] == 0, "Must not return irrelevant Bengaluru scenes for Mumbai!"
    assert data["geocoded_location"] is not None
    assert "Mumbai" in data["geocoded_location"]["name"]
    assert data["geocoded_location"]["has_catalog_imagery"] is False
    assert "No multi-temporal satellite imagery pairs" in data["message"]
    print("POST /api/search unseeded test passed! No silent demo fallback for Mumbai.")

def test_custom_area_outside_catalog():
    """Verify drawing a custom bbox in a new area (Mumbai harbor) returns true centroid and metrics."""
    mumbai_bbox = [18.95, 72.82, 18.98, 72.85]
    res = client.post("/api/compare", json={"custom_bbox": mumbai_bbox})
    assert res.status_code == 200
    data = res.json()
    assert data["is_custom_selection"] is True
    assert data["custom_bbox"] == mumbai_bbox
    assert round(data["centroid_lat"], 3) == 18.965
    assert round(data["centroid_lng"], 3) == 72.835
    assert "18.965,72.835" in data["google_maps_url"]
    assert data["total_area_hectares"] > 0
    assert data["image_before_url"] == ""
    assert data["image_after_url"] == ""
    print("POST /api/compare custom bbox outside catalog passed! Centroid:", data["centroid_lat"], data["centroid_lng"])

def test_search_chicago_no_fallback():
    """Verify searching for Chicago with building keywords never returns Bengaluru."""
    res = client.post("/api/search", json={"query": "Find new buildings in Chicago", "top_k": 3})
    assert res.status_code == 200
    data = res.json()
    assert data["suggested_scenario"] is None, "Must not suggest SCN_URBAN (Bengaluru) for Chicago!"
    assert data["results_count"] == 0, "Must not return Bengaluru catalog scenes for Chicago!"
    assert data["geocoded_location"] is not None
    assert "Chicago" in data["geocoded_location"]["name"]
    print("POST /api/search Chicago test passed! 0 demo scenes returned, correctly geocoded to Chicago.")

def test_search_borneo_no_fallback():
    """Verify searching for deforestation in Borneo never returns Western Ghats."""
    res = client.post("/api/search", json={"query": "Deforestation in Borneo", "top_k": 3})
    assert res.status_code == 200
    data = res.json()
    assert data["suggested_scenario"] is None, "Must not suggest SCN_FOREST (Western Ghats) for Borneo!"
    assert data["results_count"] == 0, "Must not return Western Ghats scenes for Borneo!"
    assert data["geocoded_location"] is not None
    assert "Borneo" in data["geocoded_location"]["name"]
    print("POST /api/search Borneo test passed! 0 demo scenes returned, correctly geocoded to Borneo.")

def test_custom_location_changes_no_blr_fallback():
    """Verify GET /api/changes/{location_id} with custom ID does not return Bengaluru timeline/chart."""
    res = client.get("/api/changes/CUSTOM_1895_7282")
    assert res.status_code == 200
    data = res.json()
    assert data["location_id"] == "CUSTOM_1895_7282"
    assert data["total_historical_events"] == 0
    assert data["timeline"] == []
    assert data["summary_chart_data"] == []
    print("GET /api/changes/CUSTOM_... passed without fallback to Bengaluru.")

def test_compare_invalid_raises_error():
    """Verify calling /api/compare without valid parameters raises 400 instead of returning Bengaluru."""
    res = client.post("/api/compare", json={})
    assert res.status_code == 400
    print("POST /api/compare empty payload correctly rejected with 400.")

def test_custom_polygon_different_outputs():
    """Verify drawing two different areas produces distinct, area-scoped detection outputs without demo PNGs."""
    box_a = [19.070, 72.870, 19.100, 72.900]
    box_b = [28.610, 77.200, 28.650, 77.240]

    res_a = client.post("/api/compare", json={"custom_bbox": box_a})
    res_b = client.post("/api/compare", json={"custom_bbox": box_b})

    assert res_a.status_code == 200
    assert res_b.status_code == 200

    data_a = res_a.json()
    data_b = res_b.json()

    # Neither should ever return static Bengaluru sample PNGs
    assert data_a["image_before_url"] == "", "Must not return demo PNG for custom box A"
    assert data_a["image_after_url"] == "", "Must not return demo PNG for custom box A"
    assert data_b["image_before_url"] == "", "Must not return demo PNG for custom box B"
    assert data_b["image_after_url"] == "", "Must not return demo PNG for custom box B"

    # Must contain real distinct GeoJSON features
    assert len(data_a["geojson"]["features"]) > 0
    assert len(data_b["geojson"]["features"]) > 0

    # Verify coordinates of features in A are within box A
    for feat in data_a["geojson"]["features"]:
        ring = feat["geometry"]["coordinates"][0]
        for pt in ring:
            lon, lat = pt[0], pt[1]
            assert box_a[0] <= lat <= box_a[2], f"Feature coord {lat} outside box A lat bounds"
            assert box_a[1] <= lon <= box_a[3], f"Feature coord {lon} outside box A lon bounds"

    # Verify coordinates of features in B are within box B
    for feat in data_b["geojson"]["features"]:
        ring = feat["geometry"]["coordinates"][0]
        for pt in ring:
            lon, lat = pt[0], pt[1]
            assert box_b[0] <= lat <= box_b[2], f"Feature coord {lat} outside box B lat bounds"
            assert box_b[1] <= lon <= box_b[3], f"Feature coord {lon} outside box B lon bounds"

    # Features across A and B must be completely different
    coords_a = data_a["geojson"]["features"][0]["geometry"]["coordinates"]
    coords_b = data_b["geojson"]["features"][0]["geometry"]["coordinates"]
    assert coords_a != coords_b, "Features in box A and box B must be different!"

    print("POST /api/compare custom polygon distinct outputs verified!")

def test_custom_polygon_geometry_accepted():
    """Verify custom_geometry polygon is processed properly."""
    custom_geom = {
        "type": "Polygon",
        "coordinates": [[
            [72.875, 19.075],
            [72.895, 19.075],
            [72.895, 19.095],
            [72.875, 19.095],
            [72.875, 19.075]
        ]]
    }
    res = client.post("/api/compare", json={
        "custom_bbox": [19.075, 72.875, 19.095, 72.895],
        "custom_geometry": custom_geom
    })
    assert res.status_code == 200
    data = res.json()
    assert data["is_custom_selection"] is True
    assert len(data["geojson"]["features"]) > 0
    print("POST /api/compare with custom_geometry verified successfully!")

def test_reverse_geocoding():
    """Verify reverse geocoding returns a readable place name."""
    res = client.get("/api/geocode/reverse?lat=17.3850&lon=78.4867")
    assert res.status_code == 200
    data = res.json()
    assert "location_name" in data
    assert "Hyderabad" in data["location_name"] or "Telangana" in data["location_name"]

    # Verify custom bbox in compare returns location_name
    comp_res = client.post("/api/compare", json={"custom_bbox": [17.38, 78.48, 17.39, 78.49]})
    assert comp_res.status_code == 200
    comp_data = comp_res.json()
    assert "location_name" in comp_data
    assert len(comp_data["location_name"]) > 0
    print(f"GET /api/geocode/reverse & custom bbox test passed: {comp_data['location_name']}")

def test_taxonomy_breakdown_categories():
    """Verify that breakdown contains specific sub-types from the 6-category taxonomy."""
    res = client.post("/api/compare", json={"custom_bbox": [17.38, 78.48, 17.39, 78.49]})
    assert res.status_code == 200
    data = res.json()
    breakdown = data["breakdown"]
    assert len(breakdown) > 0
    all_subtypes = [
        "New buildings/houses", "New industrial/commercial areas",
        "New roads", "Bridges/flyovers", "New railway lines",
        "Reduction/increase in forest/green areas", "Agricultural land converted to buildings",
        "Changes in rivers, lakes, reservoirs", "New water infrastructure", "Changes in water spread",
        "New factories", "Industrial zones",
        "Power plants/substations", "Large infrastructure projects"
    ]
    for k in breakdown.keys():
        assert k in all_subtypes, f"Unknown taxonomy key: {k}"
    print(f"POST /api/compare 6-category taxonomy breakdown test passed: {breakdown}")

if __name__ == "__main__":
    test_health()
    test_list_images()
    test_semantic_search()
    test_search_unseeded_no_fallback()
    test_search_chicago_no_fallback()
    test_search_borneo_no_fallback()
    test_compare_pipeline()
    test_location_changes()
    test_custom_location_changes_no_blr_fallback()
    test_custom_area_compare()
    test_custom_area_outside_catalog()
    test_custom_polygon_different_outputs()
    test_custom_polygon_geometry_accepted()
    test_compare_invalid_raises_error()
    test_timeline_query()
    test_reverse_geocoding()
    test_taxonomy_breakdown_categories()
    print("ALL API TESTS PASSED SUCCESSFULLY!")

