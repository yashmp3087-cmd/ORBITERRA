import React, { useState } from 'react';
import { Calendar, Clock, AlertCircle, CheckCircle2, ChevronRight, Sparkles } from 'lucide-react';
import { TimelineEventItem } from '../types';

interface ChangeTimelineProps {
  events: TimelineEventItem[] | null | undefined;
  isCustomArea?: boolean;
  onSelectEvent?: (event: TimelineEventItem, index: number) => void;
}

const TYPE_COLORS: Record<string, string> = {
  "New Construction": "#ff5722",
  "Vegetation Loss": "#f43f5e",
  "Water Body Shrinkage": "#03a9f4",
  "Road Development": "#fbbf24",
  "Baseline Survey": "#10b981",
  "Ground Leveling": "#38bdf8",
  "Right of Way Clearance": "#fbbf24",
  "Partial Recovery": "#34d399",
  "Baseline Full Capacity": "#00e5ff"
};

export const ChangeTimeline: React.FC<ChangeTimelineProps> = ({
  events,
  isCustomArea,
  onSelectEvent
}) => {
  const [selectedIdx, setSelectedIdx] = useState<number>(events && events.length > 0 ? events.length - 1 : 0);

  if (!events || events.length === 0) {
    return (
      <div className="timeline-empty-card">
        <div className="timeline-empty-icon">
          <Clock size={24} color="#00e5ff" />
        </div>
        <h4 className="timeline-empty-title">2021-to-Current Timeline</h4>
        <p className="timeline-empty-desc">
          {isCustomArea
            ? "No historical telemetry recorded yet for this custom coordinate. Run AI analysis to synthesize the 2021–Present change timeline."
            : "Select a region or scenario to view the multi-temporal change progression from 2021 to present."}
        </p>
      </div>
    );
  }

  const handleItemClick = (evt: TimelineEventItem, idx: number) => {
    setSelectedIdx(idx);
    if (onSelectEvent) {
      onSelectEvent(evt, idx);
    }
  };

  const activeEvent = events[selectedIdx] || events[events.length - 1];
  const activeColor = activeEvent.badge_color || TYPE_COLORS[activeEvent.change_type] || "#00e5ff";

  return (
    <div className="timeline-wrapper">
      <div className="timeline-header">
        <div className="timeline-title-group">
          <div className="timeline-title-row">
            <Clock size={16} color="#00e5ff" />
            <span className="timeline-title">2021 → Present Change Timeline</span>
            {isCustomArea && <span className="custom-roi-pill">Custom ROI</span>}
          </div>
          <span className="timeline-subtitle">Multi-temporal Earth Observation Progression</span>
        </div>
        <span className="timeline-count-badge">{events.length} Milestones</span>
      </div>

      {/* Interactive Horizontal / Stepper Node Bar */}
      <div className="timeline-stepper">
        <div className="timeline-track-line" />
        {events.map((evt, idx) => {
          const isSelected = idx === selectedIdx;
          const isLatest = idx === events.length - 1;
          const nodeColor = evt.badge_color || TYPE_COLORS[evt.change_type] || "#00e5ff";

          return (
            <div
              key={idx}
              className={`timeline-node-item ${isSelected ? 'active' : ''}`}
              onClick={() => handleItemClick(evt, idx)}
              title={`${evt.date}: ${evt.change_type}`}
            >
              <div
                className="timeline-node-dot"
                style={{
                  borderColor: nodeColor,
                  backgroundColor: isSelected ? nodeColor : '#121826',
                  boxShadow: isSelected ? `0 0 12px ${nodeColor}` : 'none'
                }}
              >
                {isLatest && <span className="pulse-mini" style={{ backgroundColor: nodeColor }} />}
              </div>
              <span className="timeline-node-date">{evt.date}</span>
              <span className="timeline-node-type" style={{ color: isSelected ? nodeColor : '#94a3b8' }}>
                {evt.change_type.split(' ')[0]}
              </span>
            </div>
          );
        })}
      </div>

      {/* Active Milestone Card */}
      <div
        className="timeline-detail-card"
        style={{ borderLeft: `3px solid ${activeColor}` }}
      >
        <div className="timeline-detail-header">
          <div className="timeline-detail-badge" style={{ backgroundColor: `${activeColor}22`, color: activeColor, borderColor: `${activeColor}55` }}>
            <Calendar size={13} />
            <span>{activeEvent.date}</span>
          </div>

          <span
            className="timeline-change-badge"
            style={{ backgroundColor: `${activeColor}25`, color: activeColor, border: `1px solid ${activeColor}55` }}
          >
            {activeEvent.change_type}
          </span>

          <div className="timeline-detail-conf">
            <span>Confidence: </span>
            <strong style={{ color: '#00e5ff' }}>{(activeEvent.confidence * 100).toFixed(1)}%</strong>
          </div>
        </div>

        <p className="timeline-detail-notes">{activeEvent.notes}</p>

        {activeEvent.area_hectares > 0 && (
          <div className="timeline-detail-footer">
            <span>Ground Footprint Affected: </span>
            <strong>{activeEvent.area_hectares} Hectares</strong>
          </div>
        )}
      </div>
    </div>
  );
};
