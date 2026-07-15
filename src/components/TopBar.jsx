// ================================================================
//  Melodia — TopBar Component
// ================================================================
import React from 'react';
import { formatTime } from '../utils/helpers';
import './TopBar.css';

export default function TopBar({
  theme,
  setTheme,
  searchQuery,
  onSearchInput,
  onClearSearch,
  showSearchDropdown,
  isSearching,
  searchResults,
  onSelectTrack,
  onGoHome,
  onOpenPlaylistModal,
}) {
  return (
    <header className="top-bar">
      <div className="top-bar-left" onClick={onGoHome} style={{ cursor: 'pointer' }} title="Melodia Home">
        <span className="brand-logo">🎵</span>
        <span className="brand-name">Melodia</span>
      </div>

      <div className="top-bar-middle search-area">
        <div className="search-box">
          <span className="search-icon">🔍</span>
          <input
            type="text"
            placeholder="Cari lagu atau artis..."
            value={searchQuery}
            onChange={onSearchInput}
          />
          {searchQuery && (
            <button className="clear-search-btn" onClick={onClearSearch}>
              ✕
            </button>
          )}
        </div>

        {showSearchDropdown && (
          <div className="search-results visible">
            {isSearching ? (
              <div className="sr-loading">Mencari</div>
            ) : searchResults.length === 0 ? (
              <div className="sr-empty">Tidak ada hasil untuk "{searchQuery}"</div>
            ) : (
              searchResults.map((item, idx) => (
                <div className="sr-item" key={idx} onClick={() => onSelectTrack(item)}>
                  {item.thumbnail ? (
                    <img className="sr-item-art" src={item.thumbnail} alt={item.title} />
                  ) : (
                    <div className="sr-item-art-placeholder">♪</div>
                  )}
                  <div className="sr-item-info">
                    <div className="sr-item-title">{item.title}</div>
                    <div className="sr-item-meta">{item.artist}</div>
                  </div>
                  <div className="sr-item-badges">
                    {item.duration > 0 && <span className="sr-badge duration">{formatTime(item.duration)}</span>}
                    {item.hasSynced && <span className="sr-badge synced">SYNCED</span>}
                    {item.videoId && <span className="sr-badge full">FULL SONG</span>}
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      <div className="top-bar-right" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <button
          className="import-playlist-trigger-btn"
          onClick={onOpenPlaylistModal}
          title="Impor Playlist dari Spotify / YouTube"
          style={{
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-s)',
            padding: '0.4rem 0.8rem',
            fontSize: '0.85rem',
            fontWeight: '600',
            color: 'var(--text-main)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem',
            transition: 'transform 0.2s, border-color 0.2s'
          }}
          onMouseEnter={(e) => e.currentTarget.style.borderColor = 'var(--accent)'}
          onMouseLeave={(e) => e.currentTarget.style.borderColor = 'var(--border)'}
        >
          📂 Impor Playlist
        </button>

        <div className="theme-switcher">
          <button className={`theme-btn ${theme === 'pastel' ? 'active' : ''}`} onClick={() => setTheme('pastel')} title="Pastel Dream">🌸</button>
          <button className={`theme-btn ${theme === 'vhs' ? 'active' : ''}`} onClick={() => setTheme('vhs')} title="Retro VHS">📼</button>
          <button className={`theme-btn ${theme === 'space' ? 'active' : ''}`} onClick={() => setTheme('space')} title="Dark Space">🌌</button>
          <button className={`theme-btn ${theme === 'cyber' ? 'active' : ''}`} onClick={() => setTheme('cyber')} title="Cyberpunk">⚡</button>
        </div>
      </div>
    </header>
  );
}
