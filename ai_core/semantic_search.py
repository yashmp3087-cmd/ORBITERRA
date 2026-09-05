"""
Semantic Retrieval Engine for Satellite Imagery.
Parses natural language queries, extracts spatial and temporal intent,
and computes semantic similarity scores across satellite scenes and change catalogs.
"""

import re
import json
import os
import logging
import urllib.request
import urllib.parse
from typing import List, Dict, Any, Optional, Tuple
import numpy as np

logger = logging.getLogger("ai_core.semantic_search")

KEYWORD_ONTOLOGY = {
    "New Construction": [
        "building", "buildings", "construction", "built-up", "urban", "expansion", 
        "concrete", "industrial", "campus", "tech park", "commercial", "housing", "structure", "structures"
    ],
    "Vegetation Loss": [
        "deforestation", "forest", "trees", "canopy", "vegetation", "loss", "clearing", 
        "greenery", "logging", "timber", "woodland", "reserve", "hills"
    ],
    "Water Body Shrinkage": [
        "water", "reservoir", "lake", "river", "shrinkage", "drought", "dry", 
        "drying", "depletion", "receding", "shoreline", "basin", "waterbody"
    ],
    "Road Development": [
        "road", "highway", "expressway", "corridor", "transport", "paved", 
        "asphalt", "traffic", "infrastructure", "interchange", "flyover", "carriageway"
    ]
}

# Stop words to clean queries when extracting candidate location names
QUERY_STOP_WORDS = {
    "find", "detect", "search", "show", "where", "is", "are", "new", "recent",
    "change", "changes", "satellite", "imagery", "image", "images", "the", "a",
    "an", "all", "in", "at", "near", "to", "for", "with", "from", "and", "or",
    "over", "across", "along", "around", "area", "region", "city", "zone",
    "loss", "shrinkage", "expansion", "development", "monitoring", "map", "view"
}

