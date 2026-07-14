// ================================================================
//  Melodia — LyricsPanel Component
// ================================================================
import React from 'react';

export default function LyricsPanel({
  currentLyrics,
  currentLyricIndex,
  lyricsScrollRef,
  onLyricClick,
  onFullscreen,
}) {
  return (
    <section className="lyrics-panel">
      <div className="lyrics-panel-header">
        {currentLyrics.length > 0 && (
          <button className="fullscreen-btn" onClick={onFullscreen} title="Lirik Fullscreen">
            ⛶
          </button>
        )}
      </div>
      {currentLyrics.length === 0 && (
        <div className="lyrics-status">
          <span className="status-icon">🎵</span>
          <span className="status-text">Cari lagu di kolom pencarian untuk melihat lirik & memutar audio</span>
        </div>
      )}
      <div className="lyrics-scroll" ref={lyricsScrollRef}>
        {currentLyrics.map((line, idx) => (
          <div
            key={idx}
            className={`lyric-line ${idx === currentLyricIndex ? 'active' : ''} ${line.type === 'instrumental' ? 'instrumental' : ''}`}
            onClick={line.time >= 0 ? () => onLyricClick(line) : null}
          >
            {line.text}
          </div>
        ))}
      </div>
    </section>
  );
}
