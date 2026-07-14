// ================================================================
//  Melodia — YouTube Player Custom Hook
// ================================================================
import { useEffect, useRef, useCallback } from 'react';

/**
 * Custom hook that manages the YouTube IFrame API lifecycle.
 * Returns refs and control functions for the hidden YouTube player.
 */
export function useYouTubePlayer({ volume, isMuted, onStateChange, onError }) {
  const ytPlayerRef = useRef(null);
  const ytReadyRef = useRef(false);
  const targetVideoIdRef = useRef('');
  const playOnReadyRef = useRef(false);

  // Initialize YT Player
  const initYTPlayer = useCallback(() => {
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
            if (onStateChange) onStateChange(e);
          },
          onError: (e) => {
            if (onError) onError(e);
          }
        }
      });
    } catch (err) {
      console.error('Failed to initialize YT.Player:', err);
    }
  }, []);

  // Load YouTube IFrame API script on mount
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
  }, [initYTPlayer]);

  // Sync volume/mute with the player
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

  // Control functions
  const playVideo = useCallback((vid) => {
    targetVideoIdRef.current = vid;
    if (ytReadyRef.current && ytPlayerRef.current) {
      ytPlayerRef.current.loadVideoById(vid);
    } else {
      playOnReadyRef.current = true;
    }
  }, []);

  const togglePlay = useCallback(() => {
    if (!ytReadyRef.current || !ytPlayerRef.current) {
      playOnReadyRef.current = !playOnReadyRef.current;
      return playOnReadyRef.current;
    }
    try {
      const state = ytPlayerRef.current.getPlayerState();
      if (state === 1) {
        ytPlayerRef.current.pauseVideo();
        return false;
      } else if (state === 5 || state === -1) {
        const vid = targetVideoIdRef.current;
        if (vid) ytPlayerRef.current.loadVideoById(vid);
        return true;
      } else {
        ytPlayerRef.current.playVideo();
        return true;
      }
    } catch (e) {
      console.warn('Failed to read player state:', e);
      try {
        const vid = targetVideoIdRef.current;
        if (vid) ytPlayerRef.current.loadVideoById(vid);
      } catch (err) {}
      return true;
    }
  }, []);

  const seekTo = useCallback((time) => {
    if (!ytReadyRef.current || !ytPlayerRef.current) return;
    ytPlayerRef.current.seekTo(time, true);
  }, []);

  const getCurrentTime = useCallback(() => {
    if (!ytReadyRef.current || !ytPlayerRef.current) return 0;
    try {
      return ytPlayerRef.current.getCurrentTime() || 0;
    } catch (e) {
      return 0;
    }
  }, []);

  const getPlayerState = useCallback(() => {
    if (!ytReadyRef.current || !ytPlayerRef.current) return -1;
    try {
      return ytPlayerRef.current.getPlayerState();
    } catch (e) {
      return -1;
    }
  }, []);

  const getDuration = useCallback(() => {
    if (!ytReadyRef.current || !ytPlayerRef.current) return 0;
    try {
      return ytPlayerRef.current.getDuration() || 0;
    } catch (e) {
      return 0;
    }
  }, []);

  const stopVideo = useCallback(() => {
    if (!ytReadyRef.current || !ytPlayerRef.current) return;
    try {
      ytPlayerRef.current.stopVideo();
    } catch (e) {}
  }, []);

  const seekToAndPlay = useCallback((time) => {
    if (!ytReadyRef.current || !ytPlayerRef.current) return;
    const vid = targetVideoIdRef.current;
    try {
      const state = ytPlayerRef.current.getPlayerState();
      if (state === 5 || state === -1) {
        if (vid) ytPlayerRef.current.loadVideoById(vid, time);
      } else {
        ytPlayerRef.current.seekTo(time, true);
        ytPlayerRef.current.playVideo();
      }
    } catch (e) {
      try {
        ytPlayerRef.current.seekTo(time, true);
        ytPlayerRef.current.playVideo();
      } catch (err) {}
    }
  }, []);

  return {
    ytPlayerRef,
    ytReadyRef,
    targetVideoIdRef,
    playOnReadyRef,
    playVideo,
    togglePlay,
    seekTo,
    seekToAndPlay,
    getCurrentTime,
    getPlayerState,
    getDuration,
    stopVideo,
  };
}
