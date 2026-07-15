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
