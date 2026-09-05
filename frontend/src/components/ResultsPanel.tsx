import React, { useState } from 'react';
import { AlertCircle, Download, Play, CheckCircle2, MapPin, Maximize2, ExternalLink, Globe, Copy, Check } from 'lucide-react';
import { CompareResult } from '../types';
import { ChangeTimeline } from './ChangeTimeline';

interface ResultsPanelProps {
  result: CompareResult | null;
  isLoading: boolean;
  onRunDetection: () => void;
}

const TYPE_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  "New Construction": { bg: 'rgba(255, 87, 34, 0.18)', text: '#ff5722', border: 'rgba(255, 87, 34, 0.4)' },
  "Vegetation Loss": { bg: 'rgba(244, 63, 94, 0.18)', text: '#f43f5e', border: 'rgba(244, 63, 94, 0.4)' },
  "Water Body Shrinkage": { bg: 'rgba(3, 169, 244, 0.18)', text: '#03a9f4', border: 'rgba(3, 169, 244, 0.4)' },
  "Road Development": { bg: 'rgba(251, 191, 36, 0.18)', text: '#fbbf24', border: 'rgba(251, 191, 36, 0.4)' },
  "General Land Alteration": { bg: 'rgba(168, 85, 247, 0.18)', text: '#a855f7', border: 'rgba(168, 85, 247, 0.4)' }
};

export const ResultsPanel: React.FC<ResultsPanelProps> = ({
  result,
  isLoading,
  onRunDetection
}) => {
  const [copiedGps, setCopiedGps] = useState(false);

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
    a.download = `satchange_${result.location_id}_${result.id}.geojson`;
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

      {/* Breakdown per change type */}
      {result.breakdown && Object.keys(result.breakdown).length > 0 && (
        <div className="breakdown-section">
          <span className="breakdown-title">Multi-Class Distribution</span>
          {Object.entries(result.breakdown).map(([typeName, pct]) => {
            const conf = TYPE_COLORS[typeName] || TYPE_COLORS["General Land Alteration"];
            return (
              <div key={typeName} className="breakdown-item">
                <div className="breakdown-item-header">
                  <span>{typeName}</span>
                  <span style={{ fontFamily: 'monospace', fontWeight: 600 }}>{pct}%</span>
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
