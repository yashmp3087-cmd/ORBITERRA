"""
Seed script to generate high-fidelity multi-temporal satellite imagery pairs and metadata
for the Smart India Hackathon prototype.
"""

import os
import json
import numpy as np
from PIL import Image, ImageDraw, ImageFilter
import cv2

SAMPLES_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "samples"))
STATIC_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "static"))
os.makedirs(SAMPLES_DIR, exist_ok=True)
os.makedirs(STATIC_DIR, exist_ok=True)

def generate_urban_expansion_pair():
    """Generates Before/After satellite images for Urban Expansion / New Construction."""
    w, h = 512, 512
    # Base terrain: rural/agricultural tones (greens, muted khakis)
    np.random.seed(42)
    noise = np.random.normal(0, 10, (h, w, 3)).astype(np.float32)
    
    # Before Image (2021): green fields, dirt paths, sparse trees
    base_t1 = np.zeros((h, w, 3), dtype=np.uint8)
    base_t1[:, :] = [78, 128, 64] # Lush field green
    # Add soil patches
    for _ in range(12):
        bx, by = np.random.randint(40, 470), np.random.randint(40, 470)
        cv2.circle(base_t1, (bx, by), np.random.randint(30, 70), (115, 142, 85), -1)
    
    # Add subtle dirt tracks
    cv2.polylines(base_t1, [np.array([[20, 150], [180, 260], [350, 240], [490, 380]])], False, (140, 130, 110), 4)
    cv2.polylines(base_t1, [np.array([[240, 50], [250, 240], [280, 480]])], False, (145, 135, 115), 3)

    img_t1 = Image.fromarray(cv2.GaussianBlur(base_t1, (5, 5), 0))
    draw_t1 = ImageDraw.Draw(img_t1)
    # Scatter tree clusters
    for _ in range(80):
        tx, ty = np.random.randint(10, 500), np.random.randint(10, 500)
        draw_t1.ellipse([tx, ty, tx + 8, ty + 8], fill=(35, 80, 30))

    # After Image (2024): New Construction development zone in center-east
    img_t2 = img_t1.copy()
    draw_t2 = ImageDraw.Draw(img_t2)
    
    # Cleared construction ground
    draw_t2.rectangle([140, 120, 440, 410], fill=(160, 155, 145), outline=(120, 115, 105), width=2)
    
    # Grid of new industrial/commercial buildings (roofs: white, cyan, terracotta)
    roof_colors = [(225, 230, 235), (210, 215, 220), (180, 90, 70), (195, 205, 215), (70, 95, 120)]
    for r in range(4):
        for c in range(3):
            rx = 160 + c * 90
            ry = 140 + r * 65
            col = roof_colors[(r + c) % len(roof_colors)]
            # Roof with shadow
            draw_t2.rectangle([rx + 4, ry + 4, rx + 74, ry + 54], fill=(70, 70, 70)) # shadow
            draw_t2.rectangle([rx, ry, rx + 70, ry + 50], fill=col, outline=(90, 90, 90), width=2)
            # HVAC / rooftop details
            draw_t2.rectangle([rx + 15, ry + 15, rx + 30, ry + 30], fill=(130, 135, 140))

    # Internal paved roads
    draw_t2.line([140, 205, 440, 205], fill=(85, 85, 90), width=8)
    draw_t2.line([140, 270, 440, 270], fill=(85, 85, 90), width=8)
    draw_t2.line([140, 335, 440, 335], fill=(85, 85, 90), width=8)
    draw_t2.line([240, 120, 240, 410], fill=(85, 85, 90), width=8)
    draw_t2.line([330, 120, 330, 410], fill=(85, 85, 90), width=8)

    t1_path = os.path.join(SAMPLES_DIR, "bengaluru_urban_2021.png")
    t2_path = os.path.join(SAMPLES_DIR, "bengaluru_urban_2024.png")
    img_t1.save(t1_path)
    img_t2.save(t2_path)
    return t1_path, t2_path

