import React, { useState, useEffect } from 'react';
import { fetchSpotifyPlaylistTracks, fetchPipedPlaylist, spotifyAuthRedirect } from '../utils/api';
import './PlaylistModal.css';

export default function PlaylistModal({ isOpen, onClose, onImportQueue }) {
  const [playlistUrl, setPlaylistUrl] = useState('');
  const spotifyClientId = '2185a7427e234419aff3694b9f668139';
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [tracksPreview, setTracksPreview] = useState([]);
  const [playlistTitle, setPlaylistTitle] = useState('');

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
