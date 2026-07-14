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

export const prioritizeLyricVideos = (playlist, artistName = '', songTitle = '') => {
  const cleanArtist = artistName ? cleanArtistName(artistName).toLowerCase() : '';
  const cleanSong = songTitle ? songTitle.toLowerCase().trim() : '';

  const getScore = (item) => {
    const title = item.title.toLowerCase();
    const cleanUploader = item.artist ? cleanArtistName(item.artist).toLowerCase() : '';
    let score = 0;

    // 1. MUST contain the song title (or parts of it)
    if (cleanSong) {
      if (title.includes(cleanSong)) {
        score += 100;
      } else {
        // Try split words for multi-word titles (e.g. "Bohemian Rhapsody")
        const words = cleanSong.split(/\s+/).filter(w => w.length > 2);
        const matchCount = words.filter(word => title.includes(word)).length;
        if (matchCount > 0) {
          score += matchCount * 25;
        } else {
          score -= 150; // Heavy penalty if none of the words match!
        }
      }
    }

    // 2. Prioritize matching uploader/artist
    if (cleanArtist) {
      if (cleanUploader && (cleanUploader.includes(cleanArtist) || cleanArtist.includes(cleanUploader))) {
        score += 50;
      }
      if (title.includes(cleanArtist)) {
        score += 20;
      }
    }

    // 3. Prioritize official releases
    if (title.includes('official audio') || title.includes('official lyric') || title.includes('official video') || title.includes('official music video')) {
      score += 25;
    }

    // 4. Prioritize lyrics videos
    if (title.includes('lyrics') || title.includes('lirik') || title.includes('sub') || title.includes('subtitle') || title.includes('translation')) {
      score += 15;
    }

    // HEAVILY DEPRIORITIZE karaoke, instrumental, backing tracks, covers, tributes
    if (title.includes('karaoke') || title.includes('instrumental') || title.includes('backing track') || title.includes('cover') || title.includes('tribute') || title.includes('piano') || title.includes('guitar') || title.includes('acoustic cover') || title.includes('instrumental version')) {
      score -= 200;
    }

    // Deprioritize live concert / interviews
    if (title.includes('live') || title.includes('concert') || title.includes('interview') || title.includes('talk') || title.includes('session')) {
      score -= 30;
    }

    return score;
  };

  return [...playlist].sort((a, b) => getScore(b) - getScore(a));
};

/**
 * Clean common YouTube uploader suffixes to get the clean artist name
 */
export const cleanArtistName = (name) => {
  if (!name) return '';
  let clean = name.replace(/\s*-\s*Topic$/i, '');
  clean = clean.replace(/VEVO$/i, '');
  clean = clean.replace(/\s*Official\s*$/i, '');
  clean = clean.replace(/\s*Music\s*$/i, '');
  clean = clean.replace(/\s*Channel\s*$/i, '');
  clean = clean.replace(/\s*Records\s*$/i, '');
  return clean.trim();
};
