// ================================================================
//  Melodia — Main App Shell
//  Manages global state, routing, and orchestrates all components.
// ================================================================
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { LYRICS_DATA } from './lyrics';
import { useYouTubePlayer } from './hooks/useYouTubePlayer';
import { searchPiped, searchLRCLIB, fetchDeezerArt } from './utils/api';
import { parseLRC, extractVideoId, prioritizeLyricVideos } from './utils/helpers';

import TopBar from './components/TopBar';
import HomePage from './components/HomePage';
import NowPlaying from './components/NowPlaying';
import Visualizer from './components/Visualizer';
import LyricsPanel from './components/LyricsPanel';
import PlayerBar from './components/PlayerBar';
import FullscreenLyrics from './components/FullscreenLyrics';
import RecommendedPanel from './components/RecommendedPanel';

export default function App() {
  // ── Theme ──
  const [theme, setTheme] = useState(() => localStorage.getItem('melodia-theme') || 'pastel');

  // ── Views ──
  const [currentView, setCurrentView] = useState('home'); // 'home' | 'player'
  const [isFullscreenLyric, setIsFullscreenLyric] = useState(false);

  // ── Playback State ──
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [syncOffset, setSyncOffset] = useState(0.0);
  const [volume, setVolume] = useState(75);
  const [isMuted, setIsMuted] = useState(false);

  // ── Song Info ──
  const [songInfo, setSongInfo] = useState({
    title: '', artist: '', album: '', thumbnail: '', videoId: ''
  });

  // ── Lyrics ──
  const [currentLyrics, setCurrentLyrics] = useState(LYRICS_DATA);
  const [currentLyricIndex, setCurrentLyricIndex] = useState(-1);

  // ── Search ──
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);

  // ── Playlist / Queue / History ──
  const [currentPlaylist, setCurrentPlaylist] = useState([]);
  const [currentPlaylistIndex, setCurrentPlaylistIndex] = useState(0);
  const [songHistory, setSongHistory] = useState([]); // previously played songs
  const [songQueue, setSongQueue] = useState([]);     // upcoming songs

  // ── Recommendations ──
  const [recommendations, setRecommendations] = useState([]);
  const [isLoadingRecs, setIsLoadingRecs] = useState(false);

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
        setDuration(yt.getDuration());
      } else if (state === 2) { // PAUSED
        setIsPlaying(false);
      } else if (state === 0) { // ENDED
        setIsPlaying(false);
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

  // ── ESC to close fullscreen ──
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isFullscreenLyric) setIsFullscreenLyric(false);
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isFullscreenLyric]);

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

    // Push current song to history
    if (addToHistory && songInfo.title) {
      setSongHistory(prev => [...prev, { ...songInfo }]);
    }

    yt.stopVideo();
    setIsPlaying(false);

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
        setCurrentPlaylist(prev => prev.concat(prioritizeLyricVideos(candidates)));
      }).catch(() => {});
    } else {
      // Search for playable video
      searchPiped(`${trackInfo.artist} ${trackInfo.title} lyrics`).then(results => {
        if (results.length > 0) {
          const candidates = results.map(r => ({
            videoId: extractVideoId(r.url), title: r.title, artist: r.uploaderName
          })).filter(r => r.videoId);
          const sorted = prioritizeLyricVideos(candidates);
          setCurrentPlaylist(sorted);
          setCurrentPlaylistIndex(0);
          if (sorted.length > 0) {
            yt.playVideo(sorted[0].videoId);
            setSongInfo(s => ({ ...s, videoId: sorted[0].videoId }));
          }
        }
      }).catch(() => {});
    }

    // Pre-fill queue with related songs (if queue is empty)
    if (songQueue.length === 0) {
      buildQueue(trackInfo.artist, trackInfo.title);
    }

    // Fetch recommendations from same artist
    fetchRecommendations(trackInfo.artist, trackInfo.title);
  };

  const buildQueue = async (artist, title) => {
    try {
      const results = await searchPiped(`${artist} ${title}`);
      if (results.length > 1) {
        const queueItems = results.slice(1, 8).map(r => ({
          title: r.title || '',
          artist: r.uploaderName || '',
          videoId: extractVideoId(r.url),
          thumbnail: r.thumbnail || '',
        })).filter(r => r.videoId);
        setSongQueue(queueItems);
      }
    } catch (e) {}
  };

  // ── Fetch same-artist recommendations ──
  const fetchRecommendations = async (artist, currentTitle) => {
    setIsLoadingRecs(true);
    setRecommendations([]);
    try {
      const results = await searchPiped(`${artist} songs`);
      if (results.length > 0) {
        const recs = results
          .map(r => ({
            title: r.title || '',
            artist: r.uploaderName || '',
            videoId: extractVideoId(r.url),
            thumbnail: r.thumbnail || '',
          }))
          .filter(r => r.videoId && !r.title.toLowerCase().includes(currentTitle.toLowerCase()))
          .slice(0, 10);
        setRecommendations(recs);
      }
    } catch (e) {}
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
    if (typeof result === 'boolean') setIsPlaying(result);
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
  };

  const handleForward = () => {
    const target = Math.min(duration, yt.getCurrentTime() + 10);
    yt.seekTo(target);
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
          <>
            <NowPlaying songInfo={songInfo} isPlaying={isPlaying} />
            <Visualizer isPlayingRef={isPlayingRef} />
            <div className="content-row">
              <LyricsPanel
                currentLyrics={currentLyrics}
                currentLyricIndex={currentLyricIndex}
                lyricsScrollRef={lyricsScrollRef}
                onLyricClick={handleLyricsLineClick}
                onFullscreen={() => setIsFullscreenLyric(true)}
              />
              <RecommendedPanel
                recommendations={recommendations}
                currentVideoId={songInfo.videoId}
                onSelectTrack={selectRecommendation}
                isLoading={isLoadingRecs}
              />
            </div>
          </>
        )}
      </main>

      {/* Player Bar (only in player view) */}
      {currentView === 'player' && (
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
        />
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
    </div>
  );
}
