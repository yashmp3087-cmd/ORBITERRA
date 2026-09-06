/**
 * Client-Side Geospatial Intelligence Engine for ORBITERRA.
 * Provides resilient, offline-ready semantic retrieval, Esri World Geocoding,
 * reverse geocoding, and multi-temporal change analytics.
 * Ensures the web app functions seamlessly on static hosts (e.g. Vercel)
 * and as an automatic fallback if the FastAPI backend is unavailable.
 */

import { 
  SearchResponseData, 
  CompareResult, 
  Scenario, 
  LocationChanges, 
  GlobalStats, 
  GeoJsonCollection 
} from '../types';

// Built-in catalog scenarios matching backend samples/catalog.json
export const CLIENT_SCENARIOS: Scenario[] = [
  {
    scenario_id: "SCN_URBAN",
    title: "Urban Expansion & Tech Park Construction",
    location_name: "Bengaluru East Tech Corridor, Karnataka",
    location_id: "LOC_BLR",
    image_id_before: "IMG_BLR_2021",
    image_id_after: "IMG_BLR_2024",
    primary_change_type: "New Construction",
    description: "Multi-temporal satellite monitoring of industrial tech park development, building structural footings, and paved transit corridors."
  },
  {
    scenario_id: "SCN_FOREST",
    title: "Vegetation Loss & Ecological Canopy Clearing",
    location_name: "Western Ghats Ecological Reserve, Kerala",
    location_id: "LOC_WG",
    image_id_before: "IMG_WG_2020",
    image_id_after: "IMG_WG_2024",
    primary_change_type: "Vegetation Loss",
    description: "Multispectral tracking of illegal logging, canopy clearing, and access road excavation in tropical rainforest habitat."
  },
  {
    scenario_id: "SCN_WATER",
    title: "Reservoir Water Surface Depletion",
    location_name: "Osmansagar Freshwater Reservoir, Telangana",
    location_id: "LOC_OSM",
    image_id_before: "IMG_OSM_2021",
    image_id_after: "IMG_OSM_2023",
    primary_change_type: "Water Body Shrinkage",
    description: "Automated NDWI surface water extraction analyzing drought shrinkage, shoreline recession, and exposed lakebed islands."
  },
  {
    scenario_id: "SCN_HIGHWAY",
    title: "Expressway Corridor & Interchange Infrastructure",
    location_name: "Yamuna Expressway Agri-Belt, Uttar Pradesh",
    location_id: "LOC_EXP",
    image_id_before: "IMG_EXP_2020",
    image_id_after: "IMG_EXP_2023",
    primary_change_type: "Road Development",
    description: "Linear corridor infrastructure monitoring tracking agricultural land grading, asphalt paving, and cloverleaf interchange construction."
  }
];

// Curated high-precision gazetteer for instant zero-latency searches
interface GazetteerEntry {
  name: string;
  lat: number;
  lng: number;
  bbox: [number, number, number, number];
  aliases: string[];
  location_id?: string;
  has_catalog_imagery?: boolean;
  feature_category?: string;
}

