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
 * Fetch top tracks by an artist via Deezer JSONP for same-artist recommendations
 */
export const fetchArtistTracks = async (artist) => {
  try {
    const searchName = artist.toLowerCase().trim();
    // Step 1: Search tracks instead of artists to find the most popular artist matching this name
    const trackSearch = await deezerJSONP(
      `https://api.deezer.com/search?q=${encodeURIComponent(artist)}&limit=5`
    );
    let artistId = null;
    let artistName = searchName;

    if (trackSearch.data && trackSearch.data.length > 0) {
      const matchedTrack = trackSearch.data.find(
        t => t.artist.name.toLowerCase() === searchName
      ) || trackSearch.data[0];

      artistId = matchedTrack.artist.id;
      artistName = matchedTrack.artist.name.toLowerCase();
    }

    // Fallback to artist search if no tracks found
    if (!artistId) {
      const artistSearch = await deezerJSONP(
        `https://api.deezer.com/search/artist?q=${encodeURIComponent(artist)}&limit=3`
      );
      if (artistSearch.data && artistSearch.data.length > 0) {
        const matches = artistSearch.data.filter(a => a.name.toLowerCase() === searchName);
        let matchedArtist;
        if (matches.length > 0) {
          matches.sort((a, b) => (b.nb_fan || 0) - (a.nb_fan || 0));
          matchedArtist = matches[0];
        } else {
          const sortedAll = [...artistSearch.data].sort((a, b) => (b.nb_fan || 0) - (a.nb_fan || 0));
          matchedArtist = sortedAll[0];
        }
        artistId = matchedArtist.id;
        artistName = matchedArtist.name.toLowerCase();
      }
    }

    if (artistId) {
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

/**
 * Fetch albums by an artist via Deezer JSONP
 */
export const fetchArtistAlbums = async (artist) => {
  try {
    const cleaned = artist
      .replace(/\s*-\s*Topic$/i, '')
      .replace(/VEVO$/i, '')
      .replace(/\s*Official\s*$/i, '')
      .replace(/\s*Music\s*$/i, '')
      .replace(/\s*Channel\s*$/i, '')
      .replace(/\s*Records\s*$/i, '')
      .trim();
    const searchName = cleaned.toLowerCase();
    // Step 1: Search artist to find artist ID
    const artistSearch = await deezerJSONP(
      `https://api.deezer.com/search/artist?q=${encodeURIComponent(cleaned)}&limit=3`
    );
    let artistId = null;
    let artistName = searchName;

    if (artistSearch.data && artistSearch.data.length > 0) {
      const matches = artistSearch.data.filter(a => a.name.toLowerCase() === searchName);
      let matchedArtist;
      if (matches.length > 0) {
        matches.sort((a, b) => (b.nb_fan || 0) - (a.nb_fan || 0));
        matchedArtist = matches[0];
      } else {
        const sortedAll = [...artistSearch.data].sort((a, b) => (b.nb_fan || 0) - (a.nb_fan || 0));
        matchedArtist = sortedAll[0];
      }
      artistId = matchedArtist.id;
      artistName = matchedArtist.name.toLowerCase();
    }

    if (artistId) {
      // Step 2: Fetch that specific artist's albums
      const albumsData = await deezerJSONP(
        `https://api.deezer.com/artist/${artistId}/albums?limit=25`
      );
      if (albumsData.data && albumsData.data.length > 0) {
        return albumsData.data.map(album => ({
          id: album.id,
          title: album.title,
          cover: album.cover_medium || '',
          releaseDate: album.release_date || '',
          genreId: album.genre_id
        }));
      }
    }
  } catch (e) {
    console.error('Deezer artist albums fetch failed:', e);
  }
  return [];
};

/**
 * Fetch tracks inside an album via Deezer JSONP
 */
export const fetchAlbumTracks = async (albumId) => {
  try {
    const data = await deezerJSONP(
      `https://api.deezer.com/album/${albumId}/tracks?limit=50`
    );
    if (data.data && data.data.length > 0) {
      return data.data.map(track => ({
        id: track.id,
        title: track.title,
        duration: track.duration,
        trackPosition: track.track_position
      }));
    }
  } catch (e) {
    console.error('Deezer album tracks fetch failed:', e);
  }
  return [];
};
