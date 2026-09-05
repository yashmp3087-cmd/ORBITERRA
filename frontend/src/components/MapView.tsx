import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { 
  Square, 
  Pentagon, 
  RotateCcw, 
  Crosshair, 
  Check, 
  Layers, 
  Columns, 
  SlidersHorizontal,
  Satellite as SatelliteIcon,
  Eye,
  MapPin,
  Maximize2
} from 'lucide-react';
import { GeoJsonCollection } from '../types';

interface MapViewProps {
  bbox: [number, number, number, number]; // [min_lat, min_lon, max_lat, max_lon]
  center: [number, number]; // [lat, lon]
  satelliteImageUrl?: string; // current / after image
  satelliteImageUrlBefore?: string; // baseline / before image
  satelliteImageUrlAfter?: string; // current / after image
  geojson?: GeoJsonCollection | null;
  activeChangeType?: string;
  customSelectedBbox?: [number, number, number, number] | null;
  isAnalyzingArea?: boolean;
  onSelectArea?: (bbox: [number, number, number, number], geojson: any) => void;
  rasterBounds?: [number, number, number, number];
  onClearSelection?: () => void;
  locationName?: string;
}

const TILE_LAYERS = {
  esri: {
    name: 'ESRI World Imagery',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
  },
  dark: {
    name: 'CartoDB Dark Matter',
    url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
    attribution: '&copy; <a href="https://carto.com/">CARTO</a> &copy; OpenStreetMap'
  }
};

const LABELS_LAYERS = {
  boundaries: {
    name: 'World Boundaries and Places',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}',
    attribution: 'Esri Reference'
  },
  transportation: {
    name: 'World Transportation',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Transportation/MapServer/tile/{z}/{y}/{x}',
    attribution: 'Esri Transportation'
  }
};