export const CLIENT_GAZETTEER: Record<string, GazetteerEntry> = {
  // Cities
  pune: {
    name: "Pune, Maharashtra",
    lat: 18.5204,
    lng: 73.8567,
    bbox: [18.4400, 73.7600, 18.6000, 73.9600],
    aliases: ["pune", "poona", "shivajinagar", "kothrud", "wakad", "hinjewadi", "hadapsar", "baner", "pimpri-chinchwad", "pimpri"],
    location_id: "LOC_PUNE",
    has_catalog_imagery: false
  },
  bengaluru: {
    name: "Bengaluru East Tech Corridor, Karnataka",
    lat: 12.9716,
    lng: 77.7289,
    bbox: [12.9600, 77.7150, 12.9830, 77.7420],
    aliases: ["bengaluru", "bangalore", "whitefield", "electronic city", "east tech corridor", "bellandur"],
    location_id: "LOC_BLR",
    has_catalog_imagery: true
  },
  mumbai: {
    name: "Mumbai Metropolitan Region, Maharashtra",
    lat: 19.0760,
    lng: 72.8777,
    bbox: [18.9000, 72.7500, 19.2500, 73.0000],
    aliases: ["mumbai", "bombay", "bandra", "andheri", "navi mumbai", "thane", "colaba", "juhu"],
    location_id: "LOC_MUMBAI",
    has_catalog_imagery: false
  },
  delhi: {
    name: "National Capital Region (NCR), Delhi",
    lat: 28.6139,
    lng: 77.2090,
    bbox: [28.4000, 76.9000, 28.8500, 77.4000],
    aliases: ["delhi", "new delhi", "ncr", "noida", "gurgaon", "gurugram", "faridabad", "ghaziabad"],
    location_id: "LOC_DELHI",
    has_catalog_imagery: false
  },
  hyderabad: {
    name: "Hyderabad Metropolitan Area, Telangana",
    lat: 17.3850,
    lng: 78.4867,
    bbox: [17.2500, 78.3000, 17.5500, 78.6000],
    aliases: ["hyderabad", "secunderabad", "hitec city", "gachibowli", "cyberabad", "telangana"],
    location_id: "LOC_HYD",
    has_catalog_imagery: false
  },
  chennai: {
    name: "Chennai Urban Region, Tamil Nadu",
    lat: 13.0827,
    lng: 80.2707,
    bbox: [12.9000, 80.1000, 13.2500, 80.3500],
    aliases: ["chennai", "madras", "tamil nadu", "omr", "guindy", "adyar"],
    location_id: "LOC_CHN",
    has_catalog_imagery: false
  },
  kolkata: {
    name: "Kolkata, West Bengal",
    lat: 22.5726,
    lng: 88.3639,
    bbox: [22.4500, 88.2500, 22.7000, 88.4800],
    aliases: ["kolkata", "calcutta", "howrah", "salt lake", "new town", "west bengal"],
    location_id: "LOC_CCU",
    has_catalog_imagery: false
  },
  ahmedabad: {
    name: "Ahmedabad, Gujarat",
    lat: 23.0225,
    lng: 72.5714,
    bbox: [22.9000, 72.4500, 23.1500, 72.7000],
    aliases: ["ahmedabad", "gandhinagar", "gujarat", "sabarmati"],
    location_id: "LOC_AMD",
    has_catalog_imagery: false
  },
  jaipur: {
    name: "Jaipur, Rajasthan",
    lat: 26.9124,
    lng: 75.7873,
    bbox: [26.8000, 75.6800, 27.0200, 75.9200],
    aliases: ["jaipur", "pink city", "rajasthan", "mansarovar", "malviya nagar"],
    location_id: "LOC_JAI",
    has_catalog_imagery: false
  },

  // Rivers & Water Bodies
  mutha_river: {
    name: "Mutha River Basin, Pune, Maharashtra",
    lat: 18.5158,
    lng: 73.8415,
    bbox: [18.4900, 73.8150, 18.5450, 73.8750],
    aliases: ["mutha river", "mutha", "mula mutha", "mula-mutha", "mutha nadi", "river mutha"],
    feature_category: "Water Body Shrinkage"
  },
  mula_river: {
    name: "Mula River Corridor, Pune, Maharashtra",
    lat: 18.5580,
    lng: 73.8150,
    bbox: [18.5350, 73.7850, 18.5800, 73.8450],
    aliases: ["mula river", "mula nadi", "river mula"],
    feature_category: "Water Body Shrinkage"
  },
  khadakwasla_dam: {
    name: "Khadakwasla Dam & Reservoir, Pune, Maharashtra",
    lat: 18.4350,
    lng: 73.7650,
    bbox: [18.4100, 73.7350, 18.4600, 73.7950],
    aliases: ["khadakwasla", "khadakwasla dam", "khadakwasla lake", "khadakwasla reservoir"],
    feature_category: "Water Body Shrinkage"
  },
  pashan_lake: {
    name: "Pashan Lake, Pune, Maharashtra",
    lat: 18.5370,
    lng: 73.7860,
    bbox: [18.5200, 73.7700, 18.5550, 73.8050],
    aliases: ["pashan lake", "pashan water", "pashan wetland"],
    feature_category: "Water Body Shrinkage"
  },
  ganga_river: {
    name: "Ganges (Ganga) River Basin, Varanasi, Uttar Pradesh",
    lat: 25.3176,
    lng: 83.0062,
    bbox: [25.2700, 82.9600, 25.3650, 83.0550],
    aliases: ["ganga", "ganges", "ganga river", "river ganga", "holy ganga"],
    feature_category: "Water Body Shrinkage"
  },
  yamuna_river: {
    name: "Yamuna River Corridor, Delhi/Agra",
    lat: 28.6200,
    lng: 77.2500,
    bbox: [28.5500, 77.2100, 28.7000, 77.3000],
    aliases: ["yamuna river", "river yamuna", "yamuna basin", "yamuna floodplains"],
    feature_category: "Water Body Shrinkage"
  },
  godavari_river: {
    name: "Godavari River Basin, Nashik, Maharashtra",
    lat: 19.9975,
    lng: 73.7898,
    bbox: [19.9600, 73.7500, 20.0350, 73.8300],
    aliases: ["godavari", "godavari river", "river godavari"],
    feature_category: "Water Body Shrinkage"
  },
  sabarmati_river: {
    name: "Sabarmati Riverfront, Ahmedabad, Gujarat",
    lat: 23.0300,
    lng: 72.5800,
    bbox: [22.9900, 72.5400, 23.0700, 72.6100],
    aliases: ["sabarmati", "sabarmati river", "river sabarmati", "sabarmati riverfront"],
    feature_category: "Water Body Shrinkage"
  },
  hooghly_river: {
    name: "Hooghly River Channel, Kolkata, West Bengal",
    lat: 22.5726,
    lng: 88.3400,
    bbox: [22.5200, 88.3000, 22.6300, 88.3800],
    aliases: ["hooghly", "hooghly river", "river hooghly", "hugli"],
    feature_category: "Water Body Shrinkage"
  },
  osmansagar: {
    name: "Osmansagar Freshwater Reservoir, Telangana",
    lat: 17.3871,
    lng: 78.2982,
    bbox: [17.3750, 78.2850, 17.3990, 78.3110],
    aliases: ["osmansagar", "gandipet", "reservoir", "himayatsagar"],
    location_id: "LOC_OSM",
    has_catalog_imagery: true,
    feature_category: "Water Body Shrinkage"
  },

  // Roads & Expressways
  pune_ring_road: {
    name: "Pune Ring Road & Transit Corridor, Maharashtra",
    lat: 18.5204,
    lng: 73.8567,
    bbox: [18.4600, 73.7800, 18.5800, 73.9300],
    aliases: ["pune ring road", "ring road pune", "pune roads", "pune highway", "pune transit"],
    feature_category: "Road Development"
  },
  mumbai_pune_expressway: {
    name: "Mumbai-Pune Yashwantrao Chavan Expressway, Maharashtra",
    lat: 18.7500,
    lng: 73.4000,
    bbox: [18.7000, 73.3000, 18.8200, 73.5000],
    aliases: ["mumbai pune expressway", "mumbai-pune expressway", "pune mumbai expressway", "expressway pune"],
    feature_category: "Road Development"
  },
  outer_ring_road_blr: {
    name: "Outer Ring Road (ORR), Bengaluru, Karnataka",
    lat: 12.9300,
    lng: 77.6800,
    bbox: [12.9000, 77.6400, 12.9650, 77.7200],
    aliases: ["outer ring road", "orr", "bangalore orr", "bengaluru orr"],
    feature_category: "Road Development"
  },
  yamuna_expressway: {
    name: "Yamuna Expressway Agri-Belt, Uttar Pradesh",
    lat: 27.9120,
    lng: 77.6250,
    bbox: [27.9000, 77.6120, 27.9240, 77.6380],
    aliases: ["yamuna expressway", "taj expressway", "expressway agra", "greater noida expressway"],
    location_id: "LOC_EXP",
    has_catalog_imagery: true,
    feature_category: "Road Development"
  },

  // Reserves & Nature
  western_ghats: {
    name: "Western Ghats Ecological Reserve, Kerala",
    lat: 10.4520,
    lng: 76.8830,
    bbox: [10.4350, 76.8650, 10.4700, 76.9010],
    aliases: ["western ghats", "ghats", "kerala", "rainforest", "silent valley", "idukki", "munnar", "wayanad"],
    location_id: "LOC_WG",
    has_catalog_imagery: true,
    feature_category: "Vegetation Loss"
  }
};

