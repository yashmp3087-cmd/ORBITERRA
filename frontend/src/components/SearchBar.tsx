import React, { useState } from 'react';
import { Search, Sparkles, Navigation, Layers } from 'lucide-react';
import { ParsedIntent, Scenario } from '../types';

interface SearchBarProps {
  onSearch: (query: string) => void;
  onSelectScenario: (scenario: Scenario) => void;
  scenarios: Scenario[];
  activeScenarioId: string;
  parsedIntent: ParsedIntent | null;
  isLoading: boolean;
}

const EXAMPLE_QUERIES = [
  "Find new buildings in Bengaluru tech corridor",
  "Deforestation along Western Ghats reserve",
  "Reservoir water shrinkage at Osmansagar",
  "Highway infrastructure on Yamuna expressway"
];

export const SearchBar: React.FC<SearchBarProps> = ({
  onSearch,
  onSelectScenario,
  scenarios,
  activeScenarioId,
  parsedIntent,
  isLoading
}) => {
  const [query, setQuery] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      onSearch(query.trim());
    }
  };

  const handlePromptClick = (prompt: string) => {
    setQuery(prompt);
    onSearch(prompt);
  };

  return (
    <section className="search-scenarios-bar">
      <form onSubmit={handleSubmit} className="search-input-row">
        <div className="search-field-container">
          <Search size={18} className="search-field-icon" />
          <input
            type="text"
            className="search-input"
            placeholder="Enter natural language query (e.g. 'find new buildings near the river', 'deforestation in hills')..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <button type="submit" className="search-btn" disabled={isLoading || !query.trim()}>
          <Sparkles size={16} />
          <span>{isLoading ? 'Searching...' : 'Semantic Search'}</span>
        </button>
      </form>

      {parsedIntent && (
        <div className="intent-banner">
          <div>
            <span>Parsed Spatial Intent: </span>
            <span className="intent-tag">{parsedIntent.target_change_type}</span>
            {parsedIntent.detected_location && (
              <span> | Location: <strong style={{ color: '#fff' }}>{parsedIntent.detected_location.toUpperCase()}</strong></span>
            )}
          </div>
          <span style={{ fontSize: '0.78rem', color: '#94a3b8' }}>
            {parsedIntent.has_temporal_intent ? 'Temporal comparison intent detected' : 'Spatial query'}
          </span>
        </div>
      )}

      <div className="scenarios-row">
        <span className="scenarios-label">Demo Scenarios:</span>
        {scenarios.map((scn) => {
          const isActive = scn.scenario_id === activeScenarioId;
          return (
            <button
              key={scn.scenario_id}
              type="button"
              className={`scenario-chip ${isActive ? 'active' : ''}`}
              onClick={() => onSelectScenario(scn)}
            >
              <Navigation size={13} />
              <span>{scn.title}</span>
            </button>
          );
        })}
      </div>

      <div className="scenarios-row" style={{ marginTop: '0.2rem' }}>
        <span className="scenarios-label">Try Asking:</span>
        {EXAMPLE_QUERIES.map((q, idx) => (
          <button
            key={idx}
            type="button"
            className="scenario-chip"
            style={{ fontSize: '0.78rem', background: 'transparent' }}
            onClick={() => handlePromptClick(q)}
          >
            "{q}"
          </button>
        ))}
      </div>
    </section>
  );
};