def generate_deforestation_pair():
    """Generates Before/After satellite images for Vegetation Loss / Deforestation."""
    w, h = 512, 512
    # Before Image (2020): Dense deep forest canopy with organic river bend
    base_t1 = np.zeros((h, w, 3), dtype=np.uint8)
    base_t1[:, :] = [32, 85, 34] # Deep canopy green
    # Add canopy texture
    for _ in range(250):
        cx, cy = np.random.randint(0, w), np.random.randint(0, h)
        r = np.random.randint(10, 35)
        g_val = np.random.randint(65, 115)
        cv2.circle(base_t1, (cx, cy), r, (24, g_val, 28), -1)
    
    # Natural stream on the edge
    stream_pts = np.array([[30, 0], [60, 120], [45, 260], [80, 380], [50, 512]])
    cv2.polylines(base_t1, [stream_pts], False, (45, 90, 130), 16)
    
    img_t1 = Image.fromarray(cv2.GaussianBlur(base_t1, (3, 3), 0))

    # After Image (2024): Extensive clearing / deforestation patches
    img_t2 = img_t1.copy()
    draw_t2 = ImageDraw.Draw(img_t2)

    # Deforested zones (cleared bare reddish-brown soil)
    clearing_poly1 = [(150, 90), (320, 80), (370, 190), (280, 240), (140, 200)]
    clearing_poly2 = [(220, 270), (450, 260), (470, 420), (320, 440), (200, 360)]
    
    soil_color = (168, 124, 82)
    draw_t2.polygon(clearing_poly1, fill=soil_color, outline=(130, 95, 60))
    draw_t2.polygon(clearing_poly2, fill=soil_color, outline=(130, 95, 60))

    # Dirt haulage access trails
    draw_t2.line([(60, 130), (160, 140), (270, 170), (300, 300), (380, 350)], fill=(185, 150, 110), width=6)
    
    t1_path = os.path.join(SAMPLES_DIR, "western_ghats_forest_2020.png")
    t2_path = os.path.join(SAMPLES_DIR, "western_ghats_forest_2024.png")
    img_t1.save(t1_path)
    img_t2.save(t2_path)
    return t1_path, t2_path

def generate_water_shrinkage_pair():
    """Generates Before/After satellite images for Reservoir / Water Body Shrinkage."""
    w, h = 512, 512
    # Surrounding arid/semi-arid terrain
    base_t1 = np.zeros((h, w, 3), dtype=np.uint8)
    base_t1[:, :] = [175, 160, 135] # Light sandstone / savannah dry soil
    
    # T1: High water capacity reservoir (deep azure blue)
    water_poly_t1 = np.array([
        [100, 70], [280, 60], [420, 140], [460, 320], [380, 450], 
        [220, 460], [130, 380], [80, 240]
    ])
    cv2.fillPoly(base_t1, [water_poly_t1], (30, 75, 145))
    
    # Island in middle
    cv2.circle(base_t1, (270, 250), 32, (165, 150, 125), -1)

    img_t1 = Image.fromarray(cv2.GaussianBlur(base_t1, (5, 5), 0))

    # T2: Shrunk reservoir with exposed mud flats & dry cracked reservoir floor
    base_t2 = base_t1.copy()
    # Draw exposed dry mud buffer
    cv2.fillPoly(base_t2, [water_poly_t1], (135, 120, 95)) # Dried cracked basin
    
    # Shrunken water perimeter
    water_poly_t2 = np.array([
        [180, 160], [270, 140], [350, 200], [360, 310], [300, 370], 
        [220, 360], [170, 290], [160, 220]
    ])
    cv2.fillPoly(base_t2, [water_poly_t2], (40, 90, 160))
    # Expanded dry island
    cv2.circle(base_t2, (270, 250), 55, (140, 125, 100), -1)

    img_t2 = Image.fromarray(cv2.GaussianBlur(base_t2, (5, 5), 0))

    t1_path = os.path.join(SAMPLES_DIR, "osmansagar_water_2021.png")
    t2_path = os.path.join(SAMPLES_DIR, "osmansagar_water_2023.png")
    img_t1.save(t1_path)
    img_t2.save(t2_path)
    return t1_path, t2_path

def generate_road_development_pair():
    """Generates Before/After satellite images for Highway / Road Development."""
    w, h = 512, 512
    # Agricultural patchwork
    base_t1 = np.zeros((h, w, 3), dtype=np.uint8)
    base_t1[:, :] = [110, 145, 95]
    
    # Farm plot boundaries
    for i in range(5):
        for j in range(5):
            x1, y1 = i * 100 + 10, j * 100 + 10
            col = (int(90 + np.random.randint(-15, 25)), int(135 + np.random.randint(-20, 25)), int(80 + np.random.randint(-15, 25)))
            cv2.rectangle(base_t1, (x1, y1), (x1 + 90, y1 + 90), col, -1)

    img_t1 = Image.fromarray(cv2.GaussianBlur(base_t1, (3, 3), 0))

    # After Image (2023): Grand multi-lane modern expressway cutting diagonally
    img_t2 = img_t1.copy()
    draw_t2 = ImageDraw.Draw(img_t2)

    # Road clearing corridor
    draw_t2.line([(0, 480), (512, 60)], fill=(145, 140, 130), width=38)
    # Paved asphalt twin carriageways
    draw_t2.line([(0, 485), (512, 65)], fill=(50, 52, 55), width=14)
    draw_t2.line([(0, 470), (512, 50)], fill=(50, 52, 55), width=14)
    # Center median green strip
    draw_t2.line([(0, 477), (512, 57)], fill=(75, 110, 60), width=4)
    # Cloverleaf interchange loop on right
    draw_t2.arc([320, 130, 460, 270], start=30, end=270, fill=(50, 52, 55), width=8)

    t1_path = os.path.join(SAMPLES_DIR, "yamuna_highway_2020.png")
    t2_path = os.path.join(SAMPLES_DIR, "yamuna_highway_2023.png")
    img_t1.save(t1_path)
    img_t2.save(t2_path)
    return t1_path, t2_path