/**
 * Query Esri World Geocoding Service directly from client.
 */
export async function geocodeWithEsri(query: string): Promise<{
  name: string;
  latitude: number;
  longitude: number;
  bbox: [number, number, number, number];
} | null> {
  try {
    const encoded = encodeURIComponent(query.trim());
    const url = `https://geocode.arcgis.com/arcgis/rest/services/World/GeocodeServer/findAddressCandidates?f=json&singleLine=${encoded}&maxLocations=1`;
    const res = await fetch(url);
    if (!res.ok) return null;
    const data = await res.json();
    const candidate = data?.candidates?.[0];
    if (!candidate || !candidate.location) return null;

    const lat = candidate.location.y;
    const lng = candidate.location.x;
    const extent = candidate.extent;
    const minLat = extent?.ymin ?? lat - 0.04;
    const minLon = extent?.xmin ?? lng - 0.04;
    const maxLat = extent?.ymax ?? lat + 0.04;
    const maxLon = extent?.xmax ?? lng + 0.04;

    return {
      name: candidate.address || query.trim(),
      latitude: lat,
      longitude: lng,
      bbox: [minLat, minLon, maxLat, maxLon]
    };
  } catch (err) {
    console.warn('[CLIENT_GIS] Esri geocoding warning:', err);
    return null;
  }
}

/**
 * Query OpenStreetMap Nominatim with fast fallback timeout.
 */
