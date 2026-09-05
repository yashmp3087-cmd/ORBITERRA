import React, { useState } from 'react';
import { Search, Sparkles } from 'lucide-react';
import { ParsedIntent } from '../types';

interface SearchBarProps {
  onSearch: (query: string) => void;
  parsedIntent: ParsedIntent | null;
  isLoading: boolean;
}

export const SearchBar: React.FC<SearchBarProps> = ({
  onSearch,
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
    </section>
  );
};
