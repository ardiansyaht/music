// ================================================================
//  Melodia — LyricsPanel Component
// ================================================================
import React, { useState, useEffect, useRef } from 'react';

export default function LyricsPanel({
  currentLyrics,
  currentLyricIndex,
  lyricsScrollRef,
  onLyricClick,
  onFullscreen,
  isLoading,
}) {
  const [showScrollBtn, setShowScrollBtn] = useState(false);
  const userScrolling = useRef(false);
  const scrollTimer = useRef(null);

  // Detect when user manually scrolls away from the active lyric
  useEffect(() => {
    const container = lyricsScrollRef?.current;
    if (!container) return;

    const handleScroll = () => {
      userScrolling.current = true;
      clearTimeout(scrollTimer.current);
      scrollTimer.current = setTimeout(() => {
        userScrolling.current = false;
        // Check if active lyric is visible
        const activeEl = container.querySelector('.lyric-line.active');
        if (activeEl) {
          const containerRect = container.getBoundingClientRect();
          const activeRect = activeEl.getBoundingClientRect();
          const isVisible = activeRect.top >= containerRect.top && activeRect.bottom <= containerRect.bottom;
          setShowScrollBtn(!isVisible);
        }
      }, 300);
    };

    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, [lyricsScrollRef]);

  // Hide button when active lyric changes (auto-scroll brings it back)
  useEffect(() => {
    if (!userScrolling.current) {
      setShowScrollBtn(false);
    }
  }, [currentLyricIndex]);

  const scrollToActive = () => {
    const container = lyricsScrollRef?.current;
    if (!container) return;
    const activeEl = container.querySelector('.lyric-line.active');
    if (activeEl) {
      container.scrollTop =
        activeEl.offsetTop - container.clientHeight / 2 + activeEl.clientHeight / 2;
      setShowScrollBtn(false);
    }
  };

  if (isLoading) {
    return (
      <section className="lyrics-panel skeleton">
        <div className="lyrics-panel-header"></div>
        <div className="lyrics-scroll">
          <div className="skeleton-line skeleton-lyric-line width-60"></div>
          <div className="skeleton-line skeleton-lyric-line width-80"></div>
          <div className="skeleton-line skeleton-lyric-line width-40"></div>
          <div className="skeleton-line skeleton-lyric-line width-70"></div>
          <div className="skeleton-line skeleton-lyric-line width-50"></div>
        </div>
      </section>
    );
  }

  return (
    <section className="lyrics-panel">
      <div className="lyrics-panel-header">
        {currentLyrics.length > 0 && (
          <button className="fullscreen-btn" onClick={onFullscreen} title="Lirik Fullscreen">
            ⛶
          </button>
        )}
      </div>
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
            onClick={line.time >= 0 ? () => onLyricClick(line) : null}
          >
            {line.text}
          </div>
        ))}
      </div>
      {showScrollBtn && currentLyricIndex >= 0 && (
        <button className="scroll-to-lyric-btn" onClick={scrollToActive} title="Kembali ke lirik aktif">
          ↓ Lirik Aktif
        </button>
      )}
    </section>
  );
}