export const MapView: React.FC<MapViewProps> = ({
  bbox,
  center,
  satelliteImageUrl,
  satelliteImageUrlBefore,
  satelliteImageUrlAfter,
  rasterBounds,
  geojson,
  activeChangeType,
  customSelectedBbox,
  isAnalyzingArea,
  onSelectArea,
  onClearSelection,
  locationName
}) => {
  const beforeUrl = satelliteImageUrlBefore || '';
  const afterUrl = satelliteImageUrlAfter || satelliteImageUrl || '';
  const hasImageryOverlay = Boolean((beforeUrl && beforeUrl.trim()) || (afterUrl && afterUrl.trim()));
  const displayLocation = locationName?.trim() ? locationName : 'Pune, Maharashtra';

  // Mode: single map or synced dual-map comparison
  const [mapLayout, setMapLayout] = useState<'single' | 'dual'>('dual');
  const [baseMapType, setBaseMapType] = useState<'esri' | 'dark'>('esri');
  const [layerOpacity, setLayerOpacity] = useState<number>(1.0); // 0 = 100% before, 1 = 100% after
  const [drawMode, setDrawMode] = useState<'idle' | 'box' | 'polygon'>('idle');
  const [drawnBboxInfo, setDrawnBboxInfo] = useState<string | null>(null);

  // Single Map Refs
  const singleMapContainerRef = useRef<HTMLDivElement>(null);
  const singleMapRef = useRef<L.Map | null>(null);
  const singleBeforeOverlayRef = useRef<L.ImageOverlay | null>(null);
  const singleAfterOverlayRef = useRef<L.ImageOverlay | null>(null);
  const singleGeojsonRef = useRef<L.GeoJSON | null>(null);
  const singleDrawGroupRef = useRef<L.LayerGroup | null>(null);
  const singleBaseTileRef = useRef<L.TileLayer | null>(null);
  const singleLabelsRef = useRef<L.TileLayer[]>([]);

  // Dual Map Refs
  const leftMapContainerRef = useRef<HTMLDivElement>(null);
  const rightMapContainerRef = useRef<HTMLDivElement>(null);
  const leftMapRef = useRef<L.Map | null>(null);
  const rightMapRef = useRef<L.Map | null>(null);
  const leftBaseTileRef = useRef<L.TileLayer | null>(null);
  const rightBaseTileRef = useRef<L.TileLayer | null>(null);
  const leftLabelsRef = useRef<L.TileLayer[]>([]);
  const rightLabelsRef = useRef<L.TileLayer[]>([]);
  const leftOverlayRef = useRef<L.ImageOverlay | null>(null);
  const rightOverlayRef = useRef<L.ImageOverlay | null>(null);
  const rightGeojsonRef = useRef<L.GeoJSON | null>(null);
  const leftDrawGroupRef = useRef<L.LayerGroup | null>(null);
  const rightDrawGroupRef = useRef<L.LayerGroup | null>(null);

  const isSyncingRef = useRef<boolean>(false);
  const isDrawingBoxRef = useRef<boolean>(false);
  const startLatLngRef = useRef<L.LatLng | null>(null);
  const activeRectRef = useRef<L.Rectangle | null>(null);
  const polygonPointsRef = useRef<L.LatLng[]>([]);
  const polygonLineRef = useRef<L.Polyline | null>(null);

  // Helper to ensure custom panes exist for labels and vectors
  const setupCustomPanes = (map: L.Map) => {
    if (!map.getPane('labelsPane')) {
      const labelsPane = map.createPane('labelsPane');
      labelsPane.style.zIndex = '450';
      labelsPane.style.pointerEvents = 'none';
    }
    if (!map.getPane('geojsonPane')) {
      const geojsonPane = map.createPane('geojsonPane');
      geojsonPane.style.zIndex = '500';
    }
  };

  // Helper to attach Google-Maps-style place and street labels layer
  const createLabelsLayers = (map: L.Map, isVisible: boolean): L.TileLayer[] => {
    const opacity = isVisible ? 1.0 : 0;
    const bLabels = L.tileLayer(LABELS_LAYERS.boundaries.url, {
      pane: 'labelsPane',
      attribution: LABELS_LAYERS.boundaries.attribution,
      maxZoom: 19,
      opacity: opacity
    }).addTo(map);

    const tLabels = L.tileLayer(LABELS_LAYERS.transportation.url, {
      pane: 'labelsPane',
      attribution: LABELS_LAYERS.transportation.attribution,
      maxZoom: 19,
      opacity: isVisible ? 0.9 : 0
    }).addTo(map);

    return [bLabels, tLabels];
  };

  // 1. Initialize Single Map
  useEffect(() => {
    if (mapLayout !== 'single') return;
    if (!singleMapContainerRef.current) return;
    if (singleMapRef.current) {
      singleMapRef.current.invalidateSize();
      return;
    }

    const map = L.map(singleMapContainerRef.current, {
      center: center,
      zoom: 14,
      zoomControl: true
    });

    setupCustomPanes(map);

    const baseTile = L.tileLayer(TILE_LAYERS[baseMapType].url, {
      attribution: TILE_LAYERS[baseMapType].attribution,
      maxZoom: 19
    }).addTo(map);
    singleBaseTileRef.current = baseTile;

    singleLabelsRef.current = createLabelsLayers(map, baseMapType === 'esri');

    const drawGroup = L.layerGroup().addTo(map);
    singleDrawGroupRef.current = drawGroup;
    singleMapRef.current = map;

    return () => {
      map.remove();
      singleMapRef.current = null;
      singleBaseTileRef.current = null;
      singleLabelsRef.current = [];
    };
  }, [mapLayout]);

  // 2. Initialize Dual Maps (Synced Pan & Zoom with Place Labels)
  useEffect(() => {
    if (mapLayout !== 'dual') return;
    if (!leftMapContainerRef.current || !rightMapContainerRef.current) return;
    if (leftMapRef.current && rightMapRef.current) {
      leftMapRef.current.invalidateSize();
      rightMapRef.current.invalidateSize();
      return;
    }

    // Left Map (Before Baseline)
    const mapLeft = L.map(leftMapContainerRef.current, {
      center: center,
      zoom: 14,
      zoomControl: true
    });

    setupCustomPanes(mapLeft);

    const leftBase = L.tileLayer(TILE_LAYERS[baseMapType].url, {
      attribution: TILE_LAYERS[baseMapType].attribution,
      maxZoom: 19
    }).addTo(mapLeft);
    leftBaseTileRef.current = leftBase;

    // Overlay Google-Maps-style place and street labels on Left Map
    leftLabelsRef.current = createLabelsLayers(mapLeft, baseMapType === 'esri');

    const leftGroup = L.layerGroup().addTo(mapLeft);
    leftDrawGroupRef.current = leftGroup;
    leftMapRef.current = mapLeft;

    // Right Map (Current + Change Polygons)
    const mapRight = L.map(rightMapContainerRef.current, {
      center: center,
      zoom: 14,
      zoomControl: false // keep left zoom control only for sleekness
    });

    setupCustomPanes(mapRight);

    const rightBase = L.tileLayer(TILE_LAYERS[baseMapType].url, {
      attribution: TILE_LAYERS[baseMapType].attribution,
      maxZoom: 19
    }).addTo(mapRight);
    rightBaseTileRef.current = rightBase;

    // Overlay Google-Maps-style place and street labels identically on Right Map
    rightLabelsRef.current = createLabelsLayers(mapRight, baseMapType === 'esri');

    const rightGroup = L.layerGroup().addTo(mapRight);
    rightDrawGroupRef.current = rightGroup;
    rightMapRef.current = mapRight;

    // Synchronize movements in lockstep
    const syncMaps = (source: L.Map, target: L.Map) => {
      if (isSyncingRef.current) return;
      isSyncingRef.current = true;
      target.setView(source.getCenter(), source.getZoom(), { animate: false });
      isSyncingRef.current = false;
    };

    mapLeft.on('move', () => syncMaps(mapLeft, mapRight));
    mapRight.on('move', () => syncMaps(mapRight, mapLeft));

    return () => {
      mapLeft.remove();
      mapRight.remove();
      leftMapRef.current = null;
      rightMapRef.current = null;
      leftBaseTileRef.current = null;
      rightBaseTileRef.current = null;
      leftLabelsRef.current = [];
      rightLabelsRef.current = [];
    };
  }, [mapLayout]);

  // 3. Update Base Layer Tile and Labels across active maps
  useEffect(() => {
    const tileConfig = TILE_LAYERS[baseMapType];
    if (singleBaseTileRef.current) {
      singleBaseTileRef.current.setUrl(tileConfig.url);
    }
    if (leftBaseTileRef.current) {
      leftBaseTileRef.current.setUrl(tileConfig.url);
    }
    if (rightBaseTileRef.current) {
      rightBaseTileRef.current.setUrl(tileConfig.url);
    }

    const isEsri = baseMapType === 'esri';
    singleLabelsRef.current.forEach((layer, idx) => {
      layer.setOpacity(isEsri ? (idx === 1 ? 0.9 : 1.0) : 0);
    });
    leftLabelsRef.current.forEach((layer, idx) => {
      layer.setOpacity(isEsri ? (idx === 1 ? 0.9 : 1.0) : 0);
    });
    rightLabelsRef.current.forEach((layer, idx) => {
      layer.setOpacity(isEsri ? (idx === 1 ? 0.9 : 1.0) : 0);
    });
  }, [baseMapType]);

  // 4. Update Bounds & Raster Image Overlays (Single Map)
  useEffect(() => {
    const map = singleMapRef.current;
    if (!map || mapLayout !== 'single') return;

    const [minLat, minLon, maxLat, maxLon] = bbox;
    const bounds = L.latLngBounds([minLat, minLon], [maxLat, maxLon]);
    map.fitBounds(bounds, { padding: [40, 40], maxZoom: 16 });

    // Clean old overlays
    if (singleBeforeOverlayRef.current) {
      map.removeLayer(singleBeforeOverlayRef.current);
      singleBeforeOverlayRef.current = null;
    }
    if (singleAfterOverlayRef.current) {
      map.removeLayer(singleAfterOverlayRef.current);
      singleAfterOverlayRef.current = null;
    }

    // Georeferenced catalog rasters are only mounted when a full scenario is loaded.
    // When a custom ROI is drawn, we display the live ESRI satellite basemap directly.
    const canMountRaster = Boolean(!customSelectedBbox && beforeUrl && afterUrl && rasterBounds && rasterBounds.length === 4);
    const overlayBounds = (canMountRaster && rasterBounds)
      ? L.latLngBounds([rasterBounds[0], rasterBounds[1]], [rasterBounds[2], rasterBounds[3]])
      : bounds;

    // Georeferenced Before Overlay
    if (canMountRaster && beforeUrl && beforeUrl.trim() !== '') {
      const beforeLayer = L.imageOverlay(beforeUrl, overlayBounds, {
        opacity: Math.max(0, 1 - layerOpacity),
        interactive: false
      }).addTo(map);
      singleBeforeOverlayRef.current = beforeLayer;
    }

    // Georeferenced After Overlay
    if (canMountRaster && afterUrl && afterUrl.trim() !== '') {
      const afterLayer = L.imageOverlay(afterUrl, overlayBounds, {
        opacity: layerOpacity,
        interactive: false
      }).addTo(map);
      singleAfterOverlayRef.current = afterLayer;
    }
  }, [bbox, beforeUrl, afterUrl, rasterBounds, customSelectedBbox, mapLayout]);

  // 5. Update Layer Opacity in Single Map
  useEffect(() => {
    if (mapLayout !== 'single') return;
    if (singleBeforeOverlayRef.current) {
      singleBeforeOverlayRef.current.setOpacity(Math.max(0, 1 - layerOpacity));
    }
    if (singleAfterOverlayRef.current) {
      singleAfterOverlayRef.current.setOpacity(layerOpacity);
    }
  }, [layerOpacity, mapLayout]);

  // 6. Update Dual Map Overlays
  useEffect(() => {
    if (mapLayout !== 'dual') return;
    const mapL = leftMapRef.current;
    const mapR = rightMapRef.current;
    if (!mapL || !mapR) return;

    const [minLat, minLon, maxLat, maxLon] = bbox;
    const bounds = L.latLngBounds([minLat, minLon], [maxLat, maxLon]);

    isSyncingRef.current = true;
    mapL.fitBounds(bounds, { padding: [30, 30], maxZoom: 16 });
    mapR.fitBounds(bounds, { padding: [30, 30], maxZoom: 16 });
    isSyncingRef.current = false;

    // Left Map: Clean old overlay
    if (leftOverlayRef.current) {
      mapL.removeLayer(leftOverlayRef.current);
      leftOverlayRef.current = null;
    }
    // Right Map: Clean old overlay
    if (rightOverlayRef.current) {
      mapR.removeLayer(rightOverlayRef.current);
      rightOverlayRef.current = null;
    }

    const canMountRaster = Boolean(!customSelectedBbox && beforeUrl && afterUrl && rasterBounds && rasterBounds.length === 4);
    const overlayBounds = (canMountRaster && rasterBounds)
      ? L.latLngBounds([rasterBounds[0], rasterBounds[1]], [rasterBounds[2], rasterBounds[3]])
      : bounds;

    if (canMountRaster) {
      if (beforeUrl && beforeUrl.trim() !== '') {
        leftOverlayRef.current = L.imageOverlay(beforeUrl, overlayBounds, { opacity: 0.92, interactive: false }).addTo(mapL);
      }
      if (afterUrl && afterUrl.trim() !== '') {
        rightOverlayRef.current = L.imageOverlay(afterUrl, overlayBounds, { opacity: 0.92, interactive: false }).addTo(mapR);
      }
    }
  }, [bbox, beforeUrl, afterUrl, rasterBounds, customSelectedBbox, mapLayout]);

  // 7. Update GeoJSON Polygons Overlay
  useEffect(() => {
    const attachGeoJson = (map: L.Map | null, refHolder: React.MutableRefObject<L.GeoJSON | null>) => {
      if (!map) return;
      if (refHolder.current) {
        map.removeLayer(refHolder.current);
        refHolder.current = null;
      }

      if (geojson && geojson.features.length > 0) {
        console.log(`[RENDER] Step 4: Drawing change overlay on map -> features_count=${geojson.features.length}`);
        const layer = L.geoJSON(geojson as any, {
          pane: 'geojsonPane',
          style: (feature) => {
            const color = feature?.properties?.color || '#00e5ff';
            return {
              color: color,
              weight: 2,
              opacity: 0.95,
              fillColor: color,
              fillOpacity: 0.45
            };
          },
          onEachFeature: (feature, layer) => {
            const props = feature.properties;
            const shift = props.spectral_shift || {};
            const popupHtml = `
              <div style="font-family: sans-serif; font-size: 13px; line-height: 1.4;">
                <div style="font-weight: 700; color: ${props.color}; font-size: 14px; margin-bottom: 4px;">
                  ${props.change_type}
                </div>
                <div style="color: #cbd5e1; margin-bottom: 2px;">
                  Confidence: <strong style="color: #00e5ff;">${(props.confidence_score * 100).toFixed(1)}%</strong>
                </div>
                <div style="color: #cbd5e1; margin-bottom: 4px;">
                  Area: <strong>${props.area_hectares} ha</strong> (${props.area_sq_m.toLocaleString()} m²)
                </div>
                ${shift.delta_ndvi !== undefined ? `
                  <div style="font-size: 11px; color: #94a3b8; border-top: 1px solid #334155; padding-top: 4px; margin-top: 4px;">
                    ΔNDVI: ${shift.delta_ndvi} | ΔNDBI: ${shift.delta_ndbi}
                  </div>
                ` : ''}
              </div>
            `;
            layer.bindPopup(popupHtml);
          }
        });
        layer.addTo(map);
        refHolder.current = layer;
      }
    };

    if (mapLayout === 'single') {
      attachGeoJson(singleMapRef.current, singleGeojsonRef);
    } else {
      attachGeoJson(rightMapRef.current, rightGeojsonRef);
    }
  }, [geojson, activeChangeType, mapLayout]);

  // 8. Custom Drawn Area Rendering
  useEffect(() => {
    const renderDrawnBox = (group: L.LayerGroup | null) => {
      if (!group) return;
      group.clearLayers();
      if (customSelectedBbox) {
        const [minLat, minLon, maxLat, maxLon] = customSelectedBbox;
        const bounds = L.latLngBounds([minLat, minLon], [maxLat, maxLon]);
        L.rectangle(bounds, {
          pane: 'geojsonPane',
          color: '#00e5ff',
          weight: 2.5,
          dashArray: '6, 6',
          fillColor: '#00e5ff',
          fillOpacity: 0.2
        }).addTo(group);
      }
    };

    if (mapLayout === 'single') {
      renderDrawnBox(singleDrawGroupRef.current);
    } else {
      renderDrawnBox(leftDrawGroupRef.current);
      renderDrawnBox(rightDrawGroupRef.current);
    }

    if (customSelectedBbox) {
      const [minLat, minLon, maxLat, maxLon] = customSelectedBbox;
      const dLat = Math.abs(maxLat - minLat);
      const dLon = Math.abs(maxLon - minLon);
      const approxHa = Math.round(dLat * dLon * 111 * 111 * 100 * 0.15 * 10) / 10;
      setDrawnBboxInfo(`Custom Box: [${minLat.toFixed(4)}, ${minLon.toFixed(4)}] (~${approxHa} ha)`);
    } else {
      setDrawnBboxInfo(null);
    }
  }, [customSelectedBbox, mapLayout]);

  // 9. Interactive Drawing Handlers (Single map active)
  useEffect(() => {
    const map = mapLayout === 'single' ? singleMapRef.current : leftMapRef.current;
    const group = mapLayout === 'single' ? singleDrawGroupRef.current : leftDrawGroupRef.current;
    if (!map || !group) return;

    const container = map.getContainer();
    if (drawMode === 'idle') {
      container.style.cursor = '';
      map.dragging.enable();
      return;
    }

    container.style.cursor = 'crosshair';

    if (drawMode === 'box') {
      map.dragging.disable();

      const onMouseDown = (e: L.LeafletMouseEvent) => {
        isDrawingBoxRef.current = true;
        startLatLngRef.current = e.latlng;
        if (activeRectRef.current) {
          group.removeLayer(activeRectRef.current);
          activeRectRef.current = null;
        }
        const rect = L.rectangle(L.latLngBounds(e.latlng, e.latlng), {
          color: '#00e5ff',
          weight: 2,
          dashArray: '4, 4',
          fillColor: '#00e5ff',
          fillOpacity: 0.25
        });
        rect.addTo(group);
        activeRectRef.current = rect;
      };

      const onMouseMove = (e: L.LeafletMouseEvent) => {
        if (!isDrawingBoxRef.current || !startLatLngRef.current || !activeRectRef.current) return;
        activeRectRef.current.setBounds(L.latLngBounds(startLatLngRef.current, e.latlng));
      };

      const onMouseUp = (e: L.LeafletMouseEvent) => {
        if (!isDrawingBoxRef.current || !startLatLngRef.current) return;
        isDrawingBoxRef.current = false;
        map.dragging.enable();

        const p1 = startLatLngRef.current;
        const p2 = e.latlng;
        startLatLngRef.current = null;

        const minLat = Math.min(p1.lat, p2.lat);
        const maxLat = Math.max(p1.lat, p2.lat);
        const minLon = Math.min(p1.lng, p2.lng);
        const maxLon = Math.max(p1.lng, p2.lng);

        if (Math.abs(maxLat - minLat) > 0.001 && Math.abs(maxLon - minLon) > 0.001) {
          const selectedBbox: [number, number, number, number] = [
            Math.round(minLat * 10000) / 10000,
            Math.round(minLon * 10000) / 10000,
            Math.round(maxLat * 10000) / 10000,
            Math.round(maxLon * 10000) / 10000
          ];

          const geojsonPolygon = {
            type: "Polygon",
            coordinates: [[
              [minLon, minLat],
              [maxLon, minLat],
              [maxLon, maxLat],
              [minLon, maxLat],
              [minLon, minLat]
            ]]
          };

          if (onSelectArea) {
            console.log(`[DRAW] Step 1: Box selection completed -> bbox=${JSON.stringify(selectedBbox)}`, geojsonPolygon);
            onSelectArea(selectedBbox, geojsonPolygon);
          }
        }
        setDrawMode('idle');
      };

      map.on('mousedown', onMouseDown);
      map.on('mousemove', onMouseMove);
      map.on('mouseup', onMouseUp);

      return () => {
        map.off('mousedown', onMouseDown);
        map.off('mousemove', onMouseMove);
        map.off('mouseup', onMouseUp);
        map.dragging.enable();
      };
    }

    if (drawMode === 'polygon') {
      polygonPointsRef.current = [];

      const onClick = (e: L.LeafletMouseEvent) => {
        polygonPointsRef.current.push(e.latlng);
        const pts = polygonPointsRef.current;
        if (polygonLineRef.current) group.removeLayer(polygonLineRef.current);
        polygonLineRef.current = L.polyline(pts, { color: '#00e5ff', weight: 2, dashArray: '4, 4' }).addTo(group);
      };

      const onDblClick = () => {
        const pts = polygonPointsRef.current;
        if (pts.length >= 3) {
          const lats = pts.map(p => p.lat);
          const lons = pts.map(p => p.lng);
          const selectedBbox: [number, number, number, number] = [
            Math.round(Math.min(...lats) * 10000) / 10000,
            Math.round(Math.min(...lons) * 10000) / 10000,
            Math.round(Math.max(...lats) * 10000) / 10000,
            Math.round(Math.max(...lons) * 10000) / 10000
          ];

          const coords = pts.map(p => [Math.round(p.lng * 10000) / 10000, Math.round(p.lat * 10000) / 10000]);
          coords.push(coords[0]);

          if (onSelectArea) {
            console.log(`[DRAW] Step 1: Polygon completed -> vertices=${coords.length}, bbox=${JSON.stringify(selectedBbox)}`);
            onSelectArea(selectedBbox, { type: "Polygon", coordinates: [coords] });
          }
        }
        setDrawMode('idle');
      };

      map.on('click', onClick);
      map.on('dblclick', onDblClick);
      return () => {
        map.off('click', onClick);
        map.off('dblclick', onDblClick);
      };
    }
  }, [drawMode, mapLayout, onSelectArea]);

  const handleClear = () => {
    if (singleDrawGroupRef.current) singleDrawGroupRef.current.clearLayers();
    if (leftDrawGroupRef.current) leftDrawGroupRef.current.clearLayers();
    if (rightDrawGroupRef.current) rightDrawGroupRef.current.clearLayers();
    setDrawMode('idle');
    setDrawnBboxInfo(null);
    if (onClearSelection) onClearSelection();
  };

  return (
    <div style={{ position: 'relative', width: '100%', height: '510px' }}>
      {/* Top Map Navigation & GIS Controls Bar */}
      <div className="map-gis-header-bar">
        {/* Left: Layout Switcher & Basemap Toggle */}
        <div className="gis-controls-left">
          <div className="gis-segmented-control">
            <button
              type="button"
              className={`gis-seg-btn ${mapLayout === 'single' ? 'active' : ''}`}
              onClick={() => setMapLayout('single')}
              title="Single georeferenced map with layer cross-fade slider"
            >
              <Maximize2 size={13} />
              <span>GIS Single Map</span>
            </button>
            <button
              type="button"
              className={`gis-seg-btn ${mapLayout === 'dual' ? 'active' : ''}`}
              onClick={() => setMapLayout('dual')}
              title="Synchronized split-screen: Left 2021 Baseline, Right Current + Changes"
            >
              <Columns size={13} />
              <span>Synced Dual Map</span>
            </button>
          </div>

          <button
            type="button"
            className="gis-basemap-toggle-btn"
            onClick={() => setBaseMapType(baseMapType === 'esri' ? 'dark' : 'esri')}
            title="Toggle between ESRI World Imagery and Dark GIS Basemap"
          >
            <SatelliteIcon size={13} color={baseMapType === 'esri' ? '#00e5ff' : '#94a3b8'} />
            <span>{baseMapType === 'esri' ? 'ESRI Satellite' : 'Dark Matter'}</span>
          </button>
        </div>

        {/* Center: Live 2021 vs Current Layer Slider (Single Map Mode) or Location Name (Dual Map Mode) */}
        {mapLayout === 'single' ? (
          hasImageryOverlay ? (
            <div className="layer-crossfade-bar">
              <span className="fade-label before">2021 Baseline</span>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={layerOpacity}
                onChange={(e) => setLayerOpacity(parseFloat(e.target.value))}
                className="gis-layer-range"
                title="Slide to cross-fade between 2021 and Current satellite imagery at exact bounds"
              />
              <span className="fade-label after">Current ({Math.round(layerOpacity * 100)}%)</span>
            </div>
          ) : (
            <div className="layer-crossfade-bar" style={{ opacity: 0.85, fontSize: '0.78rem', color: '#94a3b8' }}>
              <span>Live Basemap: {baseMapType === 'esri' ? 'ESRI World Imagery' : 'CartoDB Dark'}</span>
            </div>
          )
        ) : (
          <div className="gis-header-location-pill" title={`Selected Location: ${displayLocation}`}>
            <MapPin size={13} color="#00e5ff" />
            <span className="location-pill-prefix">Location:</span>
            <span className="location-pill-name">{displayLocation}</span>
          </div>
        )}

        {/* Right: Drawing Tools */}
        <div className="gis-controls-right">
          <button
            type="button"
            className={`map-tool-btn ${drawMode === 'box' ? 'active' : ''}`}
            onClick={() => setDrawMode(drawMode === 'box' ? 'idle' : 'box')}
            title="Click and drag on map to select a custom rectangular bounding box"
          >
            <Square size={13} />
            <span>{drawMode === 'box' ? 'Drawing...' : 'Select Box'}</span>
          </button>

          <button
            type="button"
            className={`map-tool-btn ${drawMode === 'polygon' ? 'active' : ''}`}
            onClick={() => setDrawMode(drawMode === 'polygon' ? 'idle' : 'polygon')}
            title="Click multiple points on map, double-click to complete custom polygon"
          >
            <Pentagon size={13} />
            <span>{drawMode === 'polygon' ? 'Click points...' : 'Polygon'}</span>
          </button>

          {(customSelectedBbox || drawMode !== 'idle' || drawnBboxInfo) && (
            <button
              type="button"
              className="map-tool-btn danger"
              onClick={handleClear}
              title="Clear custom area selection and revert to full satellite scene"
            >
              <RotateCcw size={13} />
              <span>Clear</span>
            </button>
          )}
        </div>
      </div>

      {/* Telemetry status bar overlay */}
      {(isAnalyzingArea || drawnBboxInfo || drawMode !== 'idle') && (
        <div className="gis-telemetry-badge">
          {isAnalyzingArea ? (
            <div className="draw-status-pill analyzing">
              <span className="pulse-mini" style={{ backgroundColor: '#00e5ff' }} />
              <span>Analyzing custom satellite coordinates...</span>
            </div>
          ) : drawnBboxInfo ? (
            <div className="draw-status-pill success">
              <Check size={12} color="#10b981" />
              <span>{drawnBboxInfo}</span>
            </div>
          ) : (
            <div className="draw-status-pill active">
              <Crosshair size={12} color="#00e5ff" />
              <span>{drawMode === 'box' ? 'Drag mouse over map to frame area' : 'Click vertices on map, double-click to close'}</span>
            </div>
          )}
        </div>
      )}

      {/* Map Viewports: Single or Dual Split-Screen */}
      {mapLayout === 'single' ? (
        <div ref={singleMapContainerRef} className="map-viewport" style={{ height: '510px' }} />
      ) : (
        <div className="dual-map-split-container" style={{ height: '510px' }}>
          {/* Left: 2021 Baseline Map */}
          <div className="dual-map-half left">
            <div className="dual-map-label before">
              <span className="label-title">🛰️ Before: 2021 Baseline</span>
              <span className="label-subloc" title={displayLocation}>📍 {displayLocation}</span>
            </div>
            <div ref={leftMapContainerRef} className="map-viewport-half" />
          </div>

          {/* Right: Current Map + Change Polygons */}
          <div className="dual-map-half right">
            <div className="dual-map-label after">
              <span className="label-title">🛰️ After: Current + Change Polygons</span>
              <span className="label-subloc" title={displayLocation}>📍 {displayLocation}</span>
            </div>
            <div ref={rightMapContainerRef} className="map-viewport-half" />
          </div>
        </div>
      )}
    </div>
  );
};
