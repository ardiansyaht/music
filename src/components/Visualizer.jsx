// ================================================================
//  Melodia — Visualizer Component
// ================================================================
import React, { useRef, useEffect, useCallback } from 'react';

export default function Visualizer({ isPlayingRef }) {
  const canvasRef = useRef(null);
  const simBarsRef = useRef(Array(56).fill(0));
  const visColor1Ref = useRef('#ff758f');
  const visColor2Ref = useRef('#ff9a76');

  const handleResize = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const strip = canvas.parentElement;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = strip.clientWidth * dpr;
    canvas.height = strip.clientHeight * dpr;
    const ctx = canvas.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }, []);

  const updateColors = useCallback(() => {
    setTimeout(() => {
      try {
        const style = getComputedStyle(document.documentElement);
        visColor1Ref.current = style.getPropertyValue('--vis-color-1').trim() || '#ff758f';
        visColor2Ref.current = style.getPropertyValue('--vis-color-2').trim() || '#ff9a76';
      } catch (e) {}
    }, 40);
  }, []);

  useEffect(() => {
    window.addEventListener('resize', handleResize);
    handleResize();
    updateColors();

    // Observe theme changes on body
    const observer = new MutationObserver(() => updateColors());
    observer.observe(document.body, { attributes: true, attributeFilter: ['data-theme'] });

    // Animation loop
    let animId;
    const tick = () => {
      const canvas = canvasRef.current;
      if (!canvas) { animId = requestAnimationFrame(tick); return; }
      const ctx = canvas.getContext('2d');
      const dpr = window.devicePixelRatio || 1;
      const w = canvas.width / dpr;
      const h = canvas.height / dpr;
      ctx.clearRect(0, 0, w, h);

      const barCount = 56;
      const barW = w / barCount - 1.5;

      for (let i = 0; i < barCount; i++) {
        if (isPlayingRef.current) {
          const timeSec = Date.now() * 0.0012;
          const wave = Math.sin(timeSec * 5 + i * 0.12) * 0.18 + 0.45;
          const randomNoise = Math.random() * 0.22;
          const target = wave + randomNoise;
          simBarsRef.current[i] += (target - simBarsRef.current[i]) * 0.16;
        } else {
          simBarsRef.current[i] *= 0.88;
        }

        const barH = simBarsRef.current[i] * (h * 0.85);
        const grad = ctx.createLinearGradient(0, h - barH, 0, h);
        grad.addColorStop(0, visColor1Ref.current);
        grad.addColorStop(1, visColor2Ref.current);

        ctx.fillStyle = grad;
        ctx.fillRect(i * (barW + 1.5), h - barH, barW, barH);
      }

      animId = requestAnimationFrame(tick);
    };
    animId = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
      observer.disconnect();
    };
  }, [handleResize, updateColors, isPlayingRef]);

  return (
    <div className="visualizer-strip">
      <canvas ref={canvasRef}></canvas>
    </div>
  );
}
