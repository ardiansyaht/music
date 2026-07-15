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