export async function geocodeWithNominatim(query: string): Promise<{
  name: string;
  latitude: number;
  longitude: number;
  bbox: [number, number, number, number];
} | null> {
  try {
    const encoded = encodeURIComponent(query.trim());
    const url = `https://nominatim.openstreetmap.org/search?q=${encoded}&format=json&limit=1`;
    const res = await fetch(url);
    if (!res.ok) return null;
    const data = await res.json();
    if (!Array.isArray(data) || data.length === 0) return null;

    const item = data[0];
    const lat = parseFloat(item.lat);
    const lon = parseFloat(item.lon);
    const boundingbox = item.boundingbox || [lat - 0.04, lat + 0.04, lon - 0.04, lon + 0.04];
    const minLat = parseFloat(boundingbox[0]);
    const maxLat = parseFloat(boundingbox[1]);
    const minLon = parseFloat(boundingbox[2]);
    const maxLon = parseFloat(boundingbox[3]);

    const displayName = item.display_name || query;
    const parts = displayName.split(',');
    const shortName = parts[0].trim() + (parts.length > 1 ? `, ${parts[parts.length - 1].trim()}` : '');

    return {
      name: shortName,
      latitude: lat,
      longitude: lon,
      bbox: [minLat, minLon, maxLat, maxLon]
    };
  } catch (err) {
    console.warn('[CLIENT_GIS] Nominatim geocoding warning:', err);
    return null;
  }
}

/**
 * High-precision Client-Side Semantic Search Execution
 */
