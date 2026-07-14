// ================================================================
//  Melodia — TopBar Component
// ================================================================
import React from 'react';
import { formatTime } from '../utils/helpers';

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
}) {
  return (
    <header className="top-bar">
      <div className="top-bar-left" onClick={onGoHome} style={{ cursor: 'pointer' }}>
        <span className="brand-logo">♪</span>
        <span className="brand-name">Melodia</span>
      </div>

      <div className="search-area">
        <div className="search-box">
          <span className="search-icon">🔍</span>
          <input
            type="text"
            placeholder="Cari lagu, artis, album..."
            value={searchQuery}
            onChange={onSearchInput}
            autoComplete="off"
            spellCheck="false"
          />
          {searchQuery && (
            <button className="search-clear" onClick={onClearSearch} title="Hapus">
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

      <div className="top-bar-right">
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
