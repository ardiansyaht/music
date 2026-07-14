// ================================================================
//  Melodia — NowPlaying Component
// ================================================================
import React from 'react';

export default function NowPlaying({ songInfo, isPlaying }) {
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
