export interface SatelliteImage {
  id: string;
  location_id: string;
  area_name: string;
  capture_date: string;
  latitude: number;
  longitude: number;
  resolution_m: number;
  image_filename: string;
  image_url: string;
  bbox: [number, number, number, number];
  tags: string[];
  period?: string;
}

export interface Scenario {
  scenario_id: string;
  title: string;
  location_name: string;
  location_id: string;
  image_id_before: string;
  image_id_after: string;
  primary_change_type: string;
  description: string;
}

export interface SearchResult {
  scene: SatelliteImage;
  relevance_score: number;
  confidence_percentage: string;
  explanation: string;
}

export interface ParsedIntent {
  query: string;
  tokens: string[];
  target_change_type: string;
  detected_location: string | null;
  has_temporal_intent: boolean;
}

export interface GeocodedLocation {
  name: string;
  latitude: number;
  longitude: number;
  bbox: [number, number, number, number];
  has_catalog_imagery: boolean;
  location_id?: string | null;
}

export interface SearchResponseData {
  query: string;
  parsed_intent: ParsedIntent;
  results_count: number;
  results: SearchResult[];
  suggested_scenario?: Scenario | null;
  geocoded_location?: GeocodedLocation | null;
  message?: string | null;
}

export interface GeoJsonFeature {
  type: "Feature";
  id: string;
  properties: {
    id: string;
    change_type: string;
    confidence_score: number;
    area_sq_m: number;
    area_hectares: number;
    spectral_shift?: {
      delta_ndvi?: number;
      delta_ndbi?: number;
      delta_ndwi?: number;
    };
    color: string;
  };
  geometry: {
    type: "Polygon";
    coordinates: number[][][];
  };
}

export interface GeoJsonCollection {
  type: "FeatureCollection";
  features: GeoJsonFeature[];
}

export interface TimelineEventItem {
  date: string;
  change_type: string;
  area_hectares: number;
  confidence: number;
  notes: string;
  badge_color?: string;
  is_custom?: boolean;
}

export interface CompareResult {
  id: string;
  location_id: string;
  location_name: string;
  image_id_before: string;
  image_id_after: string;
  image_before_url: string;
  image_after_url: string;
  primary_change_type: string;
  overall_confidence: number;
  confidence_percentage: string;
  total_area_sq_m: number;
  total_area_hectares: number;
  regions_count: number;
  mask_url: string;
  breakdown: Record<string, number>;
  geojson: GeoJsonCollection;
  detected_at: string;
  is_custom_selection?: boolean;
  custom_bbox?: number[];
  timeline_events?: TimelineEventItem[];
  centroid_lat?: number;
  centroid_lng?: number;
  google_maps_url?: string;
  google_earth_url?: string;
  raster_bounds?: [number, number, number, number];
}

export interface TimelineEvent {
  date: string;
  change_type: string;
  area_hectares: number;
  confidence: number;
  notes: string;
}

export interface ChartDataPoint {
  period: string;
  [key: string]: string | number;
}

export interface LocationChanges {
  location_id: string;
  location_name: string;
  latitude: number;
  longitude: number;
  total_historical_events: number;
  timeline: TimelineEvent[];
  summary_chart_data: ChartDataPoint[];
}

export interface GlobalStats {
  monitored_regions: number;
  total_scenes_cataloged: number;
  total_area_monitored_hectares: number;
  active_ai_models: string[];
  average_inference_latency_ms: number;
  model_confidence_benchmark: string;
}