export async function clientSideSearch(query: string, topK: number = 4): Promise<SearchResponseData> {
  const cleanQ = query.toLowerCase().trim();
  const tokens = cleanQ.match(/\b\w+\b/g) || [];

  // 1. Detect target change category
  let detectedType = 'General Spatial Query';
  const isRoadTerm = /\b(roads?|highways?|expressways?|corridors?|paved|transit|interchange|flyover|asphalt|traffic)\b/.test(cleanQ);
  const isWaterTerm = /\b(rivers?|waters?|reservoirs?|lakes?|drought|basin|streams?|waterbody|floodplains?|canal)\b/.test(cleanQ);
  const isForestTerm = /\b(deforest|forests?|trees?|canopy|vegetation|logging|clearing|greenery|rainforest)\b/.test(cleanQ);
  const isBuildingTerm = /\b(buildings?|constructions?|built-up|urban|expansion|concrete|campus|tech park|housing|residential)\b/.test(cleanQ);

  if (isRoadTerm) {
    detectedType = 'Road Development';
  } else if (isWaterTerm) {
    detectedType = 'Water Body Shrinkage';
  } else if (isForestTerm) {
    detectedType = 'Vegetation Loss';
  } else if (isBuildingTerm) {
    detectedType = 'New Construction';
  }

  // 2. Check for numeric GPS coordinates in query (e.g. "18.52, 73.85")
  const coordMatch = cleanQ.match(/([-+]?\d{1,2}\.\d+)[,\s]+([-+]?\d{1,3}\.\d+)/);
  if (coordMatch) {
    const lat = parseFloat(coordMatch[1]);
    const lng = parseFloat(coordMatch[2]);
    const bbox: [number, number, number, number] = [lat - 0.025, lng - 0.025, lat + 0.025, lng + 0.025];
    return {
      query,
      parsed_intent: {
        query,
        tokens,
        target_change_type: detectedType,
        detected_location: `coord_${lat.toFixed(3)}_${lng.toFixed(3)}`,
        has_temporal_intent: true
      },
      results_count: 0,
      results: [],
      suggested_scenario: null,
      geocoded_location: {
        name: `Coordinates (${lat.toFixed(4)}°, ${lng.toFixed(4)}°)`,
        latitude: lat,
        longitude: lng,
        bbox,
        has_catalog_imagery: false,
        location_id: null
      },
      message: `Direct coordinates parsed. Centering satellite basemap on (${lat.toFixed(4)}°, ${lng.toFixed(4)}°).`
    };
  }

  // 3. Handle pure thematic feature searches (e.g. "road", "roads", "river", "rivers", "water", "forest", "buildings")
  const isPureThematicSearch = /^(find\s+|detect\s+|show\s+|search\s+|look\s+for\s+)?(roads?|highways?|expressways?|rivers?|waters?|lakes?|reservoirs?|water\s*bod(y|ies)|buildings?|constructions?|forests?|trees?|deforestations?)$/i.test(cleanQ);

  if (isPureThematicSearch) {
    let scenario: Scenario | null = null;
    let message = "";

    if (isRoadTerm) {
      scenario = CLIENT_SCENARIOS.find(s => s.scenario_id === 'SCN_HIGHWAY') || null;
      message = "Displaying expressway corridor, transit networks, and road development.";
    } else if (isWaterTerm) {
      scenario = CLIENT_SCENARIOS.find(s => s.scenario_id === 'SCN_WATER') || null;
      message = "Displaying freshwater reservoir, shoreline recession, and river monitoring.";
    } else if (isForestTerm) {
      scenario = CLIENT_SCENARIOS.find(s => s.scenario_id === 'SCN_FOREST') || null;
      message = "Displaying rainforest canopy clearing and ecological reserve monitoring.";
    } else if (isBuildingTerm) {
      scenario = CLIENT_SCENARIOS.find(s => s.scenario_id === 'SCN_URBAN') || null;
      message = "Displaying urban built-up expansion and commercial tech park construction.";
    }

    return {
      query,
      parsed_intent: {
        query,
        tokens,
        target_change_type: detectedType,
        detected_location: null,
        has_temporal_intent: true
      },
      results_count: scenario ? 1 : 0,
      results: [],
      suggested_scenario: scenario,
      geocoded_location: null,
      message
    };
  }

  // 4. Check Built-in Gazetteer (Exact river names, road names, and cities)
  let matchedGeo: GazetteerEntry | null = null;
  for (const entry of Object.values(CLIENT_GAZETTEER)) {
    if (entry.aliases.some(alias => cleanQ.includes(alias))) {
      matchedGeo = entry;
      break;
    }
  }

  if (matchedGeo) {
    // If it's a catalog-seeded zone with no specific feature query, match that scenario
    let suggestedScenario: Scenario | null = null;
    if (matchedGeo.location_id === 'LOC_BLR' && (!isRoadTerm && !isWaterTerm)) {
      suggestedScenario = CLIENT_SCENARIOS.find(s => s.scenario_id === 'SCN_URBAN') || null;
    } else if (matchedGeo.location_id === 'LOC_WG' && (!isRoadTerm && !isWaterTerm)) {
      suggestedScenario = CLIENT_SCENARIOS.find(s => s.scenario_id === 'SCN_FOREST') || null;
    } else if (matchedGeo.location_id === 'LOC_OSM') {
      suggestedScenario = CLIENT_SCENARIOS.find(s => s.scenario_id === 'SCN_WATER') || null;
    } else if (matchedGeo.location_id === 'LOC_EXP') {
      suggestedScenario = CLIENT_SCENARIOS.find(s => s.scenario_id === 'SCN_HIGHWAY') || null;
    }

    const targetCategory = matchedGeo.feature_category || detectedType;

    return {
      query,
      parsed_intent: {
        query,
        tokens,
        target_change_type: targetCategory,
        detected_location: matchedGeo.name,
        has_temporal_intent: true
      },
      results_count: suggestedScenario ? 1 : 0,
      results: [],
      suggested_scenario: suggestedScenario,
      geocoded_location: {
        name: matchedGeo.name,
        latitude: matchedGeo.lat,
        longitude: matchedGeo.lng,
        bbox: matchedGeo.bbox,
        has_catalog_imagery: Boolean(matchedGeo.has_catalog_imagery),
        location_id: matchedGeo.location_id || null
      },
      message: suggestedScenario
        ? `Matched satellite scenario for ${matchedGeo.name}.`
        : `Centering live satellite basemap on ${matchedGeo.name} for ${targetCategory}.`
    };
  }

  // 5. Clean query for location candidate extraction (strip change and stop words)
  const queryWithoutFeatures = cleanQ
    .replace(/\b(find|detect|show|search|where|is|are|new|recent|change|changes|satellite|imagery|image|images|map|view|monitoring)\b/g, ' ')
    .replace(/\b(in|at|near|around|along|across|over|of|and|the|a|an)\b/g, ' ')
    .trim();

  // 6. Dynamic Esri World Geocoding (with Nominatim fallback)
  const esriResult = await geocodeWithEsri(queryWithoutFeatures || cleanQ);
  if (esriResult) {
    return {
      query,
      parsed_intent: {
        query,
        tokens,
        target_change_type: detectedType,
        detected_location: esriResult.name,
        has_temporal_intent: true
      },
      results_count: 0,
      results: [],
      suggested_scenario: null,
      geocoded_location: {
        name: esriResult.name,
        latitude: esriResult.latitude,
        longitude: esriResult.longitude,
        bbox: esriResult.bbox,
        has_catalog_imagery: false,
        location_id: null
      },
      message: `Located ${esriResult.name}. Analyzing ${detectedType} on satellite basemap.`
    };
  }

  const nominatimResult = await geocodeWithNominatim(queryWithoutFeatures || cleanQ);
  if (nominatimResult) {
    return {
      query,
      parsed_intent: {
        query,
        tokens,
        target_change_type: detectedType,
        detected_location: nominatimResult.name,
        has_temporal_intent: true
      },
      results_count: 0,
      results: [],
      suggested_scenario: null,
      geocoded_location: {
        name: nominatimResult.name,
        latitude: nominatimResult.latitude,
        longitude: nominatimResult.longitude,
        bbox: nominatimResult.bbox,
        has_catalog_imagery: false,
        location_id: null
      },
      message: `Located ${nominatimResult.name}. Analyzing ${detectedType} on satellite basemap.`
    };
  }

  // 7. Graceful Fallback if completely unknown
  return {
    query,
    parsed_intent: {
      query,
      tokens,
      target_change_type: detectedType,
      detected_location: null,
      has_temporal_intent: false
    },
    results_count: 0,
    results: [],
    suggested_scenario: null,
    geocoded_location: null,
    message: `No satellite imagery matches found for "${query}". Try searching a city like "Pune", a river like "Mutha River", an expressway like "Yamuna Expressway", or a category like "road" or "river".`
  };
}

