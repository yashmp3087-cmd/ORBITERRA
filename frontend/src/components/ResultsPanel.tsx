import React, { useState } from 'react';
import { 
  AlertCircle, 
  Download, 
  Play, 
  CheckCircle2, 
  MapPin, 
  Maximize2, 
  ExternalLink, 
  Globe, 
  Copy, 
  Check, 
  ChevronDown, 
  ChevronUp 
} from 'lucide-react';
import { CompareResult } from '../types';
import { ChangeTimeline } from './ChangeTimeline';

interface ResultsPanelProps {
  result: CompareResult | null;
  isLoading: boolean;
  onRunDetection: () => void;
}

interface CategoryGroup {
  id: string;
  header: string;
  subItems: string[];
}

const CATEGORY_GROUPS: CategoryGroup[] = [
  {
    id: "buildings",
    header: "🏠 Buildings & Construction",
    subItems: [
      "New buildings/houses",
      "New industrial/commercial areas"
    ]
  },
  {
    id: "roads",
    header: "🛣️ Roads & Transportation",
    subItems: [
      "New roads",
      "Bridges/flyovers",
      "New railway lines"
    ]
  },
  {
    id: "vegetation",
    header: "🌳 Vegetation & Land Use",
    subItems: [
      "Reduction/increase in forest/green areas",
      "Agricultural land converted to buildings"
    ]
  },
  {
    id: "water",
    header: "💧 Water Bodies",
    subItems: [
      "Changes in rivers, lakes, reservoirs",
      "New water infrastructure",
      "Changes in water spread"
    ]
  },
  {
    id: "industrial",
    header: "🏭 Industrial Development",
    subItems: [
      "New factories",
      "Industrial zones"
    ]
  },
  {
    id: "infrastructure",
    header: "⚡ Infrastructure",
    subItems: [
      "Power plants/substations",
      "Large infrastructure projects"
    ]
  }
];

const SUBITEM_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  // Buildings & Construction
  "New buildings/houses": { bg: 'rgba(255, 87, 34, 0.18)', text: '#ff5722', border: 'rgba(255, 87, 34, 0.4)' },
  "New industrial/commercial areas": { bg: 'rgba(255, 112, 67, 0.18)', text: '#ff7043', border: 'rgba(255, 112, 67, 0.4)' },
  
  // Roads & Transportation
  "New roads": { bg: 'rgba(251, 191, 36, 0.18)', text: '#fbbf24', border: 'rgba(251, 191, 36, 0.4)' },
  "Bridges/flyovers": { bg: 'rgba(245, 158, 11, 0.18)', text: '#f59e0b', border: 'rgba(245, 158, 11, 0.4)' },
  "New railway lines": { bg: 'rgba(217, 119, 6, 0.18)', text: '#d97706', border: 'rgba(217, 119, 6, 0.4)' },
  
  // Vegetation & Land Use
  "Reduction/increase in forest/green areas": { bg: 'rgba(16, 185, 129, 0.18)', text: '#10b981', border: 'rgba(16, 185, 129, 0.4)' },
  "Agricultural land converted to buildings": { bg: 'rgba(132, 204, 22, 0.18)', text: '#84cc16', border: 'rgba(132, 204, 22, 0.4)' },
  
  // Water Bodies
  "Changes in rivers, lakes, reservoirs": { bg: 'rgba(2, 132, 199, 0.18)', text: '#0284c7', border: 'rgba(2, 132, 199, 0.4)' },
  "New water infrastructure": { bg: 'rgba(6, 182, 212, 0.18)', text: '#06b6d4', border: 'rgba(6, 182, 212, 0.4)' },
  "Changes in water spread": { bg: 'rgba(56, 189, 248, 0.18)', text: '#38bdf8', border: 'rgba(56, 189, 248, 0.4)' },
  
  // Industrial Development
  "New factories": { bg: 'rgba(168, 85, 247, 0.18)', text: '#a855f7', border: 'rgba(168, 85, 247, 0.4)' },
  "Industrial zones": { bg: 'rgba(139, 92, 246, 0.18)', text: '#8b5cf6', border: 'rgba(139, 92, 246, 0.4)' },
  
  // Infrastructure
  "Power plants/substations": { bg: 'rgba(236, 72, 153, 0.18)', text: '#ec4899', border: 'rgba(236, 72, 153, 0.4)' },
  "Large infrastructure projects": { bg: 'rgba(244, 63, 94, 0.18)', text: '#f43f5e', border: 'rgba(244, 63, 94, 0.4)' },

  // Backward compatibility with legacy classes
  "New Construction": { bg: 'rgba(255, 87, 34, 0.18)', text: '#ff5722', border: 'rgba(255, 87, 34, 0.4)' },
  "Vegetation Loss": { bg: 'rgba(244, 63, 94, 0.18)', text: '#f43f5e', border: 'rgba(244, 63, 94, 0.4)' },
  "Water Body Shrinkage": { bg: 'rgba(3, 169, 244, 0.18)', text: '#03a9f4', border: 'rgba(3, 169, 244, 0.4)' },
  "Road Development": { bg: 'rgba(251, 191, 36, 0.18)', text: '#fbbf24', border: 'rgba(251, 191, 36, 0.4)' },
  "General Land Alteration": { bg: 'rgba(168, 85, 247, 0.18)', text: '#a855f7', border: 'rgba(168, 85, 247, 0.4)' }
};

