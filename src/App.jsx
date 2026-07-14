import React, { useState, useEffect, useRef } from 'react';
import { LYRICS_DATA } from './lyrics';

const PIPED_INSTANCES = [
  'https://api.piped.private.coffee',
  'https://pipedapi.oxymoron.solutions',
  'https://pipedapi.kavin.rocks'
];

export default function App() {
  const [theme, setTheme] = useState(() => localStorage.getItem('lyricsync-theme') || 'pastel');
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [syncOffset, setSyncOffset] = useState(0.0);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);

  const [songInfo, setSongInfo] = useState({
    title: 'Lover Is a Day',
    artist: 'Cuco',
    album: 'Wannabewithu',
    thumbnail: '',
    videoId: 'OQdMfUjwmPs'
  });

  const [currentLyrics, setCurrentLyrics] = useState(LYRICS_DATA);
  const [currentLyricIndex, setCurrentLyricIndex] = useState(-1);
  const [volume, setVolume] = useState(75);
  const [isMuted, setIsMuted] = useState(false);

  const [currentPlaylist, setCurrentPlaylist] = useState([
    { videoId: 'OQdMfUjwmPs', title: '♡ lover is a day- cuco (lyrics) ♡', artist: 'songs4u' },
    { videoId: '9wiEM0s4aCQ', title: 'CUCO - Lover Is a Day (Audio)', artist: 'Cuco' },
    { videoId: 'i_PemxuNZJs', title: 'Cuco - Lover is a day / Lyrics English', artist: 'KirikoIsLove' },
    { videoId: 'G_ONO6DThBM', title: 'Cuco ~ Lover is a Day (lyrics)', artist: 'Cuco' }
  ]);
  const [currentPlaylistIndex, setCurrentPlaylistIndex] = useState(0);

  // Refs for animation loop & high frequency ticks
  const ytPlayerRef = useRef(null);
  const ytReadyRef = useRef(false);
  const isPlayingRef = useRef(false);
  const currentTimeRef = useRef(0);
  const syncOffsetRef = useRef(0.0);
  const currentLyricsRef = useRef(LYRICS_DATA);
  const currentLyricIndexRef = useRef(-1);
  const currentPlaylistRef = useRef([]);
  const currentPlaylistIndexRef = useRef(0);
  const targetVideoIdRef = useRef('OQdMfUjwmPs');
  const playOnReadyRef = useRef(false);

  const visCanvasRef = useRef(null);
  const lyricsScrollRef = useRef(null);
  const searchDebounceRef = useRef(null);

  // Visualizer bar heights & colors
  const simBarsRef = useRef(Array(56).fill(0));
  const visColor1Ref = useRef('#ff758f');
  const visColor2Ref = useRef('#ff9a76');

  // Keep refs in sync with state
  useEffect(() => { isPlayingRef.current = isPlaying; }, [isPlaying]);
  useEffect(() => { syncOffsetRef.current = syncOffset; }, [syncOffset]);
  useEffect(() => { currentLyricsRef.current = currentLyrics; }, [currentLyrics]);
  useEffect(() => { currentPlaylistRef.current = currentPlaylist; }, [currentPlaylist]);
  useEffect(() => { currentPlaylistIndexRef.current = currentPlaylistIndex; }, [currentPlaylistIndex]);

  // Sync theme
  useEffect(() => {
    document.body.setAttribute('data-theme', theme);
    localStorage.setItem('lyricsync-theme', theme);
    updateThemeColors();
    spawnParticles();
  }, [theme]);

  // Sync volume with YouTube
  useEffect(() => {
    if (ytReadyRef.current && ytPlayerRef.current) {
      if (isMuted) {
        ytPlayerRef.current.mute();
      } else {
        ytPlayerRef.current.unMute();
        ytPlayerRef.current.setVolume(volume);
      }
    }
  }, [volume, isMuted]);

  // Theme variable colors extraction
  const updateThemeColors = () => {
    setTimeout(() => {
      try {
        const style = getComputedStyle(document.documentElement);
        visColor1Ref.current = style.getPropertyValue('--vis-color-1').trim() || '#ff758f';
        visColor2Ref.current = style.getPropertyValue('--vis-color-2').trim() || '#ff9a76';
      } catch (e) {}
    }, 40);
  };

  // Particles
  const spawnParticles = () => {
    const container = document.getElementById('particlesContainer');
    if (!container) return;
    container.innerHTML = '';
    const count = 18;
    for (let i = 0; i < count; i++) {
      const el = document.createElement('div');
      el.className = 'particle';
      el.style.width = Math.random() * 6 + 2 + 'px';
      el.style.height = el.style.width;
      el.style.left = Math.random() * 100 + 'vw';
      el.style.top = Math.random() * 100 + 'vh';
      el.style.animationDuration = Math.random() * 12 + 8 + 's';
      el.style.animationDelay = Math.random() * -10 + 's';
      container.appendChild(el);
    }
  };

  // YouTube player creation
  const initYTPlayer = () => {
    if (ytPlayerRef.current) return;
    try {
      ytPlayerRef.current = new window.YT.Player('ytPlayer', {
        width: '200',
        height: '200',
        playerVars: {
          autoplay: 0,
          controls: 0,
          disablekb: 1,
          fs: 0,
          iv_load_policy: 3,
          modestbranding: 1,
          rel: 0,
        },
        events: {
          onReady: () => {
            ytReadyRef.current = true;
            ytPlayerRef.current.setVolume(volume);
            const vid = targetVideoIdRef.current;
            if (vid) {
              ytPlayerRef.current.cueVideoById(vid);
            }
            if (playOnReadyRef.current) {
              ytPlayerRef.current.playVideo();
              playOnReadyRef.current = false;
            }
          },
          onStateChange: (e) => {
            const state = e.data;
            if (state === 1) { // PLAYING
              setIsPlaying(true);
              const dur = ytPlayerRef.current.getDuration() || 0;
              setDuration(dur);
            } else if (state === 2 || state === 0) { // PAUSED or ENDED
              setIsPlaying(false);
              if (state === 0) {
                setCurrentLyricIndex(-1);
                currentLyricIndexRef.current = -1;
              }
            }
          },
          onError: (e) => {
            console.warn('YouTube Player Error:', e.data);
            if (e.data === 101 || e.data === 150) {
              // Self-healing fallback triggers
              const idx = currentPlaylistIndexRef.current;
              const playlist = currentPlaylistRef.current;
              if (idx < playlist.length - 1) {
                const nextIdx = idx + 1;
                setCurrentPlaylistIndex(nextIdx);
                const nextVideo = playlist[nextIdx];
                console.log(`Embedding blocked. Trying next candidate (${nextIdx + 1}/${playlist.length}): ${nextVideo.videoId}`);
                setTimeout(() => {
                  if (ytReadyRef.current && ytPlayerRef.current) {
                    ytPlayerRef.current.loadVideoById(nextVideo.videoId);
                  }
                }, 1500);
              }
            }
          }
        }
      });
    } catch (err) {
      console.error('Failed to initialize YT.Player:', err);
    }
  };

  // Load YouTube script on mount
  useEffect(() => {
    if (window.YT && window.YT.Player) {
      initYTPlayer();
    } else {
      let loaded = false;
      const scripts = document.getElementsByTagName('script');
      for (let i = 0; i < scripts.length; i++) {
        if (scripts[i].src === 'https://www.youtube.com/iframe_api') {
          loaded = true;
          break;
        }
      }
      if (!loaded) {
        const tag = document.createElement('script');
        tag.src = 'https://www.youtube.com/iframe_api';
        document.head.appendChild(tag);
      }
      window.onYouTubeIframeAPIReady = () => {
        initYTPlayer();
      };
    }

    // Auto-search default candidates on mount
    autoLoadDefaultPlaylist();

    // Setup window resize listener for Canvas
    window.addEventListener('resize', handleResize);
    handleResize();

    // Start Unified 60fps Animation Loop
    let animId;
    const tick = () => {
      tickLoop();
      animId = requestAnimationFrame(tick);
    };
    animId = requestAnimationFrame(tick);

    // Hide search results dropdown on outside clicks
    const handleOutsideClick = (e) => {
      if (!e.target.closest('.search-area')) {
        setShowSearchDropdown(false);
      }
    };
    document.addEventListener('click', handleOutsideClick);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
      document.removeEventListener('click', handleOutsideClick);
    };
  }, []);

  const handleResize = () => {
    const canvas = visCanvasRef.current;
    if (!canvas) return;
    const strip = canvas.parentElement;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = strip.clientWidth * dpr;
    canvas.height = strip.clientHeight * dpr;
    const ctx = canvas.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  };

  // Fallback default candidates loaders
  const autoLoadDefaultPlaylist = async () => {
    try {
      const art = await fetchDeezerArt('Cuco', 'Lover Is a Day');
      if (art) {
        setSongInfo(s => ({ ...s, thumbnail: art }));
      }
    } catch (e) {}

    searchPiped('Cuco Lover Is a Day').then(results => {
      if (results.length > 0) {
        const candidates = results.map(r => ({
          videoId: extractVideoId(r.url),
          title: r.title,
          artist: r.uploaderName
        })).filter(r => r.videoId);

        const sorted = prioritizeLyricVideos(candidates);
        setCurrentPlaylist(sorted);
        if (sorted.length > 0) {
          setCurrentPlaylistIndex(0);

          let isCurrentActive = false;
          if (ytReadyRef.current && ytPlayerRef.current) {
            try {
              const state = ytPlayerRef.current.getPlayerState();
              if (state === 1 || state === 3 || playOnReadyRef.current) {
                isCurrentActive = true;
              }
            } catch (e) {}
          }

          if (!isCurrentActive) {
            targetVideoIdRef.current = sorted[0].videoId;
            setSongInfo(s => ({ ...s, videoId: sorted[0].videoId }));
            if (ytReadyRef.current && ytPlayerRef.current) {
              try {
                ytPlayerRef.current.cueVideoById(sorted[0].videoId);
              } catch (e) {}
            }
          }
        }
      }
    }).catch(() => {});
  };

  // Unified Render Tick Loop (60fps)
  const tickLoop = () => {
    // 1. Progress Timing Updates
    if (ytReadyRef.current && ytPlayerRef.current) {
      try {
        const playerState = ytPlayerRef.current.getPlayerState();
        if (playerState === 1) { // playing
          const curr = ytPlayerRef.current.getCurrentTime() || 0;
          currentTimeRef.current = curr;
          setCurrentTime(curr);
          
          // Sync active lyric line
          syncLyrics(curr);
        }
      } catch (e) {}
    }

    // 2. Draw Visualizer Canvas
    const canvas = visCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    const w = canvas.width / dpr;
    const h = canvas.height / dpr;
    ctx.clearRect(0, 0, w, h);

    const barCount = 56;
    const barW = w / barCount - 1.5;

    // Modulate visualizer height physics based on playing state
    for (let i = 0; i < barCount; i++) {
      if (isPlayingRef.current) {
        const timeSec = Date.now() * 0.0012;
        const wave = Math.sin(timeSec * 5 + i * 0.12) * 0.18 + 0.45;
        const randomNoise = Math.random() * 0.22;
        const target = wave + randomNoise;
        // Ease towards target
        simBarsRef.current[i] += (target - simBarsRef.current[i]) * 0.16;
      } else {
        // Fall slowly to zero
        simBarsRef.current[i] *= 0.88;
      }

      const barH = simBarsRef.current[i] * (h * 0.85);

      // Create gradient colors matching theme
      const grad = ctx.createLinearGradient(0, h - barH, 0, h);
      grad.addColorStop(0, visColor1Ref.current);
      grad.addColorStop(1, visColor2Ref.current);

      ctx.fillStyle = grad;
      ctx.fillRect(i * (barW + 1.5), h - barH, barW, barH);
    }
  };

  // Synchronize lyric highlight position
  const syncLyrics = (timeVal) => {
    const lyrics = currentLyricsRef.current;
    if (lyrics.length === 0) return;
    
    const adj = timeVal + syncOffsetRef.current;
    let idx = -1;
    for (let i = 0; i < lyrics.length; i++) {
      if (lyrics[i].time >= 0 && adj >= lyrics[i].time) {
        idx = i;
      } else if (lyrics[i].time >= 0 && adj < lyrics[i].time) {
        break;
      }
    }

    if (idx !== currentLyricIndexRef.current) {
      currentLyricIndexRef.current = idx;
      setCurrentLyricIndex(idx);

      // Smooth scroll the center active lyric line into view
      if (lyricsScrollRef.current && idx !== -1) {
        const lines = lyricsScrollRef.current.querySelectorAll('.lyric-line');
        const activeEl = lines[idx];
        if (activeEl) {
          const container = lyricsScrollRef.current;
          container.scrollTop = activeEl.offsetTop - container.clientHeight / 2 + activeEl.clientHeight / 2;
        }
      }
    }
  };

  // Playback Control Actions
  const handlePlayToggle = () => {
    if (!ytReadyRef.current || !ytPlayerRef.current) {
      playOnReadyRef.current = !playOnReadyRef.current;
      setIsPlaying(playOnReadyRef.current);
      return;
    }
    try {
      const state = ytPlayerRef.current.getPlayerState();
      if (state === 1) {
        ytPlayerRef.current.pauseVideo();
      } else if (state === 5 || state === -1) {
        const vid = targetVideoIdRef.current || 'OQdMfUjwmPs';
        ytPlayerRef.current.loadVideoById(vid);
      } else {
        ytPlayerRef.current.playVideo();
      }
    } catch (e) {
      console.warn('Failed to read player state, force playing video:', e);
      try {
        const vid = targetVideoIdRef.current || 'OQdMfUjwmPs';
        ytPlayerRef.current.loadVideoById(vid);
      } catch (err) {}
    }
  };

  const handleSeek = (e) => {
    if (!ytReadyRef.current || !ytPlayerRef.current) return;
    const trackRect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - trackRect.left;
    const pct = clickX / trackRect.width;
    const target = pct * duration;
    ytPlayerRef.current.seekTo(target, true);
    setCurrentTime(target);
    currentTimeRef.current = target;
  };

  const handleRewind = () => {
    if (!ytReadyRef.current || !ytPlayerRef.current) return;
    const target = Math.max(0, ytPlayerRef.current.getCurrentTime() - 10);
    ytPlayerRef.current.seekTo(target, true);
  };

  const handleForward = () => {
    if (!ytReadyRef.current || !ytPlayerRef.current) return;
    const target = Math.min(duration, ytPlayerRef.current.getCurrentTime() + 10);
    ytPlayerRef.current.seekTo(target, true);
  };

  // Sync Offset Actions
  const handleSyncAdjust = (amt) => {
    setSyncOffset(s => +(s + amt).toFixed(1));
  };

  // Track Select Action
  const selectTrack = async (item) => {
    try {
      setShowSearchDropdown(false);
      setSearchQuery('');

      if (ytPlayerRef.current && ytReadyRef.current) {
        try { ytPlayerRef.current.stopVideo(); } catch (e) {}
      }
      setIsPlaying(false);

      setSongInfo({
        title: item.title,
        artist: item.artist,
        album: '',
        thumbnail: item.thumbnail,
        videoId: item.videoId
      });

      // Update Art Placeholder states
      const artUrl = item.thumbnail || '';
      
      // Background Deezer fetch
      fetchDeezerArt(item.artist, item.title).then(url => {
        if (url) {
          setSongInfo(s => ({ ...s, thumbnail: url }));
        }
      });

      // Lyrics sync loading
      if (item.lrcData && item.lrcData.syncedLyrics) {
        const parsed = parseLRC(item.lrcData.syncedLyrics);
        setCurrentLyrics(parsed);
        setCurrentLyricIndex(-1);
        currentLyricIndexRef.current = -1;
      } else {
        setCurrentLyrics([]);
        setCurrentLyricIndex(-1);
        currentLyricIndexRef.current = -1;

        const lrcResults = await searchLRCLIB(`${item.artist} ${item.title}`);
        const syncedMatch = lrcResults.find(r => r.syncedLyrics);
        if (syncedMatch) {
          setCurrentLyrics(parseLRC(syncedMatch.syncedLyrics));
        } else {
          const plainMatch = lrcResults.find(r => r.plainLyrics);
          if (plainMatch) {
            const parsedPlain = plainMatch.plainLyrics.split('\n').map(line => ({
              time: -1,
              text: line,
              type: line.trim() === '' ? 'empty' : 'lyric'
            }));
            setCurrentLyrics(parsedPlain);
          } else {
            setCurrentLyrics([]);
          }
        }
      }

      // Audio video streaming selection
      if (item.videoId) {
        setCurrentPlaylist([{ videoId: item.videoId, title: item.title, artist: item.artist }]);
        setCurrentPlaylistIndex(0);
        playYouTubeVideo(item.videoId);

        // Background query for candidates
        searchPiped(`${item.artist} ${item.title} lyrics`).then(results => {
          const candidates = results.map(r => ({
            videoId: extractVideoId(r.url),
            title: r.title,
            artist: r.uploaderName
          })).filter(r => r.videoId && r.videoId !== item.videoId);
          setCurrentPlaylist(prev => prev.concat(prioritizeLyricVideos(candidates)));
        }).catch(() => {});
      } else {
        console.log('No videoId, searching Piped...');
        searchPiped(`${item.artist} ${item.title} lyrics`).then(results => {
          if (results.length > 0) {
            const candidates = results.map(r => ({
              videoId: extractVideoId(r.url),
              title: r.title,
              artist: r.uploaderName
            })).filter(r => r.videoId);

            const sorted = prioritizeLyricVideos(candidates);
            setCurrentPlaylist(sorted);
            setCurrentPlaylistIndex(0);
            if (sorted.length > 0) {
              playYouTubeVideo(sorted[0].videoId);
            }
          }
        }).catch(() => {});
      }
    } catch (err) {
      console.error('Runtime error in selectTrack:', err);
    }
  };

  const playYouTubeVideo = (vid) => {
    targetVideoIdRef.current = vid;
    setSongInfo(s => ({ ...s, videoId: vid }));
    if (ytReadyRef.current && ytPlayerRef.current) {
      ytPlayerRef.current.loadVideoById(vid);
    } else {
      playOnReadyRef.current = true;
    }
  };

  // Search Engine logic
  const handleSearchInput = (e) => {
    const q = e.target.value;
    setSearchQuery(q);
    
    clearTimeout(searchDebounceRef.current);
    if (q.trim().length < 2) {
      setShowSearchDropdown(false);
      return;
    }

    setShowSearchDropdown(true);
    setIsSearching(true);

    searchDebounceRef.current = setTimeout(() => {
      runSearch(q.trim());
    }, 450);
  };

  const runSearch = async (query) => {
    try {
      const [pipedResults, lrclibResults] = await Promise.all([
        searchPiped(query),
        searchLRCLIB(query)
      ]);

      const lrcMap = new Map();
      for (const item of lrclibResults) {
        if (item.syncedLyrics) {
          const key = `${item.trackName}|${item.artistName}`.toLowerCase();
          if (!lrcMap.has(key)) lrcMap.set(key, item);
        }
      }

      const combined = [];
      const seen = new Set();

      // YouTube Piped items
      for (const item of pipedResults) {
        if (!item.url) continue;
        const vid = extractVideoId(item.url);
        if (!vid) continue;

        const title = item.title || '';
        const uploader = item.uploaderName || '';
        const key = `${title}|${uploader}`.toLowerCase();
        if (seen.has(key)) continue;
        seen.add(key);

        let lrcMatch = null;
        for (const [lrcKey, lrcItem] of lrcMap) {
          const trackLower = lrcItem.trackName.toLowerCase();
          const artistLower = lrcItem.artistName.toLowerCase();
          const titleLower = title.toLowerCase();
          const uploaderLower = uploader.toLowerCase();

          const trackMatches = titleLower.includes(trackLower) ||
                               trackLower.includes(titleLower.replace(/\(.*?\)/g, '').trim());

          const artistMatches = uploaderLower.includes(artistLower) ||
                                artistLower.includes(uploaderLower) ||
                                titleLower.includes(artistLower);

          if (trackMatches && artistMatches) {
            lrcMatch = lrcItem;
            break;
          }
        }

        combined.push({
          title,
          artist: uploader,
          videoId: vid,
          thumbnail: item.thumbnail || '',
          duration: item.duration || 0,
          hasSynced: !!lrcMatch,
          lrcData: lrcMatch
        });

        if (combined.length >= 10) break;
      }

      // Add LRCLIB-only results
      for (const [key, item] of lrcMap) {
        const dupKey = `${item.trackName}|${item.artistName}`.toLowerCase();
        if (seen.has(dupKey)) continue;
        seen.add(dupKey);

        combined.push({
          title: item.trackName,
          artist: item.artistName,
          videoId: null,
          thumbnail: '',
          duration: item.duration || 0,
          hasSynced: true,
          lrcData: item,
          lrcOnly: true
        });

        if (combined.length >= 15) break;
      }

      setSearchResults(combined);
      setIsSearching(false);
    } catch (e) {
      setIsSearching(false);
    }
  };

  // Helper parsers
  const parseLRC = (lrcText) => {
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

  const searchLRCLIB = async (q) => {
    try {
      const res = await fetch(`https://lrclib.net/api/search?q=${encodeURIComponent(q)}`);
      if (!res.ok) return [];
      return await res.json();
    } catch (e) {
      return [];
    }
  };

  const searchPiped = async (q) => {
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

  const fetchDeezerArt = async (artist, title) => {
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

  const extractVideoId = (url) => {
    if (!url) return null;
    const match = url.match(/[?&]v=([^&]+)/);
    return match ? match[1] : null;
  };

  const prioritizeLyricVideos = (playlist) => {
    return playlist.sort((a, b) => {
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

  // Formatter utilities
  const formatTime = (s) => {
    if (!s || isNaN(s)) return '0:00';
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec < 10 ? '0' : ''}${sec}`;
  };

  const handleLyricsLineClick = (line) => {
    if (!ytReadyRef.current || !ytPlayerRef.current) return;
    try {
      const state = ytPlayerRef.current.getPlayerState();
      const targetTime = Math.max(0, line.time - syncOffsetRef.current);
      if (state === 5 || state === -1) {
        const vid = targetVideoIdRef.current || 'OQdMfUjwmPs';
        ytPlayerRef.current.loadVideoById(vid, targetTime);
      } else {
        ytPlayerRef.current.seekTo(targetTime, true);
        ytPlayerRef.current.playVideo();
      }
    } catch (e) {
      console.warn('Failed to seek/play from lyric line click:', e);
      try {
        ytPlayerRef.current.seekTo(Math.max(0, line.time - syncOffsetRef.current), true);
        ytPlayerRef.current.playVideo();
      } catch (err) {}
    }
  };

  return (
    <div className="app-shell">
      {/* Background layers */}
      <div className="bg-gradient-layer"></div>
      <div id="particlesContainer" className="bg-particles"></div>
      <div className="bg-scanlines"></div>

      {/* Hidden YouTube Player wrapper */}
      <div id="ytPlayerWrapper" style={{
        position: 'fixed',
        bottom: '10px',
        right: '10px',
        width: '200px',
        height: '200px',
        overflow: 'hidden',
        pointerEvents: 'none',
        opacity: 0.001,
        zIndex: -999
      }}>
        <div id="ytPlayer"></div>
      </div>

      {/* Top Bar */}
      <header className="top-bar">
        <div className="top-bar-left">
          <span className="brand-logo">♪</span>
          <span className="brand-name">LyricSync</span>
        </div>

        <div className="search-area">
          <div className="search-box">
            <span className="search-icon">🔍</span>
            <input
              type="text"
              placeholder="Cari lagu, artis, album..."
              value={searchQuery}
              onChange={handleSearchInput}
              autoComplete="off"
              spellCheck="false"
            />
            {searchQuery && (
              <button
                className="search-clear"
                onClick={() => { setSearchQuery(''); setShowSearchDropdown(false); }}
                title="Hapus"
              >
                ✕
              </button>
            )}
          </div>

          {showSearchDropdown && (
            <div className="search-results visible">
              {isSearching ? (
                <div className="sr-loading">Mencari</div>
              ) : searchResults.length === 0 ? (
                <div className="sr-empty">Tidak ada hasil untuk "{searchQuery}"</div>
              ) : (
                searchResults.map((item, idx) => (
                  <div className="sr-item" key={idx} onClick={() => selectTrack(item)}>
                    {item.thumbnail ? (
                      <img className="sr-item-art" src={item.thumbnail} alt={item.title} />
                    ) : (
                      <div className="sr-item-art-placeholder">♪</div>
                    )}
                    <div className="sr-item-info">
                      <div className="sr-item-title">{item.title}</div>
                      <div className="sr-item-meta">{item.artist}</div>
                    </div>
                    <div className="sr-item-badges">
                      {item.hasSynced && <span className="sr-badge synced">SYNCED</span>}
                      {item.videoId && <span className="sr-badge full">FULL SONG</span>}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        <div className="top-bar-right">
          <div className="theme-switcher">
            <button
              className={`theme-btn ${theme === 'pastel' ? 'active' : ''}`}
              onClick={() => setTheme('pastel')}
              title="Pastel Dream"
            >
              🌸
            </button>
            <button
              className={`theme-btn ${theme === 'vhs' ? 'active' : ''}`}
              onClick={() => setTheme('vhs')}
              title="Retro VHS"
            >
              📼
            </button>
            <button
              className={`theme-btn ${theme === 'space' ? 'active' : ''}`}
              onClick={() => setTheme('space')}
              title="Dark Space"
            >
              🌌
            </button>
            <button
              className={`theme-btn ${theme === 'cyber' ? 'active' : ''}`}
              onClick={() => setTheme('cyber')}
              title="Cyberpunk"
            >
              ⚡
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="main-content">
        {/* Now Playing info */}
        <section className="now-playing">
          <div className="np-art-wrapper">
            <img
              className={`np-album-art ${songInfo.thumbnail ? 'visible' : ''} ${isPlaying ? 'playing' : ''}`}
              src={songInfo.thumbnail}
              alt="Album Art"
            />
            {!songInfo.thumbnail && <div className="np-art-placeholder">♪</div>}
            <div className="np-art-glow"></div>
          </div>

          <div className="np-info">
            <div className="np-title-row">
              <h1 className="np-song-title">{songInfo.title}</h1>
              {songInfo.videoId && <span className="np-badge np-badge-full">FULL SONG</span>}
            </div>
            <p className="np-artist">{songInfo.artist}</p>
            {songInfo.album && <p className="np-album">{songInfo.album}</p>}
          </div>
        </section>

        {/* Visualizer strip */}
        <div className="visualizer-strip">
          <canvas ref={visCanvasRef}></canvas>
        </div>

        {/* Synced Lyrics panel */}
        <section className="lyrics-panel">
          {currentLyrics.length === 0 && (
            <div className="lyrics-status">
              <span className="status-icon">🎵</span>
              <span className="status-text">Cari lagu di kolom pencarian untuk melihat lirik & memutar audio</span>
            </div>
          )}
          <div className="lyrics-scroll" ref={lyricsScrollRef}>
            {currentLyrics.map((line, idx) => (
              <div
                key={idx}
                className={`lyric-line ${idx === currentLyricIndex ? 'active' : ''} ${line.type === 'instrumental' ? 'instrumental' : ''}`}
                onClick={line.time >= 0 ? () => handleLyricsLineClick(line) : null}
              >
                {line.text}
              </div>
            ))}
          </div>
        </section>
      </main>

      {/* Player deck bar */}
      <footer className="player-bar">
        <div className="pb-progress">
          <span className="pb-time">{formatTime(currentTime)}</span>
          <div className="pb-track" onClick={handleSeek}>
            <div className="pb-fill" style={{ width: `${duration ? (currentTime / duration) * 100 : 0}%` }}></div>
            <div className="pb-thumb" style={{ left: `${duration ? (currentTime / duration) * 100 : 0}%` }}></div>
          </div>
          <span className="pb-time">{formatTime(duration)}</span>
        </div>

        <div className="pb-controls">
          <div className="pb-left">
            <div className="sync-adjust">
              <span className="sync-lbl">Sync</span>
              <button className="sync-btn" id="syncMinus" onClick={() => handleSyncAdjust(-0.1)}>−</button>
              <span className="sync-val" id="syncValue">{syncOffset >= 0 ? '+' : ''}{syncOffset.toFixed(1)}s</span>
              <button className="sync-btn" id="syncPlus" onClick={() => handleSyncAdjust(0.1)}>+</button>
            </div>
          </div>

          <div className="pb-center">
            <button className="ctrl-btn" id="btnRewind" onClick={handleRewind} title="Mundur 10s">⏪</button>
            <button className="ctrl-btn ctrl-play" id="btnPlay" onClick={handlePlayToggle} title={isPlaying ? "Jeda" : "Putar"}>
              <span>{isPlaying ? '⏸' : '▶'}</span>
            </button>
            <button className="ctrl-btn" id="btnForward" onClick={handleForward} title="Maju 10s">⏩</button>
          </div>

          <div className="pb-right">
            <span className="vol-icon" id="volIcon" onClick={() => setIsMuted(!isMuted)}>
              {isMuted ? '🔇' : volume === 0 ? '🔇' : volume < 40 ? '🔈' : volume < 70 ? '🔉' : '🔊'}
            </span>
            <input
              type="range"
              id="volSlider"
              min="0"
              max="100"
              value={volume}
              onChange={(e) => { setVolume(parseInt(e.target.value)); setIsMuted(false); }}
              className="vol-slider"
            />
          </div>
        </div>
      </footer>
    </div>
  );
}
