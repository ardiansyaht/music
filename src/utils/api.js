// ================================================================
//  Melodia — API Clients
// ================================================================
import { PIPED_INSTANCES } from '../constants';

/**
 * Search songs via Piped (YouTube frontend proxy)
 */
export const searchPiped = async (q) => {
  for (const instance of PIPED_INSTANCES) {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 6000);
      const res = await fetch(`${instance}/search?q=${encodeURIComponent(q)}&filter=music_songs`, {
        signal: controller.signal,
      });
      clearTimeout(timer);
      if (!res.ok) continue;
      const data = await res.json();
      if (data.items && data.items.length > 0) return data.items;
    } catch (err) {}
  }
  // Fallback: videos query
  for (const instance of PIPED_INSTANCES) {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 6000);
      const res = await fetch(`${instance}/search?q=${encodeURIComponent(q)}&filter=videos`, {
        signal: controller.signal,
      });
      clearTimeout(timer);
      if (!res.ok) continue;
      const data = await res.json();
      if (data.items && data.items.length > 0) return data.items;
    } catch (err) {}
  }
  return [];
};

/**
 * Search synced lyrics via LRCLIB
 */
export const searchLRCLIB = async (q) => {
  try {
    const res = await fetch(`https://lrclib.net/api/search?q=${encodeURIComponent(q)}`);
    if (!res.ok) return [];
    return await res.json();
  } catch (e) {
    return [];
  }
};

/**
 * Fetch album art via Deezer JSONP
 */
export const fetchDeezerArt = async (artist, title) => {
  try {
    const data = await deezerJSONP(
      `https://api.deezer.com/search?q=${encodeURIComponent(artist + ' ' + title)}&limit=1`
    );
    if (data.data && data.data.length > 0) {
      return data.data[0].album?.cover_medium || '';
    }
  } catch (e) {}
  return '';
};

/**
 * Deezer JSONP wrapper (bypasses CORS)
 */
const deezerJSONP = (url) => {
  return new Promise((resolve, reject) => {
    const cb = 'deezer_cb_' + Math.random().toString(36).substring(2, 15);
    const script = document.createElement('script');
    script.src = `${url}&output=jsonp&callback=${cb}`;
    window[cb] = function(data) {
      resolve(data);
      delete window[cb];
      if (script.parentNode) script.parentNode.removeChild(script);
    };
    script.onerror = () => {
      reject(new Error('Deezer JSONP failed'));
      delete window[cb];
      if (script.parentNode) script.parentNode.removeChild(script);
    };
    document.head.appendChild(script);
  });
};

/**
 * Fetch top tracks by an artist via Deezer JSONP for same-artist recommendations
 */
export const fetchArtistTracks = async (artist) => {
  try {
    // Step 1: Search for the exact artist ID to avoid fuzzy keyword matches
    const artistSearch = await deezerJSONP(
      `https://api.deezer.com/search/artist?q=${encodeURIComponent(artist)}&limit=1`
    );
    if (artistSearch.data && artistSearch.data.length > 0) {
      const artistId = artistSearch.data[0].id;
      const artistName = artistSearch.data[0].name.toLowerCase();
      
      // Step 2: Fetch that specific artist's top tracks
      const topTracks = await deezerJSONP(
        `https://api.deezer.com/artist/${artistId}/top?limit=25`
      );
      if (topTracks.data && topTracks.data.length > 0) {
        // Step 3: Filter to only include tracks where the primary artist matches
        return topTracks.data
          .filter(track => track.artist.name.toLowerCase() === artistName)
          .slice(0, 15)
          .map(track => ({
            title: track.title,
            artist: track.artist.name,
            album: track.album?.title || '',
            thumbnail: track.album?.cover_medium || '',
            videoId: null, // to be resolved on Piped when clicked
            duration: track.duration
          }));
      }
    }
  } catch (e) {
    console.error('Deezer artist tracks fetch failed:', e);
  }
  return [];
};

