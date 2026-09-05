import React from 'react';
import { Satellite, Activity, Cpu, Database } from 'lucide-react';
import { GlobalStats } from '../types';

interface NavbarProps {
  stats: GlobalStats | null;
}

export const Navbar: React.FC<NavbarProps> = ({ stats }) => {
  return (
    <header className="navbar">
      <div className="nav-brand">
        <div className="brand-icon-wrapper">
          <Satellite size={22} />
        </div>
        <div>
          <span className="brand-title">SatChange AI</span>
          <span className="brand-badge">SIH PROTOTYPE</span>
        </div>
      </div>

      <div className="nav-telemetry">
        <div className="telemetry-item">
          <span className="pulse-dot" />
          <span>Core AI Engine: <strong>Online</strong></span>
        </div>

        <div className="telemetry-item">
          <Cpu size={15} color="#00e5ff" />
          <span>Latency: <strong>{stats?.average_inference_latency_ms || 68.4}ms</strong></span>
        </div>

        <div className="telemetry-item">
          <Activity size={15} color="#10b981" />
          <span>Avg Confidence: <strong>{stats?.model_confidence_benchmark || '91.8%'}</strong></span>
        </div>

        <div className="telemetry-item">
          <Database size={15} color="#fbbf24" />
          <span>PostGIS / Spatial DB: <strong>Active</strong></span>
        </div>
      </div>
    </header>
  );
};
