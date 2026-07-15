import { PIPED_INSTANCES } from '../../constants';

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
 * Fetch tracks from a YouTube playlist via Piped instances
 */
export const fetchPipedPlaylist = async (playlistId) => {
  for (const instance of PIPED_INSTANCES) {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 8000);
      const res = await fetch(`${instance}/playlists/${playlistId}`, {
        signal: controller.signal,
      });
      clearTimeout(timer);
      if (!res.ok) continue;
      const data = await res.json();
      
      if (data.relatedStreams) {
        return data.relatedStreams.map(item => {
          let videoId = '';
          if (item.url) {
            const match = item.url.match(/[?&]v=([^&]+)/);
            videoId = match ? match[1] : (item.url.split('v=')[1] || '');
          }
          return {
            title: item.title,
            artist: item.uploaderName || '',
            album: '',
            thumbnail: item.thumbnail || '',
            videoId: videoId,
            duration: item.duration || 0
          };
        }).filter(item => item.videoId);
      }
    } catch (err) {
      console.warn(`Piped instance ${instance} failed playlist fetch:`, err);
    }
  }
  throw new Error('Gagal memuat playlist dari semua server Piped.');
};
