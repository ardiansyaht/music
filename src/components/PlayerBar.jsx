// ================================================================
//  Melodia — PlayerBar Component
//  Controls: ⏮ Prev Track | ⏪ -10s | ▶/⏸ Play | ⏩ +10s | ⏭ Next Track
// ================================================================
import React from 'react';
import { formatTime } from '../utils/helpers';

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
  return (
    <footer className={`player-bar ${isHidden ? 'bar-hidden' : ''}`}>
      <div className="pb-progress">
        <span className="pb-time">{formatTime(currentTime)}</span>
        <div className="pb-track" onClick={onSeek}>
          <div className="pb-fill" style={{ width: `${duration ? (currentTime / duration) * 100 : 0}%` }}></div>
          <div className="pb-thumb" style={{ left: `${duration ? (currentTime / duration) * 100 : 0}%` }}></div>
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