def build_metadata_catalog():
    """Generates the master catalog of satellite scenes and scenarios."""
    scenes = [
        {
            "id": "IMG_BLR_2021",
            "location_id": "LOC_BLR",
            "area_name": "Bengaluru East Tech Corridor, Karnataka",
            "capture_date": "2021-03-15",
            "latitude": 12.9716,
            "longitude": 77.7289,
            "resolution_m": 10.0,
            "image_filename": "bengaluru_urban_2021.png",
            "bbox": [12.9600, 77.7150, 12.9830, 77.7420],
            "tags": ["urban", "construction", "bengaluru", "buildings", "tech park", "open land"],
            "period": "T1 (Before)"
        },
        {
            "id": "IMG_BLR_2024",
            "location_id": "LOC_BLR",
            "area_name": "Bengaluru East Tech Corridor, Karnataka",
            "capture_date": "2024-03-20",
            "latitude": 12.9716,
            "longitude": 77.7289,
            "resolution_m": 10.0,
            "image_filename": "bengaluru_urban_2024.png",
            "bbox": [12.9600, 77.7150, 12.9830, 77.7420],
            "tags": ["urban", "construction", "bengaluru", "new buildings", "industrial park", "built-up"],
            "period": "T2 (After)"
        },
        {
            "id": "IMG_WG_2020",
            "location_id": "LOC_WG",
            "area_name": "Western Ghats Ecological Reserve, Kerala",
            "capture_date": "2020-11-10",
            "latitude": 10.4520,
            "longitude": 76.8830,
            "resolution_m": 10.0,
            "image_filename": "western_ghats_forest_2020.png",
            "bbox": [10.4400, 76.8700, 10.4640, 76.8960],
            "tags": ["forest", "trees", "dense vegetation", "river", "biodiversity", "canopy"],
            "period": "T1 (Before)"
        },
        {
            "id": "IMG_WG_2024",
            "location_id": "LOC_WG",
            "area_name": "Western Ghats Ecological Reserve, Kerala",
            "capture_date": "2024-01-22",
            "latitude": 10.4520,
            "longitude": 76.8830,
            "resolution_m": 10.0,
            "image_filename": "western_ghats_forest_2024.png",
            "bbox": [10.4400, 76.8700, 10.4640, 76.8960],
            "tags": ["forest", "deforestation", "clearing", "vegetation loss", "timber", "bare land"],
            "period": "T2 (After)"
        },
        {
            "id": "IMG_OSM_2021",
            "location_id": "LOC_OSM",
            "area_name": "Osmansagar Freshwater Reservoir, Telangana",
            "capture_date": "2021-09-28",
            "latitude": 17.3871,
            "longitude": 78.2982,
            "resolution_m": 10.0,
            "image_filename": "osmansagar_water_2021.png",
            "bbox": [17.3750, 78.2850, 17.3990, 78.3110],
            "tags": ["water", "reservoir", "lake", "hyderabad", "high capacity", "full reservoir"],
            "period": "T1 (Before)"
        },
        {
            "id": "IMG_OSM_2023",
            "location_id": "LOC_OSM",
            "area_name": "Osmansagar Freshwater Reservoir, Telangana",
            "capture_date": "2023-05-14",
            "latitude": 17.3871,
            "longitude": 78.2982,
            "resolution_m": 10.0,
            "image_filename": "osmansagar_water_2023.png",
            "bbox": [17.3750, 78.2850, 17.3990, 78.3110],
            "tags": ["water", "reservoir shrinkage", "drought", "dry lakebed", "water loss"],
            "period": "T2 (After)"
        },
        {
            "id": "IMG_EXP_2020",
            "location_id": "LOC_EXP",
            "area_name": "Yamuna Expressway Agri-Belt, Uttar Pradesh",
            "capture_date": "2020-02-18",
            "latitude": 27.9120,
            "longitude": 77.6250,
            "resolution_m": 10.0,
            "image_filename": "yamuna_highway_2020.png",
            "bbox": [27.9000, 77.6120, 27.9240, 77.6380],
            "tags": ["agriculture", "farmland", "fields", "rural", "pre-highway"],
            "period": "T1 (Before)"
        },
        {
            "id": "IMG_EXP_2023",
            "location_id": "LOC_EXP",
            "area_name": "Yamuna Expressway Agri-Belt, Uttar Pradesh",
            "capture_date": "2023-11-05",
            "latitude": 27.9120,
            "longitude": 77.6250,
            "resolution_m": 10.0,
            "image_filename": "yamuna_highway_2023.png",
            "bbox": [27.9000, 77.6120, 27.9240, 77.6380],
            "tags": ["highway", "road development", "expressway", "infrastructure", "paved transport"],
            "period": "T2 (After)"
        }
    ]
    
    # Pre-configured scenario comparisons
    scenarios = [
        {
            "scenario_id": "SCN_URBAN",
            "title": "Urban Expansion & Tech Park Construction",
            "location_name": "Bengaluru East Tech Corridor",
            "location_id": "LOC_BLR",
            "image_id_before": "IMG_BLR_2021",
            "image_id_after": "IMG_BLR_2024",
            "primary_change_type": "New Construction",
            "description": "Rapid transformation of peri-urban agricultural land into commercial IT campus with multiple building blocks and paved internal network."
        },
        {
            "scenario_id": "SCN_FOREST",
            "title": "Vegetation Loss & Ecological Canopy Clearing",
            "location_name": "Western Ghats Ecological Reserve",
            "location_id": "LOC_WG",
            "image_id_before": "IMG_WG_2020",
            "image_id_after": "IMG_WG_2024",
            "primary_change_type": "Vegetation Loss",
            "description": "Deforestation and clear-cutting detected across the eastern ridge bordering the natural stream buffer."
        },
        {
            "scenario_id": "SCN_WATER",
            "title": "Reservoir Water Surface Depletion",
            "location_name": "Osmansagar Freshwater Reservoir",
            "location_id": "LOC_OSM",
            "image_id_before": "IMG_OSM_2021",
            "image_id_after": "IMG_OSM_2023",
            "primary_change_type": "Water Body Shrinkage",
            "description": "Significant reduction of surface water perimeter due to prolonged dry season, exposing mud flats and dry lakebed."
        },
        {
            "scenario_id": "SCN_HIGHWAY",
            "title": "Expressway Corridor & Interchange Infrastructure",
            "location_name": "Yamuna Expressway Agri-Belt",
            "location_id": "LOC_EXP",
            "image_id_before": "IMG_EXP_2020",
            "image_id_after": "IMG_EXP_2023",
            "primary_change_type": "Road Development",
            "description": "New 6-lane asphalt expressway cuts diagonally across farmland with cloverleaf interchange structure."
        }
    ]

    seed_data = {
        "scenes": scenes,
        "scenarios": scenarios
    }

    seed_path = os.path.join(SAMPLES_DIR, "catalog.json")
    with open(seed_path, "w", encoding="utf-8") as f:
        json.dump(seed_data, f, indent=2)
    print(f"Catalog saved with {len(scenes)} scenes and {len(scenarios)} scenarios.")
    return seed_data

