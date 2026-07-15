// ================================================================
//  Melodia — HomePage Component
// ================================================================
import React from 'react';
import { QUICK_SUGGESTIONS } from '../constants';
import './HomePage.css';

export default function HomePage({ onSelectSuggestion }) {
  return (
    <div className="home-view">
      <div className="home-hero">
        <div className="home-logo">♪</div>
        <h1 className="home-title">Melodia</h1>
        <p className="home-tagline">
          Dengarkan dengan rasa. Rasakan setiap kata dalam lirik yang tersinkronisasi secara real-time.
        </p>
      </div>

      <div className="home-search-prompt">
        <span className="home-search-label">Cari lagu di atas untuk mulai</span>
        <span className="home-search-arrow">↑</span>
      </div>

      <div className="home-suggestions">
        <span className="home-suggestions-title">atau coba langsung</span>
        <div className="home-chips">
          {QUICK_SUGGESTIONS.map((s, i) => (
            <div className="home-chip" key={i} onClick={() => onSelectSuggestion(s)}>
              <span className="home-chip-icon">{s.icon}</span>
              {s.title} — {s.artist}
            </div>
          ))}
        </div>
      </div>

      <div className="home-features">
        <div className="home-feature">
          <span className="home-feature-icon">🎵</span>
          <span className="home-feature-text">Lirik Sinkron</span>
        </div>
        <div className="home-feature">
          <span className="home-feature-icon">🔊</span>
          <span className="home-feature-text">Full Audio</span>
        </div>
        <div className="home-feature">
          <span className="home-feature-icon">🎨</span>
          <span className="home-feature-text">Multi Tema</span>
        </div>
        <div className="home-feature">
          <span className="home-feature-icon">⛶</span>
          <span className="home-feature-text">Fullscreen</span>
        </div>
      </div>
    </div>
  );
}
