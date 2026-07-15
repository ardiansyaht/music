/**
 * Fetch tracks from a Spotify playlist using an access token (Implicit Grant)
 */
export const fetchSpotifyPlaylistTracks = async (playlistId, accessToken) => {
  let tracks = [];
  let nextUrl = `https://api.spotify.com/v1/playlists/${playlistId}/tracks?limit=100`;

  try {
    while (nextUrl) {
      const res = await fetch(nextUrl, {
        headers: {
          Authorization: `Bearer ${accessToken}`
        }
      });

      if (!res.ok) {
        if (res.status === 401) {
          throw new Error('UNAUTHORIZED');
        }
        throw new Error(`Spotify API returned status ${res.status}`);
      }

      const data = await res.json();
      if (data.items) {
        const pageTracks = data.items
          .filter(item => item.track) // skip null tracks
          .map(item => ({
            title: item.track.name,
            artist: item.track.artists.map(a => a.name).join(', '),
            album: item.track.album?.name || '',
            thumbnail: item.track.album?.images[0]?.url || item.track.album?.images[1]?.url || '',
            videoId: null,
            duration: Math.round((item.track.duration_ms || 0) / 1000)
          }));
        tracks = tracks.concat(pageTracks);
      }
      nextUrl = data.next;
    }
    return tracks;
  } catch (err) {
    console.error('Spotify playlist tracks fetch failed:', err);
    throw err;
  }
};

/**
 * Redirect window to Spotify accounts authorization page
 */
export const spotifyAuthRedirect = (clientId) => {
  const origin = window.location.origin + '/';
  const redirectUri = encodeURIComponent(origin);
  const scope = encodeURIComponent('playlist-read-private playlist-read-collaborative');
  
  // Use unique state to prevent CSRF
  const state = Math.random().toString(36).substring(2, 15);
  localStorage.setItem('spotify-auth-state', state);

  const url = `https://accounts.spotify.com/authorize?client_id=${encodeURIComponent(clientId)}&response_type=token&redirect_uri=${redirectUri}&scope=${scope}&state=${state}`;
  window.location.href = url;
};