const TYPE_COLORS = SUBITEM_COLORS;

export const ResultsPanel: React.FC<ResultsPanelProps> = ({
  result,
  isLoading,
  onRunDetection
}) => {
  const [copiedGps, setCopiedGps] = useState(false);
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({});

  const toggleGroup = (groupId: string) => {
    setCollapsedGroups(prev => ({
      ...prev,
      [groupId]: !prev[groupId]
    }));
  };

  if (!result) {
    return (
      <div className="results-card" style={{ alignItems: 'center', justifyContent: 'center', minHeight: 280 }}>
        <p style={{ color: '#94a3b8', fontSize: '0.9rem' }}>Select a scenario or imagery pair to run change detection.</p>
        <button
          type="button"
          className="action-btn-primary"
          style={{ marginTop: '1rem' }}
          onClick={onRunDetection}
          disabled={isLoading}
        >
          <Play size={16} />
          <span>{isLoading ? 'Running Model...' : 'Run Detection Pipeline'}</span>
        </button>
      </div>
    );
  }

  const primaryType = result.primary_change_type;
  const styleConfig = TYPE_COLORS[primaryType] || TYPE_COLORS["General Land Alteration"];
  const confidencePct = result.overall_confidence * 100;

  // GPS Coordinates & Links
  const lat = result.centroid_lat !== undefined ? result.centroid_lat : 12.9716;
  const lng = result.centroid_lng !== undefined ? result.centroid_lng : 77.7289;
  const gmapsUrl = result.google_maps_url || `https://www.google.com/maps?q=${lat},${lng}&z=16`;
  const gearthUrl = result.google_earth_url || `https://earth.google.com/web/search/${lat},${lng}`;

  const handleCopyGps = () => {
    navigator.clipboard.writeText(`${lat.toFixed(6)}, ${lng.toFixed(6)}`);
    setCopiedGps(true);
    setTimeout(() => setCopiedGps(false), 2000);
  };

  const handleExportGeoJson = () => {
    const jsonStr = JSON.stringify(result.geojson, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `orbiterra_${result.location_id}_${result.id}.geojson`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="results-card">
      <div className="primary-change-header">
        <div>
          <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: '#64748b', letterSpacing: '0.05em' }}>
            Primary Detected Change
          </span>
          <div style={{ marginTop: '0.35rem', display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
            <span
              className="change-type-badge"
              style={{
                backgroundColor: styleConfig.bg,
                color: styleConfig.text,
                border: `1px solid ${styleConfig.border}`
              }}
            >
              <AlertCircle size={18} />
              <span>{primaryType}</span>
            </span>
            <span className="compact-area-pill">
              {result.total_area_hectares} ha ({result.total_area_sq_m.toLocaleString()} m²)
            </span>
          </div>
        </div>

        <div style={{ textAlign: 'right' }}>
          <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Detection ID</span>
          <div style={{ fontFamily: 'monospace', color: '#cbd5e1', fontSize: '0.85rem' }}>{result.id}</div>
          {result.is_custom_selection && (
            <span className="custom-indicator-tag">Custom ROI Selection</span>
          )}
        </div>
      </div>

      {/* Confidence Score Bar */}
      <div className="confidence-meter-group">
        <div className="confidence-label-row">
          <span>AI Detection Confidence</span>
          <span className="confidence-val">{result.confidence_percentage}</span>
        </div>
        <div className="progress-track">
          <div
            className="progress-fill"
            style={{ width: `${Math.min(100, Math.max(0, confidencePct))}%` }}
          />
        </div>
      </div>

      {/* Direct GPS Deep-Link Card */}
      <div className="gps-deeplink-card">
        <div className="gps-header">
          <div className="gps-coords-group">
            <MapPin size={15} color="#00e5ff" />
            <span className="gps-coords-text">
              {lat >= 0 ? `${lat.toFixed(4)}° N` : `${Math.abs(lat).toFixed(4)}° S`},{' '}
              {lng >= 0 ? `${lng.toFixed(4)}° E` : `${Math.abs(lng).toFixed(4)}° W`}
            </span>
          </div>
          <button
            type="button"
            className="gps-copy-btn"
            onClick={handleCopyGps}
            title="Copy coordinates to clipboard"
          >
            {copiedGps ? <Check size={12} color="#10b981" /> : <Copy size={12} />}
            <span>{copiedGps ? 'Copied' : 'Copy GPS'}</span>
          </button>
        </div>

        <div className="gps-actions-row">
          <a
            href={gmapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="gps-btn primary"
            title="Open coordinates directly in Google Maps satellite view"
          >
            <ExternalLink size={13} />
            <span>Open in Google Maps</span>
          </a>

          <a
            href={gearthUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="gps-btn secondary"
            title="Open coordinates in Google Earth 3D"
          >
            <Globe size={13} />
            <span>Google Earth</span>
          </a>
        </div>
      </div>

      {/* 2021-to-Current Multi-Temporal Change Timeline */}
      <ChangeTimeline
        events={result.timeline_events}
        isCustomArea={result.is_custom_selection}
      />

      {/* Location Label */}
      {result.location_name && (
        <div className="results-location-banner">
          <MapPin size={13} color="#00e5ff" style={{ flexShrink: 0 }} />
          <span className="results-location-text">
            📍 Location: <strong>{result.location_name}</strong>
          </span>
        </div>
      )}

      {/* Multi-Class Distribution Panel */}
      {(() => {
        // Normalize breakdown keys
        const normalizedBreakdown: Record<string, number> = {};
        if (result.breakdown) {
          for (const [key, val] of Object.entries(result.breakdown)) {
            if (typeof val !== 'number' || val <= 0) continue;
            if (key === 'Water Body Shrinkage') {
              normalizedBreakdown['Changes in rivers, lakes, reservoirs'] = (normalizedBreakdown['Changes in rivers, lakes, reservoirs'] || 0) + val;
            } else if (key === 'New Construction') {
              normalizedBreakdown['New buildings/houses'] = (normalizedBreakdown['New buildings/houses'] || 0) + val;
            } else if (key === 'Vegetation Loss') {
              normalizedBreakdown['Reduction/increase in forest/green areas'] = (normalizedBreakdown['Reduction/increase in forest/green areas'] || 0) + val;
            } else if (key === 'Road Development') {
              normalizedBreakdown['New roads'] = (normalizedBreakdown['New roads'] || 0) + val;
            } else if (key === 'General Land Alteration') {
              normalizedBreakdown['Large infrastructure projects'] = (normalizedBreakdown['Large infrastructure projects'] || 0) + val;
            } else {
              normalizedBreakdown[key] = (normalizedBreakdown[key] || 0) + val;
            }
          }
        }

        // Group non-zero detected sub-items by section header
        const activeCategoryGroups = CATEGORY_GROUPS.map(group => {
          const items = group.subItems.map(subName => {
            const pct = normalizedBreakdown[subName];
            return {
              name: subName,
              pct: typeof pct === 'number' ? pct : 0
            };
          }).filter(it => it.pct > 0);

          const groupSum = items.reduce((acc, curr) => acc + curr.pct, 0);

          return {
            ...group,
            items,
            totalPct: Math.round(groupSum * 10) / 10
          };
        }).filter(group => group.items.length > 0);

        if (activeCategoryGroups.length === 0) return null;

        return (
          <div className="breakdown-section">
            <div className="breakdown-section-header">
              <span className="breakdown-title">Multi-Class Distribution</span>
              <span className="breakdown-detected-tag">{activeCategoryGroups.length} categories detected</span>
            </div>

            <div className="category-groups-list">
              {activeCategoryGroups.map(group => {
                const isCollapsed = Boolean(collapsedGroups[group.id]);
                return (
                  <div key={group.id} className="category-group-card">
                    {/* Collapsible Header with Emoji & Percentage */}
                    <button
                      type="button"
                      className="category-group-header-btn"
                      onClick={() => toggleGroup(group.id)}
                      title={isCollapsed ? `Expand ${group.header}` : `Collapse ${group.header}`}
                    >
                      <span className="category-group-title">{group.header}</span>
                      <div className="category-group-meta">
                        <span className="category-group-badge">{group.totalPct}%</span>
                        {isCollapsed ? (
                          <ChevronDown size={14} className="group-chevron" />
                        ) : (
                          <ChevronUp size={14} className="group-chevron" />
                        )}
                      </div>
                    </button>

                    {/* Sub-items with individual progress bars */}
                    {!isCollapsed && (
                      <div className="category-subitems-container">
                        {group.items.map(({ name, pct }) => {
                          const conf = SUBITEM_COLORS[name] || SUBITEM_COLORS["New buildings/houses"];
                          return (
                            <div key={name} className="breakdown-item">
                              <div className="breakdown-item-header">
                                <span className="breakdown-subitem-name">{name}</span>
                                <span style={{ fontFamily: 'monospace', fontWeight: 600, color: conf.text }}>
                                  {pct}%
                                </span>
                              </div>
                              <div className="breakdown-track">
                                <div
                                  className="breakdown-bar"
                                  style={{
                                    width: `${pct}%`,
                                    backgroundColor: conf.text
                                  }}
                                />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })()}

      {/* Action Buttons */}
      <div className="actions-row">
        <button
          type="button"
          className="action-btn-primary"
          onClick={onRunDetection}
          disabled={isLoading}
        >
          <Play size={16} />
          <span>{isLoading ? 'Processing Pipeline...' : 'Rerun AI Detection'}</span>
        </button>

        <button
          type="button"
          className="action-btn-secondary"
          onClick={handleExportGeoJson}
          title="Export vector polygon boundaries as GeoJSON"
        >
          <Download size={16} />
          <span>Export GeoJSON</span>
        </button>
      </div>
    </div>
  );
};
