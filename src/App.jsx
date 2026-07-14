// ================================================================
//  Melodia — Main App Shell
//  Manages global state, routing, and orchestrates all components.
// ================================================================
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { LYRICS_DATA } from './lyrics';
import { useYouTubePlayer } from './hooks/useYouTubePlayer';
import { searchPiped, searchLRCLIB, fetchDeezerArt, fetchArtistTracks } from './utils/api';
import { parseLRC, extractVideoId, prioritizeLyricVideos, cleanArtistName } from './utils/helpers';

import TopBar from './components/TopBar';
import HomePage from './components/HomePage';
import NowPlaying from './components/NowPlaying';
import Visualizer from './components/Visualizer';
import LyricsPanel from './components/LyricsPanel';
import PlayerBar from './components/PlayerBar';
import FullscreenLyrics from './components/FullscreenLyrics';
import RecommendedPanel from './components/RecommendedPanel';
import Toast from './components/Toast';

export default function App() {
  // ── Theme ──
  const [theme, setTheme] = useState(() => localStorage.getItem('melodia-theme') || 'pastel');

  // ── Views ──
  const [currentView, setCurrentView] = useState(() => localStorage.getItem('melodia-view') || 'home'); // 'home' | 'player'
  const [isFullscreenLyric, setIsFullscreenLyric] = useState(false);

  // ── Playback State ──
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [syncOffset, setSyncOffset] = useState(() => {
    const val = localStorage.getItem('melodia-sync-offset');
    return val ? parseFloat(val) : 0.0;
  });
  const [volume, setVolume] = useState(75);
  const [isMuted, setIsMuted] = useState(false);

  // ── Song Info ──
  const [songInfo, setSongInfo] = useState(() => {
    try {
      const val = localStorage.getItem('melodia-song-info');
      return val ? JSON.parse(val) : { title: '', artist: '', album: '', thumbnail: '', videoId: '' };
    } catch (e) {
      return { title: '', artist: '', album: '', thumbnail: '', videoId: '' };
    }
  });

  // ── Lyrics ──
  const [currentLyrics, setCurrentLyrics] = useState(() => {
    try {
      const val = localStorage.getItem('melodia-lyrics');
      return val ? JSON.parse(val) : LYRICS_DATA;
    } catch (e) {
      return LYRICS_DATA;
    }
  });
  const [currentLyricIndex, setCurrentLyricIndex] = useState(-1);

  // ── Search ──
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);

  // ── Playlist / Queue / History ──
  const [currentPlaylist, setCurrentPlaylist] = useState(() => {
    try {
      const val = localStorage.getItem('melodia-playlist');
      return val ? JSON.parse(val) : [];
    } catch (e) {
      return [];
    }
  });
  const [currentPlaylistIndex, setCurrentPlaylistIndex] = useState(0);
  const [songHistory, setSongHistory] = useState(() => {
    try {
      const val = localStorage.getItem('melodia-history');
      return val ? JSON.parse(val) : [];
    } catch (e) {
      return [];
    }
  }); // previously played songs
  const [songQueue, setSongQueue] = useState(() => {
    try {
      const val = localStorage.getItem('melodia-queue');
      return val ? JSON.parse(val) : [];
    } catch (e) {
      return [];
    }
  });     // upcoming songs

  // ── Recommendations ──
  const [recommendations, setRecommendations] = useState(() => {
    try {
      const val = localStorage.getItem('melodia-recommendations');
      return val ? JSON.parse(val) : [];
    } catch (e) {
      return [];
    }
  });
  const [isLoadingRecs, setIsLoadingRecs] = useState(false);
  const [isLoadingTrack, setIsLoadingTrack] = useState(false);
  const [isBarHidden, setIsBarHidden] = useState(false);

  // ── Toast Notification State ──
  const [toastMsg, setToastMsg] = useState('');
  const [toastIcon, setToastIcon] = useState('');
  const [toastVisible, setToastVisible] = useState(false);
  const toastTimerRef = useRef(null);

  const showToast = (msg, icon = '') => {
    clearTimeout(toastTimerRef.current);
    setToastMsg(msg);
    setToastIcon(icon);
    setToastVisible(true);
    toastTimerRef.current = setTimeout(() => {
      setToastVisible(false);
    }, 1500);
  };

  // ── Refs ──
  const isPlayingRef = useRef(false);
  const syncOffsetRef = useRef(0.0);
  const currentLyricsRef = useRef(LYRICS_DATA);
  const currentLyricIndexRef = useRef(-1);
  const currentPlaylistRef = useRef([]);
  const currentPlaylistIndexRef = useRef(0);
  const lyricsScrollRef = useRef(null);
  const fsLyricsScrollRef = useRef(null);
  const searchDebounceRef = useRef(null);
  const currentTimeRef = useRef(0);

  // ── Keep refs in sync ──
  useEffect(() => { isPlayingRef.current = isPlaying; }, [isPlaying]);
  useEffect(() => { syncOffsetRef.current = syncOffset; }, [syncOffset]);
  useEffect(() => { currentLyricsRef.current = currentLyrics; }, [currentLyrics]);
  useEffect(() => { currentPlaylistRef.current = currentPlaylist; }, [currentPlaylist]);
  useEffect(() => { currentPlaylistIndexRef.current = currentPlaylistIndex; }, [currentPlaylistIndex]);

  // ── YouTube Player Hook ──
  const yt = useYouTubePlayer({
    volume,
    isMuted,
    onStateChange: (e) => {
      const state = e.data;
      if (state === 1) { // PLAYING
        setIsPlaying(true);
        setIsLoadingTrack(false);
        setDuration(yt.getDuration());
      } else if (state === 2) { // PAUSED
        setIsPlaying(false);
      } else if (state === 0) { // ENDED
        setIsPlaying(false);
        setIsLoadingTrack(false);
        setCurrentLyricIndex(-1);
        currentLyricIndexRef.current = -1;
        handleSongEnded();
      }
    },
    onError: (e) => {
      console.warn('YouTube Player Error:', e.data);
      if (e.data === 101 || e.data === 150) {
        const idx = currentPlaylistIndexRef.current;
        const playlist = currentPlaylistRef.current;
        if (idx < playlist.length - 1) {
          const nextIdx = idx + 1;
          setCurrentPlaylistIndex(nextIdx);
          const nextVideo = playlist[nextIdx];
          setTimeout(() => yt.playVideo(nextVideo.videoId), 1500);
        }
      }
    }
  });

  // ── Theme sync ──
  useEffect(() => {
    document.body.setAttribute('data-theme', theme);
    localStorage.setItem('melodia-theme', theme);
    spawnParticles();
  }, [theme]);

  // ── Load video on mount if state is restored ──
  useEffect(() => {
    if (currentView === 'player' && songInfo.videoId) {
      yt.playVideo(songInfo.videoId);
    }
  }, []);

  // ── State Persistence ──
  useEffect(() => {
    localStorage.setItem('melodia-view', currentView);
  }, [currentView]);

  useEffect(() => {
    localStorage.setItem('melodia-song-info', JSON.stringify(songInfo));
  }, [songInfo]);

  useEffect(() => {
    localStorage.setItem('melodia-lyrics', JSON.stringify(currentLyrics));
  }, [currentLyrics]);

  useEffect(() => {
    localStorage.setItem('melodia-queue', JSON.stringify(songQueue));
  }, [songQueue]);

  useEffect(() => {
    localStorage.setItem('melodia-history', JSON.stringify(songHistory));
  }, [songHistory]);

  useEffect(() => {
    localStorage.setItem('melodia-playlist', JSON.stringify(currentPlaylist));
  }, [currentPlaylist]);

  useEffect(() => {
    localStorage.setItem('melodia-sync-offset', syncOffset.toString());
  }, [syncOffset]);

  useEffect(() => {
    localStorage.setItem('melodia-recommendations', JSON.stringify(recommendations));
  }, [recommendations]);

  // ── Keyboard Shortcuts & ESC Handler ──
  useEffect(() => {
    const handleKeyDown = (e) => {
      // 1. ESC to close fullscreen
      if (e.key === 'Escape' && isFullscreenLyric) {
        setIsFullscreenLyric(false);
        showToast('Tutup Fullscreen', '⛶');
        return;
      }

      // Avoid triggering shortcuts when typing in search or inputs
      if (
        document.activeElement.tagName === 'INPUT' ||
        document.activeElement.tagName === 'TEXTAREA' ||
        document.activeElement.isContentEditable
      ) {
        return;
      }

      switch (e.code) {
        case 'Space':
          e.preventDefault();
          const playing = handlePlayToggle();
          showToast(playing ? 'Putar' : 'Jeda', playing ? '▶' : '⏸');
          break;
        case 'ArrowLeft':
          e.preventDefault();
          handleRewind();
          showToast('Mundur 10s', '⏪');
          break;
        case 'ArrowRight':
          e.preventDefault();
          handleForward();
          showToast('Maju 10s', '⏩');
          break;
        case 'ArrowUp':
          e.preventDefault();
          setVolume((prev) => {
            const next = Math.min(prev + 5, 100);
            setIsMuted(false);
            showToast(`Volume ${next}%`, '🔊');
            return next;
          });
          break;
        case 'ArrowDown':
          e.preventDefault();
          setVolume((prev) => {
            const next = Math.max(prev - 5, 0);
            setIsMuted(false);
            showToast(`Volume ${next}%`, next === 0 ? '🔇' : '🔉');
            return next;
          });
          break;
        case 'KeyM':
          e.preventDefault();
          setIsMuted((prev) => {
            const next = !prev;
            showToast(next ? 'Mute' : 'Unmute', next ? '🔇' : '🔊');
            return next;
          });
          break;
        case 'KeyF':
          e.preventDefault();
          setIsFullscreenLyric((prev) => {
            const next = !prev;
            showToast(next ? 'Fullscreen' : 'Tutup Fullscreen', '⛶');
            return next;
          });
          break;
        case 'KeyH':
          e.preventDefault();
          setIsBarHidden((prev) => {
            const next = !prev;
            showToast(next ? 'Kontrol Disembunyikan' : 'Kontrol Ditampilkan', next ? '▼' : '▲');
            return next;
          });
          break;
        default:
          break;
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isFullscreenLyric, isPlaying, volume, isMuted, duration, isBarHidden]);

  // ── Outside click to close search ──
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (!e.target.closest('.search-area')) setShowSearchDropdown(false);
    };
    document.addEventListener('click', handleOutsideClick);
    return () => document.removeEventListener('click', handleOutsideClick);
  }, []);

  // ── Time sync loop ──
  useEffect(() => {
    let animId;
    const tick = () => {
      if (isPlayingRef.current) {
        const curr = yt.getCurrentTime();
        currentTimeRef.current = curr;
        setCurrentTime(curr);
        syncLyrics(curr);
        
        // Continuously update duration as YouTube loads video metadata
        const dur = yt.getDuration();
        if (dur > 0) {
          setDuration(dur);
        }
      }
      animId = requestAnimationFrame(tick);
    };
    animId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animId);
  }, []);

  // ── Particles ──
  const spawnParticles = () => {
    const container = document.getElementById('particlesContainer');
    if (!container) return;
    container.innerHTML = '';
    for (let i = 0; i < 18; i++) {
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

  // ── Lyric Sync ──
  const syncLyrics = (timeVal) => {
    const lyrics = currentLyricsRef.current;
    if (lyrics.length === 0) return;
    const adj = timeVal + syncOffsetRef.current;
    let idx = -1;
    for (let i = 0; i < lyrics.length; i++) {
      if (lyrics[i].time >= 0 && adj >= lyrics[i].time) idx = i;
      else if (lyrics[i].time >= 0 && adj < lyrics[i].time) break;
    }
    if (idx !== currentLyricIndexRef.current) {
      currentLyricIndexRef.current = idx;
      setCurrentLyricIndex(idx);
      scrollToLyric(lyricsScrollRef, '.lyric-line', idx);
      scrollToLyric(fsLyricsScrollRef, '.fs-lyric-line', idx);
    }
  };

  const scrollToLyric = (containerRef, selector, idx) => {
    if (!containerRef.current || idx === -1) return;
    const lines = containerRef.current.querySelectorAll(selector);
    const activeEl = lines[idx];
    if (activeEl) {
      containerRef.current.scrollTop =
        activeEl.offsetTop - containerRef.current.clientHeight / 2 + activeEl.clientHeight / 2;
    }
  };

  // ══════════════════════════════════════════════════════
  //  TRACK MANAGEMENT: Select, Next, Prev, Auto-play
  // ══════════════════════════════════════════════════════

  const loadLyricsForTrack = async (artist, title, lrcData) => {
    if (lrcData && lrcData.syncedLyrics) {
      setCurrentLyrics(parseLRC(lrcData.syncedLyrics));
    } else {
      setCurrentLyrics([]);
      const lrcResults = await searchLRCLIB(`${artist} ${title}`);
      const syncedMatch = lrcResults.find(r => r.syncedLyrics);
      if (syncedMatch) {
        setCurrentLyrics(parseLRC(syncedMatch.syncedLyrics));
      } else {
        const plainMatch = lrcResults.find(r => r.plainLyrics);
        if (plainMatch) {
          setCurrentLyrics(plainMatch.plainLyrics.split('\n').map(line => ({
            time: -1, text: line, type: line.trim() === '' ? 'empty' : 'lyric'
          })));
        }
      }
    }
    setCurrentLyricIndex(-1);
    currentLyricIndexRef.current = -1;
  };

  const playTrackByInfo = async (trackInfo, addToHistory = true) => {
    setCurrentView('player');
    setIsLoadingTrack(true);

    // Push current song to history
    if (addToHistory && songInfo.title) {
      setSongHistory(prev => [...prev, { ...songInfo }]);
    }

    yt.stopVideo();
    setIsPlaying(false);
    setCurrentTime(0);
    currentTimeRef.current = 0;
    setDuration(0);
    setCurrentLyricIndex(-1);
    currentLyricIndexRef.current = -1;

    setSongInfo({
      title: trackInfo.title,
      artist: trackInfo.artist,
      album: trackInfo.album || '',
      thumbnail: trackInfo.thumbnail || '',
      videoId: trackInfo.videoId || ''
    });

    // Fetch art in background
    fetchDeezerArt(trackInfo.artist, trackInfo.title).then(url => {
      if (url) setSongInfo(s => ({ ...s, thumbnail: url }));
    });

    // Load lyrics
    await loadLyricsForTrack(trackInfo.artist, trackInfo.title, trackInfo.lrcData);

    // Play audio
    if (trackInfo.videoId) {
      setCurrentPlaylist([{ videoId: trackInfo.videoId, title: trackInfo.title, artist: trackInfo.artist }]);
      setCurrentPlaylistIndex(0);
      yt.playVideo(trackInfo.videoId);
      setSongInfo(s => ({ ...s, videoId: trackInfo.videoId }));

      // Background: find more candidates
      searchPiped(`${trackInfo.artist} ${trackInfo.title} lyrics`).then(results => {
        const candidates = results.map(r => ({
          videoId: extractVideoId(r.url), title: r.title, artist: r.uploaderName
        })).filter(r => r.videoId && r.videoId !== trackInfo.videoId);
        setCurrentPlaylist(prev => prev.concat(prioritizeLyricVideos(candidates, trackInfo.artist, trackInfo.title)));
      }).catch(() => {});
    } else {
      // Search for playable video
      searchPiped(`${trackInfo.artist} ${trackInfo.title} lyrics`).then(results => {
        if (results.length > 0) {
          const candidates = results.map(r => ({
            videoId: extractVideoId(r.url), title: r.title, artist: r.uploaderName
          })).filter(r => r.videoId);
          const sorted = prioritizeLyricVideos(candidates, trackInfo.artist, trackInfo.title);
          setCurrentPlaylist(sorted);
          setCurrentPlaylistIndex(0);
          if (sorted.length > 0) {
            yt.playVideo(sorted[0].videoId);
            setSongInfo(s => ({ ...s, videoId: sorted[0].videoId }));
          }
        }
      }).catch(() => {});
    }

    // Fetch recommendations from same artist & build queue with them
    fetchRecommendations(trackInfo.artist, trackInfo.title);
  };

  // ── Fetch same-artist recommendations ──
  const fetchRecommendations = async (artist, currentTitle) => {
    setIsLoadingRecs(true);
    setRecommendations([]);
    const cleanedArtist = cleanArtistName(artist);
    try {
      const recs = await fetchArtistTracks(cleanedArtist);
      if (recs.length > 0) {
        // Filter out the current playing song to avoid immediate repeating
        const filtered = recs.filter(
          r => r.title.toLowerCase().trim() !== currentTitle.toLowerCase().trim()
        );
        setRecommendations(filtered);
        
        // Populate upcoming songQueue with these recommended tracks from same artist
        setSongQueue(filtered);
      }
    } catch (e) {
      console.error('Error fetching artist recommendations:', e);
    }
    setIsLoadingRecs(false);
  };

  // ── Select from recommendations ──
  const selectRecommendation = (item) => {
    setSongQueue([]);
    playTrackByInfo(item);
  };

  // ── Select from search results ──
  const selectTrack = (item) => {
    setShowSearchDropdown(false);
    setSearchQuery('');
    setSongQueue([]); // reset queue for new search
    playTrackByInfo(item);
  };

  // ── Select from homepage suggestions ──
  const handleQuickSuggestion = (suggestion) => {
    setSongQueue([]);
    playTrackByInfo({
      title: suggestion.title,
      artist: suggestion.artist,
      album: '',
      thumbnail: '',
      videoId: null,
      lrcData: null,
    });
  };

  // ── Song ended → auto-play next ──
  const handleSongEnded = () => {
    if (songQueue.length > 0) {
      const [next, ...rest] = songQueue;
      setSongQueue(rest);
      playTrackByInfo(next);
    } else {
      // Try to build a new queue from the current song
      if (songInfo.artist && songInfo.title) {
        buildQueue(songInfo.artist, songInfo.title).then(() => {
          setSongQueue(prev => {
            if (prev.length > 0) {
              const [next, ...rest] = prev;
              playTrackByInfo(next);
              return rest;
            }
            return prev;
          });
        });
      }
    }
  };

  // ── Next Track ──
  const handleNextTrack = () => {
    if (songQueue.length > 0) {
      const [next, ...rest] = songQueue;
      setSongQueue(rest);
      playTrackByInfo(next);
    }
  };

  // ── Prev Track ──
  const handlePrevTrack = () => {
    if (songHistory.length > 0) {
      const prev = songHistory[songHistory.length - 1];
      setSongHistory(h => h.slice(0, -1));
      // Push current song to front of queue so "next" can get back
      if (songInfo.title) {
        setSongQueue(q => [{ ...songInfo }, ...q]);
      }
      playTrackByInfo(prev, false); // don't add to history again
    }
  };

  // ══════════════════════════════════════════════════════
  //  PLAYBACK CONTROLS
  // ══════════════════════════════════════════════════════

  const handlePlayToggle = () => {
    const result = yt.togglePlay();
    if (typeof result === 'boolean') {
      setIsPlaying(result);
      return result;
    }
    return !isPlaying;
  };

  const handleSeek = (e) => {
    const trackRect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - trackRect.left;
    const pct = clickX / trackRect.width;
    const target = pct * duration;
    yt.seekTo(target);
    setCurrentTime(target);
    currentTimeRef.current = target;
  };

  const handleRewind = () => {
    const target = Math.max(0, yt.getCurrentTime() - 10);
    yt.seekTo(target);
    setCurrentTime(target);
    currentTimeRef.current = target;
  };

  const handleForward = () => {
    const target = Math.min(duration, yt.getCurrentTime() + 10);
    yt.seekTo(target);
    setCurrentTime(target);
    currentTimeRef.current = target;
  };

  const handleSyncAdjust = (amt) => {
    setSyncOffset(s => +(s + amt).toFixed(1));
  };

  const handleLyricsLineClick = (line) => {
    const targetTime = Math.max(0, line.time - syncOffsetRef.current);
    yt.seekToAndPlay(targetTime);
  };

  // ══════════════════════════════════════════════════════
  //  SEARCH
  // ══════════════════════════════════════════════════════

  const handleSearchInput = (e) => {
    const q = e.target.value;
    setSearchQuery(q);
    clearTimeout(searchDebounceRef.current);
    if (q.trim().length < 2) { setShowSearchDropdown(false); return; }
    setShowSearchDropdown(true);
    setIsSearching(true);
    searchDebounceRef.current = setTimeout(() => runSearch(q.trim()), 450);
  };

  const runSearch = async (query) => {
    try {
      const [pipedResults, lrclibResults] = await Promise.all([
        searchPiped(query), searchLRCLIB(query)
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
        for (const [, lrcItem] of lrcMap) {
          const trackLower = lrcItem.trackName.toLowerCase();
          const artistLower = lrcItem.artistName.toLowerCase();
          const titleLower = title.toLowerCase();
          const uploaderLower = uploader.toLowerCase();
          const trackMatches = titleLower.includes(trackLower) ||
            trackLower.includes(titleLower.replace(/\(.*?\)/g, '').trim());
          const artistMatches = uploaderLower.includes(artistLower) ||
            artistLower.includes(uploaderLower) || titleLower.includes(artistLower);
          if (trackMatches && artistMatches) { lrcMatch = lrcItem; break; }
        }

        combined.push({
          title, artist: uploader, videoId: vid,
          thumbnail: item.thumbnail || '', duration: item.duration || 0,
          hasSynced: !!lrcMatch, lrcData: lrcMatch
        });
        if (combined.length >= 10) break;
      }

      for (const [, item] of lrcMap) {
        const dupKey = `${item.trackName}|${item.artistName}`.toLowerCase();
        if (seen.has(dupKey)) continue;
        seen.add(dupKey);
        combined.push({
          title: item.trackName, artist: item.artistName, videoId: null,
          thumbnail: '', duration: item.duration || 0,
          hasSynced: true, lrcData: item, lrcOnly: true
        });
        if (combined.length >= 15) break;
      }

      setSearchResults(combined);
      setIsSearching(false);
    } catch (e) {
      setIsSearching(false);
    }
  };

  // ══════════════════════════════════════════════════════
  //  RENDER
  // ══════════════════════════════════════════════════════
  return (
    <div className="app-shell">
      {/* Background layers */}
      <div className="bg-gradient-layer"></div>
      <div id="particlesContainer" className="bg-particles"></div>
      <div className="bg-scanlines"></div>

      {/* Hidden YouTube Player */}
      <div id="ytPlayerWrapper" style={{
        position: 'fixed', bottom: '10px', right: '10px',
        width: '200px', height: '200px', overflow: 'hidden',
        pointerEvents: 'none', opacity: 0.001, zIndex: -999
      }}>
        <div id="ytPlayer"></div>
      </div>

      {/* Top Bar */}
      <TopBar
        theme={theme}
        setTheme={setTheme}
        searchQuery={searchQuery}
        onSearchInput={handleSearchInput}
        onClearSearch={() => { setSearchQuery(''); setShowSearchDropdown(false); }}
        showSearchDropdown={showSearchDropdown}
        isSearching={isSearching}
        searchResults={searchResults}
        onSelectTrack={selectTrack}
        onGoHome={() => setCurrentView('home')}
      />

      {/* Main Content */}
      <main className="main-content">
        {currentView === 'home' ? (
          <HomePage onSelectSuggestion={handleQuickSuggestion} />
        ) : (
          <div className="player-view">
            <NowPlaying songInfo={songInfo} isPlaying={isPlaying} isLoading={isLoadingTrack} />
            <Visualizer isPlayingRef={isPlayingRef} />
            <div className="content-row">
              <LyricsPanel
                currentLyrics={currentLyrics}
                currentLyricIndex={currentLyricIndex}
                lyricsScrollRef={lyricsScrollRef}
                onLyricClick={handleLyricsLineClick}
                onFullscreen={() => setIsFullscreenLyric(true)}
                isLoading={isLoadingTrack}
              />
              <RecommendedPanel
                recommendations={recommendations}
                currentVideoId={songInfo.videoId}
                onSelectTrack={selectRecommendation}
                isLoading={isLoadingRecs}
              />
            </div>
          </div>
        )}
      </main>

      {/* Player Bar (only in player view) */}
      {currentView === 'player' && (
        <>
          <PlayerBar
            currentTime={currentTime}
            duration={duration}
            isPlaying={isPlaying}
            syncOffset={syncOffset}
            volume={volume}
            isMuted={isMuted}
            hasPrev={songHistory.length > 0}
            hasNext={songQueue.length > 0}
            onSeek={handleSeek}
            onPlayToggle={handlePlayToggle}
            onRewind={handleRewind}
            onForward={handleForward}
            onPrevTrack={handlePrevTrack}
            onNextTrack={handleNextTrack}
            onSyncAdjust={handleSyncAdjust}
            onVolumeChange={(v) => { setVolume(v); setIsMuted(false); }}
            onToggleMute={() => setIsMuted(!isMuted)}
            isHidden={isBarHidden}
            onToggleHide={() => setIsBarHidden(true)}
          />
          {isBarHidden && (
            <button
              className="show-bar-btn"
              onClick={() => setIsBarHidden(false)}
              title="Tampilkan Kontrol (H)"
            >
              ▲ Tampilkan Kontrol
            </button>
          )}
        </>
      )}

      {/* Fullscreen Lyrics Overlay */}
      <FullscreenLyrics
        isActive={isFullscreenLyric}
        songInfo={songInfo}
        currentLyrics={currentLyrics}
        currentLyricIndex={currentLyricIndex}
        currentTime={currentTime}
        duration={duration}
        isPlaying={isPlaying}
        fsLyricsScrollRef={fsLyricsScrollRef}
        onClose={() => setIsFullscreenLyric(false)}
        onLyricClick={handleLyricsLineClick}
        onPlayToggle={handlePlayToggle}
        onRewind={handleRewind}
        onForward={handleForward}
        onSeek={handleSeek}
      />

      {/* Toast Notification overlay */}
      <Toast message={toastMsg} icon={toastIcon} isVisible={toastVisible} />
    </div>
  );
}
