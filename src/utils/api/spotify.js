/**
 * Fetch tracks from a Spotify playlist using an access token (Implicit Grant)
 */
export const fetchSpotifyPlaylistTracks = async (playlistId, accessToken) => {
  let tracks = [];
  let nextUrl = `https://api.spotify.com/v1/playlists/${playlistId}/items?limit=100`;

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
        if (res.status === 403) {
          throw new Error('FORBIDDEN');
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

// PKCE Helpers
const generateRandomString = (length) => {
  let text = '';
  const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~';
  for (let i = 0; i < length; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
};

const generateCodeChallenge = async (codeVerifier) => {
  const encoder = new TextEncoder();
  const data = encoder.encode(codeVerifier);
  const digest = await window.crypto.subtle.digest('SHA-256', data);
  const byteArray = new Uint8Array(digest);
  let binary = '';
  for (let i = 0; i < byteArray.byteLength; i++) {
    binary += String.fromCharCode(byteArray[i]);
  }
  return btoa(binary)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
};

/**
 * Redirect window to Spotify accounts authorization page (PKCE)
 */
export const spotifyAuthRedirect = async (clientId) => {
  const codeVerifier = generateRandomString(64);
  localStorage.setItem('spotify-code-verifier', codeVerifier);

  const codeChallenge = await generateCodeChallenge(codeVerifier);
  const origin = window.location.origin + window.location.pathname;
  const redirectUri = encodeURIComponent(origin);
  const scope = encodeURIComponent('playlist-read-private playlist-read-collaborative');
  
  const state = Math.random().toString(36).substring(2, 15);
  localStorage.setItem('spotify-auth-state', state);

  const url = `https://accounts.spotify.com/authorize?client_id=${encodeURIComponent(clientId)}&response_type=code&redirect_uri=${redirectUri}&scope=${scope}&state=${state}&code_challenge_method=S256&code_challenge=${codeChallenge}`;
  window.location.href = url;
};

/**
 * Exchange Spotify Authorization Code for Access Token (PKCE)
 */
export const exchangeSpotifyCodeForToken = async (code, clientId) => {
  const codeVerifier = localStorage.getItem('spotify-code-verifier');
  const origin = window.location.origin + window.location.pathname;

  const res = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: new URLSearchParams({
      client_id: clientId,
      grant_type: 'authorization_code',
      code: code,
      redirect_uri: origin,
      code_verifier: codeVerifier
    })
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error_description || 'Gagal menukarkan Spotify token.');
  }

  return await res.json();
};
