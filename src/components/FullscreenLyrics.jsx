// ================================================================
//  Melodia — FullscreenLyrics Component
//  Bottom controls auto-hide after 3s, header always visible
// ================================================================
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { formatTime } from '../utils/helpers';

export default function FullscreenLyrics({
  isActive,
  songInfo,
  currentLyrics,
  currentLyricIndex,
  currentTime,
  duration,
  isPlaying,
  fsLyricsScrollRef,
  onClose,
  onLyricClick,
  onPlayToggle,
  onRewind,
  onForward,
  onSeek,
}) {
  const [showControls, setShowControls] = useState(false);
  const hideTimerRef = useRef(null);

  useEffect(() => {
    return () => {
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    };
  }, []);

  useEffect(() => {
    if (!isActive) {
      setShowControls(false);
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    }
  }, [isActive]);

  const startHideTimer = useCallback(() => {
    if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    hideTimerRef.current = setTimeout(() => {
      setShowControls(false);
    }, 3000);
  }, []);

  const handleMouseMove = useCallback(() => {
    setShowControls(true);
    startHideTimer();
  }, [startHideTimer]);

  return (
    <div
      className={`fullscreen-overlay ${isActive ? 'active' : ''}`}
      onMouseMove={handleMouseMove}
      onTouchStart={handleMouseMove}
    >
      {/* Header always visible */}
      <div className="fs-header">
        <div className="fs-song-info">
          {songInfo.thumbnail ? (
            <img className="fs-art" src={songInfo.thumbnail} alt="Art" />
          ) : (
            <div className="fs-art-placeholder">♪</div>
          )}
          <div className="fs-text">
            <div className="fs-title">{songInfo.title}</div>
            <div className="fs-artist">{songInfo.artist}</div>
          </div>
        </div>
        <button className="fs-close" onClick={onClose} title="Tutup (ESC)">
          ✕
        </button>
      </div>

      <div className="fs-lyrics-scroll" ref={fsLyricsScrollRef}>
        {currentLyrics.map((line, idx) => (
          <div
            key={idx}
            className={`fs-lyric-line ${idx === currentLyricIndex ? 'active' : ''} ${line.type === 'instrumental' ? 'instrumental' : ''}`}
            onClick={line.time >= 0 ? () => onLyricClick(line) : null}
          >
            {line.text}
          </div>
        ))}
      </div>

      {/* Bottom controls: auto-hide after 3s */}
      <div className={`fs-controls ${showControls ? 'visible' : 'hidden'}`}>
        <button className="fs-ctrl-btn" onClick={onRewind} title="Mundur 10s">⏪</button>
        <button className="fs-ctrl-btn fs-ctrl-play" onClick={onPlayToggle} title={isPlaying ? 'Jeda' : 'Putar'}>
          {isPlaying ? '⏸' : '▶'}
        </button>
        <button className="fs-ctrl-btn" onClick={onForward} title="Maju 10s">⏩</button>
        <div className="fs-progress">
          <span className="fs-time">{formatTime(currentTime)}</span>
          <div className="fs-track" onClick={onSeek}>
            <div className="fs-fill" style={{ width: `${duration ? (currentTime / duration) * 100 : 0}%` }}></div>
          </div>
          <span className="fs-time">{formatTime(duration)}</span>
        </div>
      </div>
    </div>
  );
}