# Extensive gazetteer for Indian regions, demo locations, and major global points
GEOGRAPHIC_GAZETTEER = {
    # Demo Seeded Zones (have multi-temporal scene pairs)
    "bengaluru": {
        "aliases": ["bengaluru", "bangalore", "karnataka", "whitefield", "electronic city", "east tech corridor"],
        "name": "Bengaluru East Tech Corridor, Karnataka",
        "latitude": 12.9716,
        "longitude": 77.7289,
        "bbox": [12.960, 77.715, 12.983, 77.742],
        "has_catalog_imagery": True,
        "location_id": "LOC_BLR"
    },
    "western ghats": {
        "aliases": ["western ghats", "ghats", "kerala", "reserve", "rainforest", "silent valley", "idukki", "munnar"],
        "name": "Western Ghats Ecological Reserve, Kerala",
        "latitude": 10.1500,
        "longitude": 76.9500,
        "bbox": [10.138, 76.938, 10.162, 76.962],
        "has_catalog_imagery": True,
        "location_id": "LOC_WG"
    },
    "osmansagar": {
        "aliases": ["osmansagar", "gandipet", "freshwater lake", "himayatsagar"],
        "name": "Osmansagar Freshwater Reservoir, Telangana",
        "latitude": 17.3871,
        "longitude": 78.2982,
        "bbox": [17.3750, 78.2850, 17.3990, 78.3110],
        "has_catalog_imagery": True,
        "location_id": "LOC_OSM"
    },
    "yamuna": {
        "aliases": ["yamuna", "expressway", "uttar pradesh", "noida", "agra", "mathura", "greater noida", "taj expressway"],
        "name": "Yamuna Expressway Agri-Belt, Uttar Pradesh",
        "latitude": 27.9120,
        "longitude": 77.6250,
        "bbox": [27.9000, 77.6120, 27.9240, 77.6380],
        "has_catalog_imagery": True,
        "location_id": "LOC_EXP"
    },
    
    # Real Geographic Regions without catalog imagery (Geocoded & Centerable on Basemap)
    "mumbai": {
        "aliases": ["mumbai", "bombay", "maharashtra", "bandra", "andheri", "navi mumbai", "thane"],
        "name": "Mumbai Metropolitan Region, Maharashtra",
        "latitude": 19.0760,
        "longitude": 72.8777,
        "bbox": [18.9000, 72.7500, 19.2500, 73.0000],
        "has_catalog_imagery": False,
        "location_id": None
    },
    "delhi": {
        "aliases": ["delhi", "new delhi", "ncr", "connaught place", "dwarka", "rohini"],
        "name": "National Capital Region (NCR), Delhi",
        "latitude": 28.6139,
        "longitude": 77.2090,
        "bbox": [28.4500, 77.0500, 28.7800, 77.3500],
        "has_catalog_imagery": False,
        "location_id": None
    },
    "hyderabad": {
        "aliases": ["hyderabad", "telangana", "secunderabad", "hitec city", "gachibowli"],
        "name": "Hyderabad Metropolitan Area, Telangana",
        "latitude": 17.3850,
        "longitude": 78.4867,
        "bbox": [17.2000, 78.2500, 17.5500, 78.6500],
        "has_catalog_imagery": False,
        "location_id": None
    },
    "chennai": {
        "aliases": ["chennai", "madras", "tamil nadu", "omr", "guindy", "marina"],
        "name": "Chennai Metropolitan Area, Tamil Nadu",
        "latitude": 13.0827,
        "longitude": 80.2707,
        "bbox": [12.9500, 80.1500, 13.2000, 80.3200],
        "has_catalog_imagery": False,
        "location_id": None
    },
    "kolkata": {
        "aliases": ["kolkata", "calcutta", "west bengal", "howrah", "salt lake", "new town"],
        "name": "Kolkata, West Bengal",
        "latitude": 22.5726,
        "longitude": 88.3639,
        "bbox": [22.4500, 88.2500, 22.7000, 88.4800],
        "has_catalog_imagery": False,
        "location_id": None
    },
    "pune": {
        "aliases": ["pune", "poona", "hinjewadi", "shivajinagar", "kothrud"],
        "name": "Pune, Maharashtra",
        "latitude": 18.5204,
        "longitude": 73.8567,
        "bbox": [18.4200, 73.7500, 18.6200, 73.9500],
        "has_catalog_imagery": False,
        "location_id": None
    },
    "ahmedabad": {
        "aliases": ["ahmedabad", "gujarat", "gandhinagar", "sabarmati"],
        "name": "Ahmedabad, Gujarat",
        "latitude": 23.0225,
        "longitude": 72.5714,
        "bbox": [22.9200, 72.4800, 23.1200, 72.6800],
        "has_catalog_imagery": False,
        "location_id": None
    },
    "jaipur": {
        "aliases": ["jaipur", "rajasthan", "pink city", "amer"],
        "name": "Jaipur, Rajasthan",
        "latitude": 26.9124,
        "longitude": 75.7873,
        "bbox": [26.8200, 75.7000, 27.0200, 75.8800],
        "has_catalog_imagery": False,
        "location_id": None
    },
    "lucknow": {
        "aliases": ["lucknow", "gomti", "hazratganj"],
        "name": "Lucknow, Uttar Pradesh",
        "latitude": 26.8467,
        "longitude": 80.9462,
        "bbox": [26.7500, 80.8500, 26.9500, 81.0500],
        "has_catalog_imagery": False,
        "location_id": None
    },
    "assam": {
        "aliases": ["assam", "guwahati", "kaziranga", "brahmaputra", "dispur"],
        "name": "Assam & Brahmaputra Valley, India",
        "latitude": 26.2006,
        "longitude": 92.9376,
        "bbox": [25.8000, 91.5000, 26.8000, 93.5000],
        "has_catalog_imagery": False,
        "location_id": None
    },
    "goa": {
        "aliases": ["goa", "panaji", "margao", "vasco"],
        "name": "Goa Coastal Region, India",
        "latitude": 15.2993,
        "longitude": 74.1240,
        "bbox": [15.0000, 73.7000, 15.6000, 74.3000],
        "has_catalog_imagery": False,
        "location_id": None
    },
    "chicago": {
        "aliases": ["chicago", "illinois", "midwest"],
        "name": "Chicago, Illinois, USA",
        "latitude": 41.8781,
        "longitude": -87.6298,
        "bbox": [41.6400, -87.9400, 42.0200, -87.5200],
        "has_catalog_imagery": False,
        "location_id": None
    },
    "london": {
        "aliases": ["london", "uk", "thames", "greater london"],
        "name": "London, United Kingdom",
        "latitude": 51.5074,
        "longitude": -0.1278,
        "bbox": [51.2800, -0.5100, 51.6900, 0.3300],
        "has_catalog_imagery": False,
        "location_id": None
    },
    "borneo": {
        "aliases": ["borneo", "kalimantan", "sarawak", "sabah"],
        "name": "Borneo Island Tropical Forest, Southeast Asia",
        "latitude": 0.9619,
        "longitude": 114.5548,
        "bbox": [-4.0000, 108.0000, 7.0000, 119.0000],
        "has_catalog_imagery": False,
        "location_id": None
    },
    "singapore": {
        "aliases": ["singapore", "sg"],
        "name": "Singapore Island",
        "latitude": 1.3521,
        "longitude": 103.8198,
        "bbox": [1.1300, 103.6000, 1.4800, 104.0500],
        "has_catalog_imagery": False,
        "location_id": None
    },
    "dubai": {
        "aliases": ["dubai", "uae", "emirates"],
        "name": "Dubai, United Arab Emirates",
        "latitude": 25.2048,
        "longitude": 55.2708,
        "bbox": [24.9500, 54.9500, 25.3500, 55.5500],
        "has_catalog_imagery": False,
        "location_id": None
    },
    "sydney": {
        "aliases": ["sydney", "australia", "nsw"],
        "name": "Sydney, New South Wales, Australia",
        "latitude": -33.8688,
        "longitude": 151.2093,
        "bbox": [-34.1200, 150.6200, -33.5800, 151.3400],
        "has_catalog_imagery": False,
        "location_id": None
    },
    "san francisco": {
        "aliases": ["san francisco", "sf", "bay area", "california", "silicon valley"],
        "name": "San Francisco Bay Area, California, USA",
        "latitude": 37.7749,
        "longitude": -122.4194,
        "bbox": [37.6000, -122.5500, 37.9000, -122.2500],
        "has_catalog_imagery": False,
        "location_id": None
    },
    "dallas": {
        "aliases": ["dallas", "texas", "fort worth", "dfw"],
        "name": "Dallas-Fort Worth, Texas, USA",
        "latitude": 32.7767,
        "longitude": -96.7970,
        "bbox": [32.6100, -96.9900, 33.0200, -96.5500],
        "has_catalog_imagery": False,
        "location_id": None
    },
    "seattle": {
        "aliases": ["seattle", "washington", "puget sound"],
        "name": "Seattle, Washington, USA",
        "latitude": 47.6062,
        "longitude": -122.3321,
        "bbox": [47.4800, -122.4400, 47.7300, -122.2400],
        "has_catalog_imagery": False,
        "location_id": None
    },
    "berlin": {
        "aliases": ["berlin", "germany"],
        "name": "Berlin, Germany",
        "latitude": 52.5200,
        "longitude": 13.4050,
        "bbox": [52.3300, 13.0800, 52.6700, 13.7600],
        "has_catalog_imagery": False,
        "location_id": None
    },
    "amazon": {
        "aliases": ["amazon", "brazil", "rainforest", "manaus"],
        "name": "Amazon Rainforest Basin, Brazil",
        "latitude": -3.4653,
        "longitude": -62.2159,
        "bbox": [-5.0000, -65.0000, -1.0000, -60.0000],
        "has_catalog_imagery": False,
        "location_id": None
    },
    "tokyo": {
        "aliases": ["tokyo", "japan", "shinjuku", "shibuya"],
        "name": "Tokyo Metropolitan Area, Japan",
        "latitude": 35.6762,
        "longitude": 139.6503,
        "bbox": [35.5000, 139.4000, 35.8000, 139.9000],
        "has_catalog_imagery": False,
        "location_id": None
    },
    "paris": {
        "aliases": ["paris", "france", "seine"],
        "name": "Paris, France",
        "latitude": 48.8566,
        "longitude": 2.3522,
        "bbox": [48.7500, 2.2000, 48.9500, 2.5000],
        "has_catalog_imagery": False,
        "location_id": None
    },
    "new york": {
        "aliases": ["new york", "nyc", "manhattan", "brooklyn"],
        "name": "New York City, USA",
        "latitude": 40.7128,
        "longitude": -74.0060,
        "bbox": [40.5500, -74.1500, 40.8500, -73.8500],
        "has_catalog_imagery": False,
        "location_id": None
    }
}


