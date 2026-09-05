-- PostgreSQL + PostGIS Schema for Semantic Retrieval & Multi-Temporal Change Analysis

-- 1. Enable PostGIS Extension
CREATE EXTENSION IF NOT EXISTS postgis;

-- 2. Satellite Images Metadata Table
CREATE TABLE IF NOT EXISTS satellite_images (
    id VARCHAR(64) PRIMARY KEY,
    location_id VARCHAR(64) NOT NULL,
    area_name VARCHAR(255) NOT NULL,
    capture_date DATE NOT NULL,
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    resolution_m DOUBLE PRECISION NOT NULL DEFAULT 10.0,
    image_path VARCHAR(512) NOT NULL,
    thumbnail_path VARCHAR(512),
    bbox_min_lat DOUBLE PRECISION NOT NULL,
    bbox_min_lon DOUBLE PRECISION NOT NULL,
    bbox_max_lat DOUBLE PRECISION NOT NULL,
    bbox_max_lon DOUBLE PRECISION NOT NULL,
    geom GEOMETRY(Point, 4326),
    tags TEXT[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Spatial index on image center points
CREATE INDEX IF NOT EXISTS idx_satellite_images_geom ON satellite_images USING GIST (geom);
CREATE INDEX IF NOT EXISTS idx_satellite_images_loc_date ON satellite_images (location_id, capture_date);

-- 3. Change Detections Table
CREATE TABLE IF NOT EXISTS change_detections (
    id VARCHAR(64) PRIMARY KEY,
    location_id VARCHAR(64) NOT NULL,
    image_id_before VARCHAR(64) REFERENCES satellite_images(id),
    image_id_after VARCHAR(64) REFERENCES satellite_images(id),
    change_type VARCHAR(64) NOT NULL, -- 'New Construction', 'Vegetation Loss', 'Water Body Shrinkage', 'Road Development'
    confidence_score DOUBLE PRECISION NOT NULL,
    area_sq_m DOUBLE PRECISION NOT NULL,
    change_mask_path VARCHAR(512),
    change_geom GEOMETRY(Geometry, 4326), -- Polygon or MultiPolygon in WGS84
    details JSONB,
    detected_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Spatial index on change polygons
CREATE INDEX IF NOT EXISTS idx_change_detections_geom ON change_detections USING GIST (change_geom);
CREATE INDEX IF NOT EXISTS idx_change_detections_location ON change_detections (location_id);

-- 4. Search Queries & Semantic Retrieval Audit Table
CREATE TABLE IF NOT EXISTS search_queries (
    id SERIAL PRIMARY KEY,
    query_text TEXT NOT NULL,
    parsed_intent JSONB,
    matched_results_count INT DEFAULT 0,
    location_geom GEOMETRY(Point, 4326),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_search_queries_created ON search_queries (created_at DESC);
