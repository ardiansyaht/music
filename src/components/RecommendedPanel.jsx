// ================================================================
//  Melodia — RecommendedPanel Component
//  Shows recommended songs from the same artist (sidebar)
// ================================================================
import React from 'react';
import './RecommendedPanel.css';

export default function RecommendedPanel({ recommendations, currentVideoId, onSelectTrack, isLoading }) {
  if (recommendations.length === 0 && !isLoading) return null;

  return (
    <aside className="recommended-panel">
      <div className="rec-header">
        <span className="rec-title">Dari Artis Ini</span>
      </div>
      <div className="rec-list">
        {isLoading && recommendations.length === 0 && (
          <div className="rec-loading">Memuat rekomendasi...</div>
        )}
        {recommendations.map((item, idx) => (
          <div
            className={`rec-item ${item.videoId === currentVideoId ? 'rec-active' : ''}`}
            key={idx}
            onClick={() => onSelectTrack(item)}
          >
            {item.thumbnail ? (
              <img className="rec-item-art" src={item.thumbnail} alt={item.title} />
            ) : (
              <div className="rec-item-art-placeholder">♪</div>
            )}
            <div className="rec-item-info">
              <div className="rec-item-title">{item.title}</div>
              <div className="rec-item-artist">{item.artist}</div>
            </div>
          </div>
        ))}
      </div>
    </aside>
  );
}