def geocode_location_nominatim(query_text: str, timeout_sec: float = 1.5) -> Optional[Dict[str, Any]]:
    """
    Attempts dynamic geocoding via OpenStreetMap Nominatim with a fast timeout.
    Returns standard geocoded structure or None if unreachable/offline.
    """
    try:
        clean_q = query_text.strip()
        if not clean_q or len(clean_q) < 3:
            return None
        encoded = urllib.parse.quote(clean_q)
        url = f"https://nominatim.openstreetmap.org/search?q={encoded}&format=json&limit=1"
        req = urllib.request.Request(
            url, 
            headers={"User-Agent": "ORBITERRA-Satellite-Search/1.0 (contact@orbiterra.io)"}
        )
        with urllib.request.urlopen(req, timeout=timeout_sec) as resp:
            if resp.status == 200:
                data = json.loads(resp.read().decode('utf-8'))
                if data and len(data) > 0:
                    item = data[0]
                    lat = float(item["lat"])
                    lon = float(item["lon"])
                    boundingbox = item.get("boundingbox", [lat - 0.05, lat + 0.05, lon - 0.05, lon + 0.05])
                    min_lat = float(boundingbox[0])
                    max_lat = float(boundingbox[1])
                    min_lon = float(boundingbox[2])
                    max_lon = float(boundingbox[3])
                    display_name = item.get("display_name", clean_q.title())
                    short_name = display_name.split(",")[0].strip() + (f", {display_name.split(',')[-1].strip()}" if "," in display_name else "")
                    return {
                        "name": short_name,
                        "latitude": lat,
                        "longitude": lon,
                        "bbox": [min_lat, min_lon, max_lat, max_lon],
                        "has_catalog_imagery": False,
                        "location_id": None
                    }
    except Exception as e:
        logger.debug(f"Nominatim geocoding note for '{query_text}': {e}")
    return None


