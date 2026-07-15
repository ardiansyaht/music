import React, { useState, useEffect } from 'react';
import { fetchSpotifyPlaylistTracks, fetchPipedPlaylist, spotifyAuthRedirect } from '../utils/api';
import './PlaylistModal.css';

export default function PlaylistModal({ isOpen, onClose, onImportQueue }) {
  const [playlistUrl, setPlaylistUrl] = useState('');
  const [spotifyClientId, setSpotifyClientId] = useState(() => {
    return localStorage.getItem('spotify-client-id') || '2185a7427e234419aff3694b9f668139';
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [tracksPreview, setTracksPreview] = useState([]);
  const [playlistTitle, setPlaylistTitle] = useState('');
  const [showConfig, setShowConfig] = useState(false);

  // Sync client ID with localStorage
  useEffect(() => {
    localStorage.setItem('spotify-client-id', spotifyClientId);
  }, [spotifyClientId]);

  if (!isOpen) return null;

  const getPlaylistDetails = (url) => {
    let type = null;
    let id = null;

    if (url.includes('spotify.com')) {
      type = 'spotify';
      const match = url.match(/playlist\/([a-zA-Z0-9]+)/);
      if (match) id = match[1];
    } else if (url.includes('youtube.com') || url.includes('youtu.be')) {
      type = 'youtube';
      const match = url.match(/[?&]list=([^&]+)/);
      if (match) id = match[1];
    }

    return { type, id };
  };

  const handleFetch = async () => {
    setError('');
    setTracksPreview([]);
    setPlaylistTitle('');

    const { type, id } = getPlaylistDetails(playlistUrl);
    if (!type || !id) {
      setError('Format link tidak valid! Harap paste URL playlist YouTube atau Spotify yang benar.');
      return;
    }

    setLoading(true);

    try {
      if (type === 'youtube') {
        const tracks = await fetchPipedPlaylist(id);
        setTracksPreview(tracks);
        setPlaylistTitle('YouTube Playlist');
      } else if (type === 'spotify') {
        const accessToken = localStorage.getItem('spotify-access-token');
        const tokenExpiry = localStorage.getItem('spotify-token-expiry');
        const now = Date.now();

        // Check if token exists and is valid
        if (!accessToken || !tokenExpiry || now > parseInt(tokenExpiry)) {
          // Token is missing or expired, we need to authorize
          if (!spotifyClientId) {
            setError('Masukkan Spotify Client ID Anda terlebih dahulu pada panel pengaturan di bawah!');
            setLoading(false);
            setShowConfig(true);
            return;
          }
          
          // Save playlist url to resume after redirection
          localStorage.setItem('spotify-pending-url', playlistUrl);
          spotifyAuthRedirect(spotifyClientId);
          return;
        }

        const tracks = await fetchSpotifyPlaylistTracks(id, accessToken);
        setTracksPreview(tracks);
        setPlaylistTitle('Spotify Playlist');
      }
    } catch (e) {
      if (e.message === 'UNAUTHORIZED') {
        setError('Otorisasi Spotify kedaluwarsa atau tidak valid. Silakan klik authorize ulang.');
        localStorage.removeItem('spotify-access-token');
      } else {
        setError(e.message || 'Gagal memuat playlist. Pastikan playlist bersifat Publik.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleImport = () => {
    if (tracksPreview.length === 0) return;
    onImportQueue(tracksPreview);
    onClose();
    // Clear preview
    setPlaylistUrl('');
    setTracksPreview([]);
    setPlaylistTitle('');
  };

  return (
    <div className="playlist-modal-overlay">
      <div className="playlist-modal">
        <div className="pl-modal-header">
          <h3>Impor Playlist</h3>
          <button className="pl-close-btn" onClick={onClose}>✕</button>
        </div>

        <div className="pl-modal-body">
          <div className="pl-input-group">
            <label>Link Playlist (Spotify atau YouTube)</label>
            <div className="pl-input-row">
              <input
                type="text"
                placeholder="Paste link playlist di sini..."
                value={playlistUrl}
                onChange={(e) => setPlaylistUrl(e.target.value)}
                disabled={loading}
              />
              <button 
                className="pl-fetch-btn" 
                onClick={handleFetch} 
                disabled={loading || !playlistUrl.trim()}
              >
                {loading ? 'Memuat...' : 'Muat'}
              </button>
            </div>
          </div>

          {error && <div className="pl-error">{error}</div>}

          {/* Config Settings (Collapsible) */}
          <div className="pl-config-section">
            <button 
              className="pl-config-toggle" 
              onClick={() => setShowConfig(!showConfig)}
            >
              ⚙️ Pengaturan Spotify Client ID {showConfig ? '▲' : '▼'}
            </button>

            {showConfig && (
              <div className="pl-config-body">
                <p className="pl-help-text">
                  Untuk memuat playlist Spotify, Anda membutuhkan **Client ID** (Gratis). 
                  Cara dapatkan dalam 1 menit:
                  <br />
                  1. Masuk ke [developer.spotify.com](https://developer.spotify.com/dashboard).
                  2. Buat App baru, beri nama bebas.
                  3. Di pengaturan App, tambahkan **Redirect URI**: <code>{window.location.origin}/</code>
                  4. Copy **Client ID** dan paste di bawah ini.
                </p>
                <div className="pl-client-id-row">
                  <input
                    type="text"
                    placeholder="Masukkan Spotify Client ID Anda..."
                    value={spotifyClientId}
                    onChange={(e) => setSpotifyClientId(e.target.value)}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Playlist Preview */}
          {tracksPreview.length > 0 && (
            <div className="pl-preview">
              <div className="pl-preview-header">
                <span>{playlistTitle} — {tracksPreview.length} Lagu</span>
              </div>
              <div className="pl-preview-list">
                {tracksPreview.map((track, idx) => (
                  <div key={idx} className="pl-preview-item">
                    <span className="pl-num">{idx + 1}</span>
                    {track.thumbnail ? (
                      <img src={track.thumbnail} alt="" className="pl-thumb" />
                    ) : (
                      <div className="pl-thumb-placeholder">♪</div>
                    )}
                    <div className="pl-info">
                      <div className="pl-title">{track.title}</div>
                      <div className="pl-artist">{track.artist}</div>
                    </div>
                  </div>
                ))}
              </div>
              <button className="pl-import-submit-btn" onClick={handleImport}>
                📥 Masukkan Semua ke Antrean
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