def seed_database(seed_data):
    """Populates the database satellite_images table with seeded scenes."""
    try:
        import sys
        sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))
        from backend.database import Base, engine, SessionLocal
        from backend.models import SatelliteImageModel

        Base.metadata.create_all(bind=engine)
        db = SessionLocal()
        try:
            for s in seed_data.get("scenes", []):
                existing = db.query(SatelliteImageModel).filter(SatelliteImageModel.id == s["id"]).first()
                if not existing:
                    img_rec = SatelliteImageModel(
                        id=s["id"],
                        location_id=s["location_id"],
                        area_name=s["area_name"],
                        capture_date=s["capture_date"],
                        latitude=s["latitude"],
                        longitude=s["longitude"],
                        resolution_m=s.get("resolution_m", 10.0),
                        image_filename=s["image_filename"],
                        bbox=s["bbox"],
                        tags=s.get("tags", [])
                    )
                    db.add(img_rec)
            db.commit()
            count = db.query(SatelliteImageModel).count()
            print(f"Database seeded successfully with {count} satellite images.")
        finally:
            db.close()
    except Exception as e:
        print(f"Database seeding note: {e}")

def main():
    print("Generating synthetic satellite imagery pairs for hackathon demonstration...")
    generate_urban_expansion_pair()
    generate_deforestation_pair()
    generate_water_shrinkage_pair()
    generate_road_development_pair()
    catalog = build_metadata_catalog()
    seed_database(catalog)
    print("Seed asset generation complete!")

if __name__ == "__main__":
    main()