_REVERSE_GEOCODE_CACHE: Dict[Tuple[float, float], str] = {}


def reverse_geocode_nominatim(lat: float, lon: float, timeout_sec: float = 2.0) -> str:
    """
    Resolves geographic coordinates (lat, lon) into a human-readable location name
    using OpenStreetMap Nominatim with an in-memory cache and offline gazetteer fallback.
    Examples: 'Hyderabad, Telangana', 'Bengaluru, Karnataka'.
    """
    cache_key = (round(lat, 3), round(lon, 3))
    if cache_key in _REVERSE_GEOCODE_CACHE:
        return _REVERSE_GEOCODE_CACHE[cache_key]

    try:
        url = f"https://nominatim.openstreetmap.org/reverse?lat={lat}&lon={lon}&format=jsonv2"
        req = urllib.request.Request(
            url,
            headers={"User-Agent": "ORBITERRA-Satellite-Search/1.0 (contact@orbiterra.io)"}
        )
        with urllib.request.urlopen(req, timeout=timeout_sec) as resp:
            if resp.status == 200:
                data = json.loads(resp.read().decode('utf-8'))
                address = data.get("address", {})
                
                locality = (
                    address.get("city") or 
                    address.get("town") or 
                    address.get("village") or 
                    address.get("suburb") or 
                    address.get("county") or
                    address.get("state_district")
                )
                state = address.get("state")
                country = address.get("country")
                
                if locality and state:
                    resolved = f"{locality}, {state}"
                elif locality and country:
                    resolved = f"{locality}, {country}"
                elif state and country:
                    resolved = f"{state}, {country}"
                elif data.get("display_name"):
                    parts = [p.strip() for p in data["display_name"].split(",")]
                    resolved = f"{parts[0]}, {parts[-1]}" if len(parts) > 1 else parts[0]
                else:
                    resolved = None

                if resolved:
                    _REVERSE_GEOCODE_CACHE[cache_key] = resolved
                    return resolved
    except Exception as e:
        logger.debug(f"Reverse geocode lookup note for ({lat}, {lon}): {e}")

    # Fallback to closest known gazetteer location if within ~45km
    best_dist = 999.0
    best_name = None
    for loc_info in GEOGRAPHIC_GAZETTEER.values():
        d_lat = abs(loc_info["latitude"] - lat)
        d_lon = abs(loc_info["longitude"] - lon)
        dist_approx = (d_lat ** 2 + d_lon ** 2) ** 0.5
        if dist_approx < best_dist:
            best_dist = dist_approx
            best_name = loc_info["name"]

    if best_dist < 0.40 and best_name:
        fallback = best_name
    else:
        fallback = f"Coordinates ({lat:.4f}° N, {lon:.4f}° E)"

    _REVERSE_GEOCODE_CACHE[cache_key] = fallback
    return fallback


