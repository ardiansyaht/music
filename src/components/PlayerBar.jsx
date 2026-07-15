import React, { useState, useEffect, useRef } from 'react';
import { formatTime } from '../utils/helpers';
import '../styles/PlayerBar.css';

export default function PlayerBar({
  currentTime,
  duration,
  isPlaying,
  syncOffset,
  volume,
  isMuted,
  hasPrev,
  hasNext,
  onSeek,
  onPlayToggle,
  onRewind,
  onForward,
  onPrevTrack,
  onNextTrack,
  onSyncAdjust,
  onVolumeChange,
  onToggleMute,
  isHidden,
  onToggleHide,
}) {
  const [isDragging, setIsDragging] = useState(false);
  const [localPercent, setLocalPercent] = useState(0);
  const trackRef = useRef(null);

  // Sync localPercent when not dragging
  useEffect(() => {
    if (!isDragging) {
      setLocalPercent(duration ? (currentTime / duration) * 100 : 0);
    }
  }, [currentTime, duration, isDragging]);

  // Helper to calculate percentage from pointer event
  const getPercentFromEvent = (e) => {
    if (!trackRef.current) return 0;
    const rect = trackRef.current.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clickX = clientX - rect.left;
    return Math.max(0, Math.min(100, (clickX / rect.width) * 100));
  };

  const handleStartDrag = (e) => {
    setIsDragging(true);
    const pct = getPercentFromEvent(e);
    setLocalPercent(pct);
  };

  useEffect(() => {
    if (!isDragging) return;

    const handleMove = (e) => {
      const pct = getPercentFromEvent(e);
      setLocalPercent(pct);
    };

    const handleEnd = (e) => {
      setIsDragging(false);
      const pct = getPercentFromEvent(e);
      const targetTime = (pct / 100) * duration;
      onSeek(targetTime);
    };

    window.addEventListener('mousemove', handleMove);
    window.addEventListener('mouseup', handleEnd);
    window.addEventListener('touchmove', handleMove);
    window.addEventListener('touchend', handleEnd);

    return () => {
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseup', handleEnd);
      window.removeEventListener('touchmove', handleMove);
      window.removeEventListener('touchend', handleEnd);
    };
  }, [isDragging, duration, onSeek]);

  const displayedTime = isDragging 
    ? (localPercent / 100) * duration 
    : currentTime;

  return (
    <footer className={`player-bar ${isHidden ? 'bar-hidden' : ''}`}>
      <div className="pb-progress">
        <span className="pb-time">{formatTime(displayedTime)}</span>
        <div 
          className="pb-track" 
          ref={trackRef} 
          onMouseDown={handleStartDrag}
          onTouchStart={handleStartDrag}
        >
          <div className="pb-fill" style={{ width: `${localPercent}%` }}></div>
          <div className="pb-thumb" style={{ left: `${localPercent}%`, opacity: isDragging ? 1 : '' }}></div>
        </div>
        <span className="pb-time">{formatTime(duration)}</span>
      </div>

      <div className="pb-controls">
        <div className="pb-left">
          <button className="hide-bar-btn" onClick={onToggleHide} title="Sembunyikan Kontrol (H)">
            ▼ Sembunyikan
          </button>
        </div>

        <div className="pb-center">
          <button
            className={`ctrl-btn ctrl-skip ${!hasPrev ? 'disabled' : ''}`}
            onClick={onPrevTrack}
            title="Lagu Sebelumnya"
            disabled={!hasPrev}
          >
            ⏮
          </button>
          <button className="ctrl-btn" onClick={onRewind} title="Mundur 10s">
            <span className="ctrl-skip-label">⏪</span>
          </button>
          <button className="ctrl-btn ctrl-play" onClick={onPlayToggle} title={isPlaying ? 'Jeda' : 'Putar'}>
            <span>{isPlaying ? '⏸' : '▶'}</span>
          </button>
          <button className="ctrl-btn" onClick={onForward} title="Maju 10s">
            <span className="ctrl-skip-label">⏩</span>
          </button>
          <button
            className={`ctrl-btn ctrl-skip ${!hasNext ? 'disabled' : ''}`}
            onClick={onNextTrack}
            title="Lagu Berikutnya"
            disabled={!hasNext}
          >
            ⏭
          </button>
        </div>

        <div className="pb-right">
          <span className="vol-icon" onClick={onToggleMute}>
            {isMuted ? '🔇' : volume === 0 ? '🔇' : volume < 40 ? '🔈' : volume < 70 ? '🔉' : '🔊'}
          </span>
          <input
            type="range"
            min="0"
            max="100"
            value={volume}
            onChange={(e) => onVolumeChange(parseInt(e.target.value))}
            className="vol-slider"
          />
        </div>
      </div>
    </footer>
  );
}
