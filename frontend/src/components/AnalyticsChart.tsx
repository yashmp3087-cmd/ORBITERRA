import React, { useState } from 'react';
import { TrendingUp, Calendar } from 'lucide-react';
import { LocationChanges } from '../types';

interface AnalyticsChartProps {
  locationData: LocationChanges | null;
}

export const AnalyticsChart: React.FC<AnalyticsChartProps> = ({ locationData }) => {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  if (!locationData || !locationData.summary_chart_data || locationData.summary_chart_data.length === 0) {
    return (
      <div className="chart-card">
        <div className="chart-header">
          <span className="chart-title">Multi-Temporal Change Trend</span>
        </div>
        <p style={{ color: '#64748b', fontSize: '0.85rem' }}>No historical trendline available for this location.</p>
      </div>
    );
  }

  const data = locationData.summary_chart_data;
  
  // Extract dynamic numeric keys (e.g. built_up_area_ha, vegetation_cover_ha, water_surface_ha, paved_roads_ha)
  const sample = data[0];
  const metricKeys = Object.keys(sample).filter(k => k !== 'period');

  const COLOR_MAP: Record<string, string> = {
    built_up_area_ha: '#ff5722',
    vegetation_cover_ha: '#10b981',
    water_surface_ha: '#00e5ff',
    paved_roads_ha: '#fbbf24',
    bare_soil_ha: '#94a3b8'
  };

  const LABEL_MAP: Record<string, string> = {
    built_up_area_ha: 'Built-up (ha)',
    vegetation_cover_ha: 'Vegetation (ha)',
    water_surface_ha: 'Water Body (ha)',
    paved_roads_ha: 'Paved Infra (ha)',
    bare_soil_ha: 'Bare Soil (ha)'
  };

  // Find max value for Y scaling
  let maxVal = 10;
  data.forEach(d => {
    metricKeys.forEach(k => {
      const val = Number(d[k]) || 0;
      if (val > maxVal) maxVal = val;
    });
  });
  maxVal = Math.ceil(maxVal * 1.15);

  const width = 480;
  const height = 150;
  const paddingX = 45;
  const paddingY = 25;

  const getX = (idx: number) => {
    return paddingX + (idx / (data.length - 1)) * (width - paddingX * 2);
  };

  const getY = (val: number) => {
    return height - paddingY - (val / maxVal) * (height - paddingY * 2);
  };

  return (
    <div className="chart-card">
      <div className="chart-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <TrendingUp size={16} color="#00e5ff" />
          <span className="chart-title">Multi-Temporal Change Trends</span>
        </div>
        <div style={{ display: 'flex', gap: '0.8rem', fontSize: '0.75rem' }}>
          {metricKeys.map(k => (
            <div key={k} style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <span
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  backgroundColor: COLOR_MAP[k] || '#fff'
                }}
              />
              <span style={{ color: '#94a3b8' }}>{LABEL_MAP[k] || k}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="chart-container">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          style={{ width: '100%', height: '100%', overflow: 'visible' }}
        >
          {/* Horizontal Grid lines */}
          {[0, 0.33, 0.66, 1].map((ratio, i) => {
            const y = height - paddingY - ratio * (height - paddingY * 2);
            const val = Math.round(ratio * maxVal);
            return (
              <g key={i}>
                <line
                  x1={paddingX}
                  y1={y}
                  x2={width - paddingX}
                  y2={y}
                  stroke="#1e293b"
                  strokeDasharray="3 3"
                />
                <text
                  x={paddingX - 8}
                  y={y + 3}
                  fill="#64748b"
                  fontSize="10"
                  textAnchor="end"
                  fontFamily="monospace"
                >
                  {val}
                </text>
              </g>
            );
          })}

          {/* Metric Trend Polylines */}
          {metricKeys.map(k => {
            const color = COLOR_MAP[k] || '#fff';
            const points = data
              .map((d, idx) => `${getX(idx)},${getY(Number(d[k]) || 0)}`)
              .join(' ');

            return (
              <g key={k}>
                <polyline
                  fill="none"
                  stroke={color}
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  points={points}
                />
                {data.map((d, idx) => {
                  const x = getX(idx);
                  const y = getY(Number(d[k]) || 0);
                  const isHovered = hoveredIdx === idx;
                  return (
                    <circle
                      key={idx}
                      cx={x}
                      cy={y}
                      r={isHovered ? 5 : 3.5}
                      fill={color}
                      stroke="#0a0d14"
                      strokeWidth="1.5"
                      style={{ cursor: 'pointer', transition: 'all 0.15s ease' }}
                    />
                  );
                })}
              </g>
            );
          })}

          {/* X Axis Periods */}
          {data.map((d, idx) => {
            const x = getX(idx);
            return (
              <text
                key={idx}
                x={x}
                y={height - 5}
                fill="#94a3b8"
                fontSize="10"
                textAnchor="middle"
                fontFamily="monospace"
                style={{ cursor: 'pointer' }}
                onMouseEnter={() => setHoveredIdx(idx)}
                onMouseLeave={() => setHoveredIdx(null)}
              >
                {d.period}
              </text>
            );
          })}
        </svg>
      </div>

      {/* Timeline event log */}
      {locationData.timeline && locationData.timeline.length > 0 && (
        <div style={{ borderTop: '1px solid #1e293b', paddingTop: '0.75rem', marginTop: '0.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.78rem', color: '#94a3b8', marginBottom: '0.4rem' }}>
            <Calendar size={13} />
            <span>Latest Sentinel-2 / Landsat Observation:</span>
            <strong style={{ color: '#00e5ff' }}>
              {locationData.timeline[locationData.timeline.length - 1].date}
            </strong>
          </div>
          <p style={{ fontSize: '0.8rem', color: '#cbd5e1', lineHeight: '1.4' }}>
            {locationData.timeline[locationData.timeline.length - 1].notes}
          </p>
        </div>
      )}
    </div>
  );
};