class SemanticRetrievalEngine:
    def __init__(self, catalog_path: str = None):
        if catalog_path is None:
            catalog_path = os.path.abspath(
                os.path.join(os.path.dirname(__file__), "..", "samples", "catalog.json")
            )
        self.catalog_path = catalog_path
        self.scenes = []
        self.scenarios = []
        self.load_catalog()

    def load_catalog(self):
        if os.path.exists(self.catalog_path):
            with open(self.catalog_path, "r", encoding="utf-8") as f:
                data = json.load(f)
                self.scenes = data.get("scenes", [])
                self.scenarios = data.get("scenarios", [])
        else:
            self.scenes = []
            self.scenarios = []

    def extract_location_candidate(self, query_clean: str) -> Optional[str]:
        """
        Extracts candidate geographic location name from prepositional phrases or query text.
        """
        # Pattern 1: Prepositional match like 'in Chicago', 'at Western Ghats', 'near Mumbai'
        prep_patterns = [
            r'\b(?:in|at|near|around|along|across|over|of)\s+([a-zA-Z0-9\s,\-\.]+?)(?:\s+(?:area|region|corridor|city|state|valley|zone|district))?\b'
        ]
        for pat in prep_patterns:
            m = re.search(pat, query_clean)
            if m:
                cand = m.group(1).strip()
                # Remove common change keywords if captured
                cand_tokens = [w for w in re.findall(r'\b\w+\b', cand) if w not in QUERY_STOP_WORDS]
                if cand_tokens:
                    return " ".join(cand_tokens)

        # Pattern 2: Filter query words against stop words & change terms
        all_change_terms = set()
        for kws in KEYWORD_ONTOLOGY.values():
            all_change_terms.update(kws)
            
        remaining_words = [
            w for w in re.findall(r'\b\w+\b', query_clean)
            if w not in QUERY_STOP_WORDS and w not in all_change_terms
        ]
        if remaining_words:
            return " ".join(remaining_words)
            
        return None

    def parse_intent(self, query: str) -> Dict[str, Any]:
        """
        Parses natural language user query into semantic intents, target change types,
        and geographic coordinates/locations.
        """
        query_clean = query.lower().strip()
        tokens = re.findall(r'\b\w+\b', query_clean)
        
        # 1. Target Change Type Detection
        detected_types = []
        for change_type, keywords in KEYWORD_ONTOLOGY.items():
            overlap = [kw for kw in keywords if kw in query_clean]
            if overlap:
                detected_types.append((change_type, len(overlap)))
                
        detected_types.sort(key=lambda x: x[1], reverse=True)
        primary_intent = detected_types[0][0] if detected_types else None
        
        # 2. Check for explicit coordinates in query e.g. "19.07, 72.87" or "28.61 77.20"
        coord_match = re.search(r'([-+]?\d{1,2}\.\d+)[,\s]+([-+]?\d{1,3}\.\d+)', query_clean)
        geocoded = None
        matched_loc_key = None
        
        if coord_match:
            try:
                lat = float(coord_match.group(1))
                lon = float(coord_match.group(2))
                matched_loc_key = f"coord_{lat}_{lon}"
                geocoded = {
                    "name": f"Coordinate Location ({lat:.4f}°, {lon:.4f}°)",
                    "latitude": lat,
                    "longitude": lon,
                    "bbox": [lat - 0.02, lon - 0.02, lat + 0.02, lon + 0.02],
                    "has_catalog_imagery": False,
                    "location_id": None
                }
            except Exception:
                pass

        # 3. Geographic Gazetteer Match
        if not geocoded:
            for loc_key, loc_info in GEOGRAPHIC_GAZETTEER.items():
                for alias in loc_info["aliases"]:
                    if re.search(rf'\b{re.escape(alias)}\b', query_clean):
                        matched_loc_key = loc_key
                        geocoded = dict(loc_info)
                        del geocoded["aliases"]
                        break
                if geocoded:
                    break

        # 4. Dynamic Location Candidate & Geocoding
        if not geocoded:
            candidate_name = self.extract_location_candidate(query_clean)
            if candidate_name:
                matched_loc_key = candidate_name
                # Check gazetteer with candidate tokens
                for loc_key, loc_info in GEOGRAPHIC_GAZETTEER.items():
                    if any(re.search(rf'\b{re.escape(a)}\b', candidate_name) for a in loc_info["aliases"]):
                        matched_loc_key = loc_key
                        geocoded = dict(loc_info)
                        del geocoded["aliases"]
                        break
                
                # If still not found, query Nominatim
                if not geocoded:
                    geocoded = geocode_location_nominatim(candidate_name)
                    
                # If geocoding failed or was offline, create basic entity so we never fallback to demo data
                if not geocoded:
                    geocoded = {
                        "name": candidate_name.title(),
                        "latitude": 0.0,
                        "longitude": 0.0,
                        "bbox": None,
                        "has_catalog_imagery": False,
                        "location_id": None
                    }

        return {
            "query": query,
            "tokens": tokens,
            "target_change_type": primary_intent or "General Spatial Query",
            "detected_location": matched_loc_key,
            "geocoded_location": geocoded,
            "has_temporal_intent": any(w in query_clean for w in ["new", "change", "loss", "shrinkage", "recent", "before", "after", "development", "timeline"])
        }

    def search(self, query: str, top_k: int = 4) -> Dict[str, Any]:
        """
        Executes semantic search over catalog scenes and scenarios.
        Returns ranked matched scenes and corresponding multi-temporal comparison pairs.
        NEVER silently falls back to a hardcoded demo scenario if the user searched elsewhere.
        """
        self.load_catalog()
        intent = self.parse_intent(query)
        query_words = set(intent["tokens"])
        geocoded = intent.get("geocoded_location")
        detected_loc = intent.get("detected_location")
        target_type = intent["target_change_type"]
        
        scored_scenes = []
        
        # Check if query targets an unseeded or external location
        is_unseeded_location = bool(
            (geocoded and not geocoded.get("has_catalog_imagery", False)) or
            (detected_loc and not any(
                detected_loc in s.get("area_name", "").lower() or 
                detected_loc == s.get("location_id", "").lower() 
                for s in self.scenes
            ))
        )

        if not is_unseeded_location:
            for scene in self.scenes:
                score = 0.0
                explanation_parts = []
                
                # 1. Match with scene tags
                tags = [t.lower() for t in scene.get("tags", [])]
                tag_matches = [t for t in tags if any(qw in t or t in qw for qw in query_words)]
                if tag_matches:
                    score += len(tag_matches) * 0.25
                    explanation_parts.append(f"Matched tags: {', '.join(tag_matches)}")
                    
                # 2. Match with area name / location
                area_lower = scene.get("area_name", "").lower()
                area_matches = [qw for qw in query_words if qw in area_lower]
                if area_matches:
                    score += len(area_matches) * 0.40
                    explanation_parts.append(f"Location match: {', '.join(area_matches)}")
                    
                # 3. Specific geographic location alignment
                if detected_loc:
                    if detected_loc in area_lower or (geocoded and geocoded.get("location_id") == scene.get("location_id")):
                        score += 0.50
                        explanation_parts.append(f"Exact location match with {scene.get('area_name')}")
                    else:
                        # Query explicitly requested a location, but this scene is elsewhere -> penalize to 0
                        score = 0.0

                # 4. Intent alignment bonus (only if score > 0 or no specific location was requested)
                if score > 0 and target_type in KEYWORD_ONTOLOGY:
                    type_keywords = KEYWORD_ONTOLOGY[target_type]
                    scene_text = (scene.get("area_name", "") + " " + " ".join(tags)).lower()
                    if any(kw in scene_text for kw in type_keywords):
                        score += 0.35
                        explanation_parts.append(f"High semantic alignment with {target_type}")

                # ONLY keep candidates with real query overlap (NEVER default to 0.35 baseline!)
                if score > 0.05:
                    normalized_score = round(min(1.0, score), 3)
                    scored_scenes.append({
                        "scene": scene,
                        "relevance_score": normalized_score,
                        "confidence_percentage": f"{round(normalized_score * 100, 1)}%",
                        "explanation": "; ".join(explanation_parts)
                    })

        # Sort by relevance score descending
        scored_scenes.sort(key=lambda x: x["relevance_score"], reverse=True)
        top_scenes = scored_scenes[:top_k]

        # Scenario Matching: ONLY suggest a scenario if it truly matches the user's intent & location.
        # If user searched for an unseeded location (e.g. Chicago, Borneo, Mumbai), matched_scenario MUST BE NONE!
        matched_scenario = None
        if not is_unseeded_location:
            for scn in self.scenarios:
                scn_loc = scn.get("location_name", "").lower()
                
                # If specific location requested, must match that location
                if detected_loc:
                    if (geocoded and geocoded.get("location_id") == scn.get("location_id")) or detected_loc in scn_loc:
                        matched_scenario = scn
                        break
                elif target_type and target_type in KEYWORD_ONTOLOGY:
                    # Purely thematic query without location (e.g. "show deforestation")
                    if scn.get("primary_change_type") == target_type:
                        matched_scenario = scn
                        break

        # Generate explanatory message for user
        message = None
        if is_unseeded_location:
            loc_name = geocoded.get("name") if geocoded and geocoded.get("name") else (detected_loc or "searched region")
            if geocoded and geocoded.get("bbox"):
                message = f"No multi-temporal satellite imagery pairs cataloged for '{loc_name}' yet. Displaying live satellite basemap at coordinates."
            else:
                message = f"No multi-temporal satellite imagery pairs cataloged for '{loc_name}' yet. Centering live satellite basemap."
        elif not top_scenes and not matched_scenario:
            message = f"No matching satellite scenes found for '{query}'. Try selecting a demo scenario or entering coordinates."

        logger.info(
            f"[SEARCH] Query: '{query}' | Target intent: {target_type} | Location: {detected_loc} | "
            f"Results: {len(top_scenes)} | Scenario: {matched_scenario.get('scenario_id') if matched_scenario else None}"
        )

        return {
            "query": query,
            "parsed_intent": intent,
            "results_count": len(top_scenes),
            "results": top_scenes,
            "suggested_scenario": matched_scenario,
            "geocoded_location": geocoded,
            "message": message
        }