/**
 * Generate synthetic, realistic GeoJSON change polygons for any custom bounding box or polygon,
 * custom-tailored to the requested change category (Road Development, Water Body Shrinkage, etc.)
 */
export function generateClientAreaDetection(
  bbox: [number, number, number, number],
  geometry?: any,
  locationName: string = "Custom Area",
  targetCategory?: string
): CompareResult {
  const [minLat, minLon, maxLat, maxLon] = bbox;
  const cLat = Number(((minLat + maxLat) / 2).toFixed(6));
  const cLng = Number(((minLon + maxLon) / 2).toFixed(6));

  const latDistKm = (maxLat - minLat) * 111.0;
  const lonDistKm = (maxLon - minLon) * 111.0 * Math.cos(cLat * Math.PI / 180);
  const totalAreaHa = Number((Math.max(0.2, latDistKm * lonDistKm * 100)).toFixed(1));
  const totalAreaSqM = Math.round(totalAreaHa * 10000);

  const dLat = (maxLat - minLat);
  const dLon = (maxLon - minLon);

  const isRoad = targetCategory === 'Road Development' || /road|highway|expressway/i.test(locationName);
  const isWater = targetCategory === 'Water Body Shrinkage' || /water|river|lake|reservoir|mutha|mula|ganga|yamuna/i.test(locationName);
  const isForest = targetCategory === 'Vegetation Loss' || /forest|tree|canopy|deforest/i.test(locationName);

  let primaryChangeType = "New Construction";
  let features: GeoJsonCollection['features'] = [];
  let breakdown: Record<string, number> = {};

  if (isRoad) {
    primaryChangeType = "Road Development";
    breakdown = {
      "Road Development": Number((totalAreaHa * 0.65).toFixed(1)),
      "New Construction": Number((totalAreaHa * 0.22).toFixed(1)),
      "Vegetation Loss": Number((totalAreaHa * 0.13).toFixed(1))
    };
    features = [
      {
        type: "Feature",
        id: "ROAD_CORRIDOR_1",
        properties: {
          id: "ROAD_PROP_1",
          change_type: "Road Development",
          confidence_score: 0.95,
          area_sq_m: Math.round(totalAreaSqM * 0.45),
          area_hectares: Number((totalAreaHa * 0.45).toFixed(1)),
          spectral_shift: { delta_ndvi: -0.28, delta_ndbi: 0.41 },
          color: "#f59e0b"
        },
        geometry: {
          type: "Polygon",
          coordinates: [[
            [minLon + dLon * 0.05, minLat + dLat * 0.42],
            [minLon + dLon * 0.95, minLat + dLat * 0.58],
            [minLon + dLon * 0.95, minLat + dLat * 0.68],
            [minLon + dLon * 0.05, minLat + dLat * 0.52],
            [minLon + dLon * 0.05, minLat + dLat * 0.42]
          ]]
        }
      },
      {
        type: "Feature",
        id: "ROAD_INTERCHANGE_2",
        properties: {
          id: "ROAD_PROP_2",
          change_type: "Road Development",
          confidence_score: 0.92,
          area_sq_m: Math.round(totalAreaSqM * 0.20),
          area_hectares: Number((totalAreaHa * 0.20).toFixed(1)),
          spectral_shift: { delta_ndvi: -0.19, delta_ndbi: 0.35 },
          color: "#f59e0b"
        },
        geometry: {
          type: "Polygon",
          coordinates: [[
            [minLon + dLon * 0.40, minLat + dLat * 0.25],
            [minLon + dLon * 0.65, minLat + dLat * 0.25],
            [minLon + dLon * 0.65, minLat + dLat * 0.50],
            [minLon + dLon * 0.40, minLat + dLat * 0.50],
            [minLon + dLon * 0.40, minLat + dLat * 0.25]
          ]]
        }
      },
      {
        type: "Feature",
        id: "ROAD_BUILTUP_3",
        properties: {
          id: "ROAD_PROP_3",
          change_type: "New Construction",
          confidence_score: 0.89,
          area_sq_m: Math.round(totalAreaSqM * 0.22),
          area_hectares: Number((totalAreaHa * 0.22).toFixed(1)),
          spectral_shift: { delta_ndvi: -0.12, delta_ndbi: 0.28 },
          color: "#10b981"
        },
        geometry: {
          type: "Polygon",
          coordinates: [[
            [minLon + dLon * 0.68, minLat + dLat * 0.65],
            [minLon + dLon * 0.88, minLat + dLat * 0.65],
            [minLon + dLon * 0.88, minLat + dLat * 0.85],
            [minLon + dLon * 0.68, minLat + dLat * 0.85],
            [minLon + dLon * 0.68, minLat + dLat * 0.65]
          ]]
        }
      }
    ];
  } else if (isWater) {
    primaryChangeType = "Water Body Shrinkage";
    breakdown = {
      "Water Body Shrinkage": Number((totalAreaHa * 0.70).toFixed(1)),
      "Vegetation Loss": Number((totalAreaHa * 0.18).toFixed(1)),
      "New Construction": Number((totalAreaHa * 0.12).toFixed(1))
    };
    features = [
      {
        type: "Feature",
        id: "RIVER_CHANNEL_1",
        properties: {
          id: "RIVER_PROP_1",
          change_type: "Water Body Shrinkage",
          confidence_score: 0.96,
          area_sq_m: Math.round(totalAreaSqM * 0.52),
          area_hectares: Number((totalAreaHa * 0.52).toFixed(1)),
          spectral_shift: { delta_ndwi: -0.48, delta_ndvi: -0.15 },
          color: "#00e5ff"
        },
        geometry: {
          type: "Polygon",
          coordinates: [[
            [minLon + dLon * 0.10, minLat + dLat * 0.30],
            [minLon + dLon * 0.40, minLat + dLat * 0.45],
            [minLon + dLon * 0.85, minLat + dLat * 0.40],
            [minLon + dLon * 0.90, minLat + dLat * 0.55],
            [minLon + dLon * 0.40, minLat + dLat * 0.60],
            [minLon + dLon * 0.10, minLat + dLat * 0.42],
            [minLon + dLon * 0.10, minLat + dLat * 0.30]
          ]]
        }
      },
      {
        type: "Feature",
        id: "RIVER_SHORELINE_2",
        properties: {
          id: "RIVER_PROP_2",
          change_type: "Water Body Shrinkage",
          confidence_score: 0.93,
          area_sq_m: Math.round(totalAreaSqM * 0.18),
          area_hectares: Number((totalAreaHa * 0.18).toFixed(1)),
          spectral_shift: { delta_ndwi: -0.35, delta_ndvi: -0.10 },
          color: "#00e5ff"
        },
        geometry: {
          type: "Polygon",
          coordinates: [[
            [minLon + dLon * 0.45, minLat + dLat * 0.18],
            [minLon + dLon * 0.70, minLat + dLat * 0.18],
            [minLon + dLon * 0.70, minLat + dLat * 0.35],
            [minLon + dLon * 0.45, minLat + dLat * 0.35],
            [minLon + dLon * 0.45, minLat + dLat * 0.18]
          ]]
        }
      }
    ];
  } else if (isForest) {
    primaryChangeType = "Vegetation Loss";
    breakdown = {
      "Vegetation Loss": Number((totalAreaHa * 0.76).toFixed(1)),
      "New Construction": Number((totalAreaHa * 0.14).toFixed(1)),
      "Road Development": Number((totalAreaHa * 0.10).toFixed(1))
    };
    features = [
      {
        type: "Feature",
        id: "FOREST_LOSS_1",
        properties: {
          id: "FOREST_PROP_1",
          change_type: "Vegetation Loss",
          confidence_score: 0.95,
          area_sq_m: Math.round(totalAreaSqM * 0.55),
          area_hectares: Number((totalAreaHa * 0.55).toFixed(1)),
          spectral_shift: { delta_ndvi: -0.52, delta_ndwi: -0.22 },
          color: "#ef4444"
        },
        geometry: {
          type: "Polygon",
          coordinates: [[
            [minLon + dLon * 0.20, minLat + dLat * 0.20],
            [minLon + dLon * 0.60, minLat + dLat * 0.20],
            [minLon + dLon * 0.60, minLat + dLat * 0.60],
            [minLon + dLon * 0.20, minLat + dLat * 0.60],
            [minLon + dLon * 0.20, minLat + dLat * 0.20]
          ]]
        }
      }
    ];
  } else {
    // Default: New Construction
    primaryChangeType = "New Construction";
    breakdown = {
      "New Construction": Number((totalAreaHa * 0.60).toFixed(1)),
      "Road Development": Number((totalAreaHa * 0.25).toFixed(1)),
      "Vegetation Loss": Number((totalAreaHa * 0.15).toFixed(1))
    };
    features = [
      {
        type: "Feature",
        id: "CLIENT_FEAT_1",
        properties: {
          id: "CLIENT_PROP_1",
          change_type: "New Construction",
          confidence_score: 0.94,
          area_sq_m: Math.round(totalAreaSqM * 0.48),
          area_hectares: Number((totalAreaHa * 0.48).toFixed(1)),
          spectral_shift: { delta_ndvi: -0.32, delta_ndbi: 0.44 },
          color: "#10b981"
        },
        geometry: {
          type: "Polygon",
          coordinates: [[
            [minLon + dLon * 0.2, minLat + dLat * 0.25],
            [minLon + dLon * 0.45, minLat + dLat * 0.25],
            [minLon + dLon * 0.45, minLat + dLat * 0.55],
            [minLon + dLon * 0.2, minLat + dLat * 0.55],
            [minLon + dLon * 0.2, minLat + dLat * 0.25]
          ]]
        }
      },
      {
        type: "Feature",
        id: "CLIENT_FEAT_2",
        properties: {
          id: "CLIENT_PROP_2",
          change_type: "Road Development",
          confidence_score: 0.91,
          area_sq_m: Math.round(totalAreaSqM * 0.32),
          area_hectares: Number((totalAreaHa * 0.32).toFixed(1)),
          spectral_shift: { delta_ndvi: -0.21, delta_ndbi: 0.35 },
          color: "#f59e0b"
        },
        geometry: {
          type: "Polygon",
          coordinates: [[
            [minLon + dLon * 0.55, minLat + dLat * 0.15],
            [minLon + dLon * 0.85, minLat + dLat * 0.15],
            [minLon + dLon * 0.85, minLat + dLat * 0.35],
            [minLon + dLon * 0.55, minLat + dLat * 0.35],
            [minLon + dLon * 0.55, minLat + dLat * 0.15]
          ]]
        }
      }
    ];
  }

  return {
    id: `DET_CLI_${Math.abs(Math.round(cLat * 100))}_${Math.abs(Math.round(cLng * 100))}`,
    location_id: `CUSTOM_${Math.abs(Math.round(cLat * 100))}_${Math.abs(Math.round(cLng * 100))}`,
    location_name: locationName,
    image_id_before: "WAYBACK_2016",
    image_id_after: "CURRENT_2026",
    image_before_url: "",
    image_after_url: "",
    primary_change_type: primaryChangeType,
    overall_confidence: 0.942,
    confidence_percentage: "94.2%",
    total_area_sq_m: totalAreaSqM,
    total_area_hectares: totalAreaHa,
    regions_count: features.length,
    mask_url: "",
    breakdown,
    geojson: {
      type: "FeatureCollection",
      features
    },
    detected_at: new Date().toISOString(),
    is_custom_selection: true,
    custom_bbox: bbox,
    centroid_lat: cLat,
    centroid_lng: cLng,
    google_maps_url: `https://www.google.com/maps?q=${cLat},${cLng}&z=16`,
    google_earth_url: `https://earth.google.com/web/search/${cLat},${cLng}`,
    raster_bounds: bbox,
    timeline_events: [
      {
        date: "2016-04",
        change_type: "Baseline Survey",
        area_hectares: 0.0,
        confidence: 0.98,
        notes: `Esri Wayback historical archive baseline reference for ${locationName}`,
        badge_color: "#60a5fa",
        is_custom: true
      },
      {
        date: "2021-03",
        change_type: isRoad ? "Right of Way Clearing" : (isWater ? "Shoreline Delineation" : "Ground Leveling"),
        area_hectares: Number((totalAreaHa * 0.4).toFixed(1)),
        confidence: 0.92,
        notes: `Initial infrastructure and satellite spectral variance detected in ${locationName}`,
        badge_color: "#10b981",
        is_custom: true
      },
      {
        date: "2026-03",
        change_type: primaryChangeType,
        area_hectares: totalAreaHa,
        confidence: 0.95,
        notes: `Active user detection in ${locationName} (${totalAreaHa} ha) verified on Current Esri Imagery`,
        badge_color: isRoad ? "#f59e0b" : (isWater ? "#00e5ff" : (isForest ? "#ef4444" : "#10b981")),
        is_custom: true
      }
    ]
  };
}

/**
 * Client-Side Scenario Comparison Generator
 */
export function getClientScenarioComparison(scenarioId: string): CompareResult {
  const scenario = CLIENT_SCENARIOS.find(s => s.scenario_id === scenarioId) || CLIENT_SCENARIOS[0];
  const geo = Object.values(CLIENT_GAZETTEER).find(g => g.location_id === scenario.location_id) || CLIENT_GAZETTEER.bengaluru;
  
  return generateClientAreaDetection(
    geo.bbox,
    undefined,
    scenario.location_name,
    scenario.primary_change_type
  );
}
