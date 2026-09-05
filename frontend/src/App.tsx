import React, { useState, useEffect } from 'react';
import { Layers, Sliders, Map as MapIcon, RefreshCw, Eye, EyeOff, AlertCircle } from 'lucide-react';
import { Navbar } from './components/Navbar';
import { SearchBar } from './components/SearchBar';
import { BeforeAfterSlider } from './components/BeforeAfterSlider';
import { MapView } from './components/MapView';
import { ResultsPanel } from './components/ResultsPanel';
import { 
  fetchScenarios, 
  fetchStats, 
  compareScenes, 
  searchScenes, 
  fetchChanges 
} from './services/api';
import { 
  Scenario, 
  CompareResult, 
  LocationChanges, 
  GlobalStats, 
  ParsedIntent 
} from './types';

export const App: React.FC = () => {
  const [scenarios, setScenarios] = useState<Scenario[]>([]);
  const [activeScenario, setActiveScenario] = useState<Scenario | null>(null);
  const [comparison, setComparison] = useState<CompareResult | null>(null);
  const [locationChanges, setLocationChanges] = useState<LocationChanges | null>(null);
  const [stats, setStats] = useState<GlobalStats | null>(null);
  const [parsedIntent, setParsedIntent] = useState<ParsedIntent | null>(null);

  const [viewMode, setViewMode] = useState<'slider' | 'map'>('map');
  const [showMaskOnSlider, setShowMaskOnSlider] = useState<boolean>(true);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Custom Area Selection State
  const [customBbox, setCustomBbox] = useState<[number, number, number, number] | null>(null);
  const [isCustomLoading, setIsCustomLoading] = useState<boolean>(false);
  const [customError, setCustomError] = useState<string | null>(null);
  const [searchNotice, setSearchNotice] = useState<{ message: string; type: 'info' | 'warn' } | null>(null);

  // Default Pune Location Comparison Model
  const loadDefaultPuneComparison = () => {
    setActiveScenario(null);
    setCustomBbox(null);
    setCustomError(null);
    setSearchNotice(null);

    setComparison({
      id: 'COMP_PUNE_DEFAULT',
      location_id: 'LOC_PUNE',
      location_name: 'Pune, Maharashtra',
      image_id_before: '2021 Baseline',
      image_id_after: 'Current Live Imagery',
      image_before_url: '',
      image_after_url: '',
      mask_url: '',
      raster_bounds: [18.5050, 73.8400, 18.5358, 73.8734],
      regions_count: 3,
      primary_change_type: 'New Construction',
      overall_confidence: 0.948,
      confidence_percentage: '94.8%',
      total_area_sq_m: 258000,
      total_area_hectares: 25.8,
      breakdown: {
        'New Construction': 14.2,
        'Road Development': 6.5,
        'Vegetation Loss': 5.1
      },
      detected_at: '2024-03-20T00:00:00Z',
      centroid_lat: 18.5204,
      centroid_lng: 73.8567,
      google_maps_url: 'https://www.google.com/maps?q=18.5204,73.8567&z=14',
      google_earth_url: 'https://earth.google.com/web/search/18.5204,73.8567',
      geojson: {
        type: 'FeatureCollection',
        features: [
          {
            type: 'Feature',
            id: 'FEAT-PUNE-1',
            geometry: {
              type: 'Polygon',
              coordinates: [[
                [73.8450, 18.5150],
                [73.8650, 18.5150],
                [73.8650, 18.5270],
                [73.8450, 18.5270],
                [73.8450, 18.5150]
              ]]
            },
            properties: {
              id: 'PROP-PUNE-1',
              change_type: 'New Construction',
              color: '#00e5ff',
              confidence_score: 0.95,
              area_hectares: 14.2,
              area_sq_m: 142000,
              spectral_shift: { delta_ndvi: -0.34, delta_ndbi: 0.42 }
            }
          },
          {
            type: 'Feature',
            id: 'FEAT-PUNE-2',
            geometry: {
              type: 'Polygon',
              coordinates: [[
                [73.8500, 18.5280],
                [73.8620, 18.5280],
                [73.8620, 18.5340],
                [73.8500, 18.5340],
                [73.8500, 18.5280]
              ]]
            },
            properties: {
              id: 'PROP-PUNE-2',
              change_type: 'Road Development',
              color: '#f59e0b',
              confidence_score: 0.91,
              area_hectares: 6.5,
              area_sq_m: 65000,
              spectral_shift: { delta_ndvi: -0.22, delta_ndbi: 0.35 }
            }
          },
          {
            type: 'Feature',
            id: 'FEAT-PUNE-3',
            geometry: {
              type: 'Polygon',
              coordinates: [[
                [73.8420, 18.5080],
                [73.8520, 18.5080],
                [73.8520, 18.5140],
                [73.8420, 18.5140],
                [73.8420, 18.5080]
              ]]
            },
            properties: {
              id: 'PROP-PUNE-3',
              change_type: 'Vegetation Loss',
              color: '#10b981',
              confidence_score: 0.89,
              area_hectares: 5.1,
              area_sq_m: 51000,
              spectral_shift: { delta_ndvi: -0.41, delta_ndbi: 0.18 }
            }
          }
        ]
      }
    });

    setLocationChanges({
      location_id: 'LOC_PUNE',
      location_name: 'Pune, Maharashtra',
      latitude: 18.5204,
      longitude: 73.8567,
      total_historical_events: 3,
      timeline: [
        { date: '2021-03', change_type: 'Baseline Survey', area_hectares: 0.0, confidence: 0.96, notes: 'Optical multispectral reference acquisition for Pune metropolitan sector' },
        { date: '2023-04', change_type: 'Road Development', area_hectares: 6.5, confidence: 0.91, notes: 'Transit corridor and arterial road expansion' },
        { date: '2024-03', change_type: 'New Construction', area_hectares: 14.2, confidence: 0.95, notes: 'Active commercial & residential built-up development' }
      ],
      summary_chart_data: []
    });
  };

  // Initialize Scenarios and System Stats (Defaults to Pune)
  useEffect(() => {
    const initApp = async () => {
      try {
        const [scenariosData, statsData] = await Promise.all([
          fetchScenarios(),
          fetchStats()
        ]);
        setScenarios(scenariosData.scenarios);
        setStats(statsData);

        // Load Pune as default location on initial dashboard state
        loadDefaultPuneComparison();
      } catch (err) {
        console.error('Failed to initialize app data:', err);
      }
    };
    initApp();
  }, []);

  // Load Comparison & Analytics for a Scenario
  const loadScenarioComparison = async (scenario: Scenario) => {
    setIsLoading(true);
    setCustomBbox(null);
    setCustomError(null);
    setSearchNotice(null);
    try {
      const [compResult, changesResult] = await Promise.all([
        compareScenes({ scenario_id: scenario.scenario_id }),
        fetchChanges(scenario.location_id)
      ]);
      setComparison(compResult);
      setLocationChanges(changesResult);
    } catch (err) {
      console.error('Error executing change analysis:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectScenario = (scenario: Scenario) => {
    console.log(`[SCENARIO] User explicitly selected demo scenario: "${scenario.title}" (${scenario.location_id})`);
    setActiveScenario(scenario);
    setParsedIntent(null);
    setSearchNotice(null);
    loadScenarioComparison(scenario);
  };

  // Custom Area Selection Handlers
  const handleSelectCustomArea = async (bbox: [number, number, number, number], geojson: any) => {
    console.log(`[CUSTOM_AREA] Step 1: User drawn custom bbox:`, bbox, `geometry:`, geojson);
    setActiveScenario(null);
    setCustomBbox(bbox);
    setCustomError(null);
    setSearchNotice(null);
    setIsCustomLoading(true);
    setViewMode('map');
    try {
      console.log(`[CUSTOM_AREA] Step 2: Sending POST /api/compare with payload:`, { custom_bbox: bbox, custom_geometry: geojson });
      const compResult = await compareScenes({
        custom_bbox: bbox,
        custom_geometry: geojson
      });
      console.log(`[CUSTOM_AREA] Step 3: Analysis result received -> regions=${compResult.regions_count}, type=${compResult.primary_change_type}, confidence=${compResult.confidence_percentage}`, compResult);
      setComparison(compResult);

      if (compResult.centroid_lat && compResult.centroid_lng) {
        setLocationChanges({
          location_id: compResult.location_id,
          location_name: compResult.location_name,
          latitude: compResult.centroid_lat,
          longitude: compResult.centroid_lng,
          total_historical_events: compResult.timeline_events?.length || 0,
          timeline: compResult.timeline_events || [],
          summary_chart_data: []
        });
      }
    } catch (err: any) {
      console.error('[CUSTOM_AREA] Custom area analysis failed:', err);
      setCustomError(err.message || 'Failed to analyze selected region.');
    } finally {
      setIsCustomLoading(false);
    }
  };

  const handleClearCustomSelection = () => {
    setCustomBbox(null);
    setCustomError(null);
    setSearchNotice(null);
    if (activeScenario) {
      loadScenarioComparison(activeScenario);
    } else {
      loadDefaultPuneComparison();
    }
  };

  // Natural Language Semantic Search Handler
  const handleSearch = async (query: string) => {
    console.log(`[SEARCH] Step 1: Query received from input: "${query}"`);
    setIsLoading(true);
    setCustomBbox(null);
    setCustomError(null);
    setSearchNotice(null);
    try {
      console.log(`[SEARCH] Step 2: Dispatching POST /api/search with query: "${query}"...`);
      const searchRes = await searchScenes(query, 4);
      console.log(`[SEARCH] Step 3: API response received:`, searchRes);
      
      setParsedIntent(searchRes.parsed_intent);

      // Case A: Query matched an existing multi-temporal demo scenario
      if (searchRes.suggested_scenario) {
        console.log(`[SEARCH] Step 4: Matched catalog scenario -> ${searchRes.suggested_scenario.scenario_id}`);
        setActiveScenario(searchRes.suggested_scenario);
        await loadScenarioComparison(searchRes.suggested_scenario);
      } 
      // Case B: Query matched scenes in the catalog
      else if (searchRes.results.length > 0) {
        console.log(`[SEARCH] Step 4: Matched ${searchRes.results.length} catalog scenes.`);
        const topScene = searchRes.results[0].scene;
        const matched = scenarios.find(s => s.location_id === topScene.location_id);
        if (matched) {
          setActiveScenario(matched);
          await loadScenarioComparison(matched);
        }
      } 
      // Case C: Real location searched that has NO catalog imagery -> Center map there, NEVER fall back to Bengaluru!
      else if (searchRes.geocoded_location) {
        const geo = searchRes.geocoded_location;
        const bbox: [number, number, number, number] = geo.bbox && geo.bbox.length === 4
          ? geo.bbox
          : [geo.latitude - 0.05, geo.longitude - 0.05, geo.latitude + 0.05, geo.longitude + 0.05];
        console.log(`[SEARCH] Step 4: Location "${geo.name}" has no catalog imagery. Centering satellite map at (${geo.latitude}, ${geo.longitude})`);
        
        setActiveScenario(null);
        setCustomBbox(bbox);
        setViewMode('map');
        
        setSearchNotice({
          message: searchRes.message || `No multi-temporal change pairs in catalog for "${geo.name}". Centering live satellite basemap on location.`,
          type: 'info'
        });

        const c_lat = geo.latitude;
        const c_lng = geo.longitude;
        setComparison({
          id: `GEO_${Math.abs(Math.round(c_lat * 100))}_${Math.abs(Math.round(c_lng * 100))}`,
          location_id: geo.location_id || 'UNSEEDED',
          location_name: geo.name,
          image_id_before: 'BASEMAP_2021',
          image_id_after: 'BASEMAP_CURRENT',
          image_before_url: '',
          image_after_url: '',
          primary_change_type: searchRes.parsed_intent?.target_change_type || 'Geographic Satellite View',
          overall_confidence: 0.95,
          confidence_percentage: '95.0%',
          total_area_sq_m: 0,
          total_area_hectares: 0,
          regions_count: 0,
          mask_url: '',
          breakdown: {},
          geojson: {
            type: 'FeatureCollection',
            features: [
              {
                type: 'Feature',
                geometry: {
                  type: 'Polygon',
                  coordinates: [[
                    [bbox[1], bbox[0]],
                    [bbox[3], bbox[0]],
                    [bbox[3], bbox[2]],
                    [bbox[1], bbox[2]],
                    [bbox[1], bbox[0]]
                  ]]
                },
                id: `FEAT_${geo.name.replace(/\s+/g, '_')}`,
                properties: {
                  id: `FEAT_${geo.name.replace(/\s+/g, '_')}`,
                  change_type: geo.name,
                  confidence_score: 0.95,
                  area_sq_m: 0,
                  area_hectares: 0,
                  color: '#00e5ff'
                }
              }
            ]
          },
          detected_at: new Date().toISOString(),
          is_custom_selection: true,
          custom_bbox: bbox,
          centroid_lat: c_lat,
          centroid_lng: c_lng,
          google_maps_url: `https://www.google.com/maps?q=${c_lat},${c_lng}&z=16`,
          google_earth_url: `https://earth.google.com/web/search/${c_lat},${c_lng}`,
          raster_bounds: bbox,
          timeline_events: [
            {
              date: '2021-03',
              change_type: 'Baseline Survey',
              area_hectares: 0.0,
              confidence: 0.95,
              notes: `Historical satellite basemap coverage available for ${geo.name}`
            },
            {
              date: '2024-03',
              change_type: 'Live Satellite View',
              area_hectares: 0.0,
              confidence: 0.95,
              notes: `Live high-resolution ESRI World Imagery active for ${geo.name}`
            }
          ]
        });

        setLocationChanges({
          location_id: 'CUSTOM',
          location_name: geo.name,
          latitude: geo.latitude,
          longitude: geo.longitude,
          total_historical_events: 0,
          timeline: [],
          summary_chart_data: []
        });
      } 
      // Case D: Completely unknown search terms
      else {
        console.log(`[SEARCH] Step 4: No matching scenes or recognized location for "${query}".`);
        setSearchNotice({
          message: searchRes.message || `No satellite imagery matches found for "${query}". Try searching a city like "Pune", "Mumbai", "Western Ghats", or enter coordinates.`,
          type: 'warn'
        });
      }
    } catch (err) {
      console.error('[SEARCH] Search request failed:', err);
      setSearchNotice({
        message: 'Search request encountered an error. Please try again.',
        type: 'warn'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRerunDetection = () => {
    if (customBbox) {
      handleSelectCustomArea(customBbox, null);
    } else if (activeScenario) {
      loadScenarioComparison(activeScenario);
    } else {
      loadDefaultPuneComparison();
    }
  };

  // Bounding box and coordinate determination - accurately follows searched location & custom bbox (defaults to Pune)
  const activeCenter: [number, number] = comparison?.centroid_lat && comparison?.centroid_lng
    ? [comparison.centroid_lat, comparison.centroid_lng]
    : [locationChanges?.latitude || 18.5204, locationChanges?.longitude || 73.8567];

  const activeBbox: [number, number, number, number] = customBbox || (comparison?.raster_bounds?.length === 4
    ? [comparison.raster_bounds[0], comparison.raster_bounds[1], comparison.raster_bounds[2], comparison.raster_bounds[3]]
    : comparison?.centroid_lat && comparison?.centroid_lng
    ? [comparison.centroid_lat - 0.015, comparison.centroid_lng - 0.015, comparison.centroid_lat + 0.015, comparison.centroid_lng + 0.015]
    : [18.5050, 73.8400, 18.5358, 73.8734]);

  return (
    <div className="app-container">
      <Navbar stats={stats} />

      <main className="dashboard-main">
        {/* Search Input Bar */}
        <SearchBar
          onSearch={handleSearch}
          parsedIntent={parsedIntent}
          isLoading={isLoading}
        />

        {/* Search Notice / Empty State Banner */}
        {searchNotice && (
          <div className={`search-notice-banner ${searchNotice.type}`}>
            <div className="search-notice-content">
              <AlertCircle size={18} />
              <span>{searchNotice.message}</span>
            </div>
            <div className="search-notice-actions">
              <button
                type="button"
                className="search-notice-close"
                onClick={() => setSearchNotice(null)}
              >
                ✕
              </button>
            </div>
          </div>
        )}

        {/* Primary Workspace Grid */}
        <div className="workspace-grid">
          {/* Left Column: Visual GIS Viewer & Slider */}
          <div className="viewer-card">
            <div className="viewer-header">
              <div className="viewer-title-group">
                <h2 className="viewer-title">
                  {comparison ? comparison.location_name : 'Satellite Imagery Viewer'}
                </h2>
                <span className="viewer-subtitle">
                  {activeScenario?.description || 'Multi-temporal optical & spectral analysis'}
                </span>
              </div>

              <div className="viewer-controls">
                <button
                  type="button"
                  className={`tab-btn ${viewMode === 'slider' ? 'active' : ''}`}
                  onClick={() => setViewMode('slider')}
                >
                  <Sliders size={14} />
                  <span>Before/After Slider</span>
                </button>

                <button
                  type="button"
                  className={`tab-btn ${viewMode === 'map' ? 'active' : ''}`}
                  onClick={() => setViewMode('map')}
                >
                  <MapIcon size={14} />
                  <span>GIS Map & Polygons</span>
                </button>

                {viewMode === 'slider' && (
                  <button
                    type="button"
                    className="tab-btn"
                    style={{ marginLeft: '0.25rem' }}
                    onClick={() => setShowMaskOnSlider(!showMaskOnSlider)}
                    title="Toggle AI change mask highlight"
                  >
                    {showMaskOnSlider ? <Eye size={14} color="#00e5ff" /> : <EyeOff size={14} />}
                    <span>AI Mask</span>
                  </button>
                )}
              </div>
            </div>

            {/* Custom Area Error Banner */}
            {customError && (
              <div className="custom-error-banner">
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <AlertCircle size={16} color="#f43f5e" />
                  <span>{customError}</span>
                </div>
                <button
                  type="button"
                  className="reset-pill-btn"
                  onClick={handleClearCustomSelection}
                >
                  Reset Selection
                </button>
              </div>
            )}

            {/* View Port: Slider or Leaflet Map */}
            {viewMode === 'slider' ? (
              <BeforeAfterSlider
                beforeImageUrl={comparison?.image_before_url || ''}
                afterImageUrl={comparison?.image_after_url || ''}
                maskImageUrl={comparison?.mask_url}
                showMask={showMaskOnSlider}
                beforeDate={comparison?.image_id_before}
                afterDate={comparison?.image_id_after}
                onSwitchToMap={() => setViewMode('map')}
              />
            ) : (
              <MapView
                bbox={activeBbox}
                center={activeCenter}
                satelliteImageUrl={comparison?.image_after_url}
                satelliteImageUrlBefore={comparison?.image_before_url}
                satelliteImageUrlAfter={comparison?.image_after_url}
                rasterBounds={comparison?.raster_bounds}
                geojson={comparison?.geojson}
                activeChangeType={comparison?.primary_change_type}
                customSelectedBbox={customBbox}
                isAnalyzingArea={isCustomLoading}
                onSelectArea={handleSelectCustomArea}
                onClearSelection={handleClearCustomSelection}
                locationName={comparison?.location_name || activeScenario?.title || locationChanges?.location_name || ''}
              />
            )}
          </div>

          {/* Right Column: AI Analysis & Metrics Panel */}
          <div className="analysis-panel">
            <ResultsPanel
              result={comparison}
              isLoading={isLoading}
              onRunDetection={handleRerunDetection}
            />
          </div>
        </div>
      </main>

      <footer className="app-footer">
        <div>
          <strong>ORBITERRA</strong> &bull; Semantic Retrieval & Multi-Temporal Change Analysis of Satellite Imagery
        </div>
        <div className="footer-tags">
          <span className="footer-pill">PyTorch / OpenCV / Rasterio</span>
          <span className="footer-pill">PostgreSQL + PostGIS</span>
          <span className="footer-pill">FastAPI</span>
          <span className="footer-pill">React + TypeScript</span>
        </div>
      </footer>
    </div>
  );
};
