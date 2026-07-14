// ================================================================
//  Melodia — NowPlaying Component
// ================================================================
import React from 'react';

export default function NowPlaying({ songInfo, isPlaying, isLoading }) {
  if (isLoading) {
    return (
      <section className="now-playing skeleton">
        <div className="np-art-wrapper skeleton-shimmer">
          <div className="np-art-placeholder skeleton-art"></div>
        </div>
        <div className="np-info">
          <div className="skeleton-line skeleton-title"></div>
          <div className="skeleton-line skeleton-artist"></div>
        </div>
      </section>
    );
  }

  return (
    <section className="now-playing">
      <div className="np-art-wrapper">
        <img
          className={`np-album-art ${songInfo.thumbnail ? 'visible' : ''} ${isPlaying ? 'playing' : ''}`}
          src={songInfo.thumbnail}
          alt="Album Art"
        />
        {!songInfo.thumbnail && <div className="np-art-placeholder">♪</div>}
        <div className="np-art-glow"></div>
      </div>

      <div className="np-info">
        <div className="np-title-row">
          <h1 className="np-song-title">{songInfo.title || 'Pilih lagu untuk diputar'}</h1>
          {songInfo.videoId && <span className="np-badge np-badge-full">FULL SONG</span>}
        </div>
        <p className="np-artist">{songInfo.artist}</p>
        {songInfo.album && <p className="np-album">{songInfo.album}</p>}
      </div>
    </section>
  );
}
