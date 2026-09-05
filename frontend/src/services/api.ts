import { 
  SearchResponseData, 
  CompareResult, 
  Scenario, 
  SatelliteImage, 
  LocationChanges, 
  GlobalStats 
} from '../types';

const API_BASE = '';

export async function searchScenes(query: string, topK: number = 4): Promise<SearchResponseData> {
  const res = await fetch(`${API_BASE}/api/search`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query, top_k: topK })
  });
  if (!res.ok) {
    throw new Error(`Search failed: ${res.statusText}`);
  }
  return res.json();
}

export async function compareScenes(params: {
  scenario_id?: string;
  image_id_before?: string;
  image_id_after?: string;
  location_id?: string;
  custom_bbox?: number[];
  custom_geometry?: any;
}): Promise<CompareResult> {
  const res = await fetch(`${API_BASE}/api/compare`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params)
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(errorData.detail || `Comparison failed: ${res.statusText}`);
  }
  return res.json();
}

export async function fetchTimeline(params: {
  location_id?: string;
  custom_bbox?: number[];
}): Promise<{ timeline_events: any[]; is_custom_selection: boolean }> {
  const res = await fetch(`${API_BASE}/api/changes/timeline`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params)
  });
  if (!res.ok) {
    throw new Error(`Failed to fetch timeline: ${res.statusText}`);
  }
  return res.json();
}

export async function fetchImages(params?: {
  location_id?: string;
  tag?: string;
  period?: string;
}): Promise<{ count: number; images: SatelliteImage[] }> {
  const query = new URLSearchParams();
  if (params?.location_id) query.set('location_id', params.location_id);
  if (params?.tag) query.set('tag', params.tag);
  if (params?.period) query.set('period', params.period);

  const res = await fetch(`${API_BASE}/api/images?${query.toString()}`);
  if (!res.ok) {
    throw new Error(`Fetch images failed: ${res.statusText}`);
  }
  return res.json();
}

export async function fetchScenarios(): Promise<{ count: number; scenarios: Scenario[] }> {
  const res = await fetch(`${API_BASE}/api/scenarios`);
  if (!res.ok) {
    throw new Error(`Fetch scenarios failed: ${res.statusText}`);
  }
  return res.json();
}

export async function fetchChanges(locationId: string): Promise<LocationChanges> {
  const res = await fetch(`${API_BASE}/api/changes/${locationId}`);
  if (!res.ok) {
    throw new Error(`Fetch changes failed: ${res.statusText}`);
  }
  return res.json();
}

export async function fetchStats(): Promise<GlobalStats> {
  const res = await fetch(`${API_BASE}/api/stats`);
  if (!res.ok) {
    throw new Error(`Fetch stats failed: ${res.statusText}`);
  }
  return res.json();
}
