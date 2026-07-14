// ================================================================
//  Melodia — Helper Utilities
// ================================================================

/**
 * Format seconds into m:ss display string
 */
export const formatTime = (s) => {
  if (!s || isNaN(s)) return '0:00';
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec < 10 ? '0' : ''}${sec}`;
};

/**
 * Parse LRC format text into structured lyric objects
 */
export const parseLRC = (lrcText) => {
  const lines = lrcText.split('\n');
  const result = [];
  for (const line of lines) {
    const match = line.match(/^\[(\d{2}):(\d{2}\.\d{2})\]\s?(.*)/);
    if (!match) continue;
    const time = parseInt(match[1]) * 60 + parseFloat(match[2]);
    const text = match[3].trim();
    result.push({
      time,
      text: text === '' ? '🎵' : text,
      type: text === '' ? 'instrumental' : 'lyric'
    });
  }
  return result;
};

/**
 * Extract YouTube video ID from a Piped URL
 */
export const extractVideoId = (url) => {
  if (!url) return null;
  const match = url.match(/[?&]v=([^&]+)/);
  return match ? match[1] : null;
};

/**
 * Sort playlist candidates, prioritizing lyric videos and deprioritizing live/covers
 */
export const prioritizeLyricVideos = (playlist) => {
  return [...playlist].sort((a, b) => {
    const keywords = ['lyrics', 'lirik', 'sub', 'subtitulos', 'karaoke', 'fan'];
    const aMatch = keywords.some(k => a.title.toLowerCase().includes(k));
    const bMatch = keywords.some(k => b.title.toLowerCase().includes(k));
    if (aMatch && !bMatch) return -1;
    if (!aMatch && bMatch) return 1;

    const liveKeywords = ['live', 'cover', 'interview', 'talk', 'session'];
    const aLive = liveKeywords.some(k => a.title.toLowerCase().includes(k));
    const bLive = liveKeywords.some(k => b.title.toLowerCase().includes(k));
    if (aLive && !bLive) return 1;
    if (!aLive && bLive) return -1;
    return 0;
  });
};
