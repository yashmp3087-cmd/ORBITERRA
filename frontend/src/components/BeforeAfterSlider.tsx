import React, { useState, useRef, useCallback } from 'react';
import { MoveHorizontal, MapPin, Satellite } from 'lucide-react';

interface BeforeAfterSliderProps {
  beforeImageUrl: string;
  afterImageUrl: string;
  maskImageUrl?: string;
  showMask?: boolean;
  beforeDate?: string;
  afterDate?: string;
  onSwitchToMap?: () => void;
}

export const BeforeAfterSlider: React.FC<BeforeAfterSliderProps> = ({
  beforeImageUrl,
  afterImageUrl,
  maskImageUrl,
  showMask = true,
  beforeDate = 'T1: Baseline',
  afterDate = 'T2: Recent',
  onSwitchToMap
}) => {
  const [sliderPos, setSliderPos] = useState<number>(50); // percentage 0..100
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMove = useCallback((clientX: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const pos = Math.max(0, Math.min(100, (x / rect.width) * 100));
    setSliderPos(pos);
  }, []);

  const handleMouseDown = () => setIsDragging(true);
  const handleMouseUp = () => setIsDragging(false);

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      handleMove(e.clientX);
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length > 0) {
      handleMove(e.touches[0].clientX);
    }
  };

  // If one or both images are missing (e.g. unseeded or custom search), show honest empty state notice
  if (!beforeImageUrl || !afterImageUrl) {
    return (
      <div 
        className="slider-container"
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '510px',
          background: 'radial-gradient(ellipse at center, #0f172a 0%, #020617 100%)',
          color: '#94a3b8',
          padding: '2rem',
          textAlign: 'center'
        }}
      >
        <Satellite size={48} color="#38bdf8" style={{ marginBottom: '1rem', opacity: 0.85 }} />
        <h3 style={{ color: '#f8fafc', fontSize: '1.15rem', marginBottom: '0.5rem', fontWeight: 600 }}>
          No Multi-Temporal Comparison Pair in Catalog
        </h3>
        <p style={{ maxWidth: '450px', fontSize: '0.875rem', lineHeight: '1.5', marginBottom: '1.5rem', color: '#94a3b8' }}>
          This geographic region does not have pre-loaded multi-temporal image pairs. View the live high-resolution satellite basemap and drawn boundaries in GIS Map View.
        </p>
        {onSwitchToMap && (
          <button
            type="button"
            className="tab-btn active"
            onClick={onSwitchToMap}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.6rem 1.25rem',
              cursor: 'pointer',
              borderRadius: '6px',
              fontWeight: 500
            }}
          >
            <MapPin size={16} color="#00e5ff" />
            <span>Switch to GIS Map View</span>
          </button>
        )}
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="slider-container"
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onMouseMove={handleMouseMove}
      onTouchMove={handleTouchMove}
      onTouchStart={handleMouseDown}
      onTouchEnd={handleMouseUp}
    >
      {/* Background: After (T2) Image */}
      <img
        src={afterImageUrl}
        alt="After satellite scene"
        className="slider-img"
      />

      {/* Optional AI Change Mask Overlay on After Scene */}
      {showMask && maskImageUrl && (
        <img
          src={maskImageUrl}
          alt="AI change detection mask"
          className="slider-img"
          style={{
            mixBlendMode: 'screen',
            opacity: 0.85,
            pointerEvents: 'none'
          }}
        />
      )}

      {/* Foreground: Before (T1) Image clipped to sliderPos */}
      <div
        className="slider-before-wrap"
        style={{ width: `${sliderPos}%` }}
      >
        <img
          src={beforeImageUrl}
          alt="Before satellite scene"
          className="slider-img"
          style={{ width: containerRef.current?.offsetWidth || '100%', maxWidth: 'none' }}
        />
      </div>

      {/* Draggable Divider Handle Line */}
      <div
        className="slider-handle-line"
        style={{ left: `${sliderPos}%` }}
      >
        <div className="slider-handle-thumb">
          <MoveHorizontal size={18} />
        </div>
      </div>

      {/* Badges */}
      <div className="slider-badge slider-badge-before">
        ◀ {beforeDate}
      </div>
      <div className="slider-badge slider-badge-after">
        {afterDate} ▶
      </div>
    </div>
  );
};
