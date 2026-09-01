import { useEffect, useRef } from 'react';

// A glittery cursor tail: a full-screen 2D canvas over the gallery that spawns
// little twinkling stars where the cursor moves. They drift, float up, and fade.
// pointer-events-none so it never intercepts clicks/hover on the photos. Uses its
// own rAF + additive blending for a soft glow; particle count is self-limiting via
// spawn throttle + fade, so it stays light.
const COLORS = ['#fff7d6', '#ffe9a8', '#fffbe9', '#ffd98a', '#eef2ff', '#ffffff'];

export default function SparkleCursor() {
  const canvasRef = useRef(null);

  useEffect(() => {
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    let w = 0;
    let h = 0;
    let dpr = 1;

    function resize() {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = canvas.width = Math.floor(window.innerWidth * dpr);
      h = canvas.height = Math.floor(window.innerHeight * dpr);
      canvas.style.width = window.innerWidth + 'px';
      canvas.style.height = window.innerHeight + 'px';
    }
    resize();
    window.addEventListener('resize', resize);

    const particles = [];
    let lastX = null;
    let lastY = null;
    let lastSpawn = 0;

    function spawn(x, y) {
      const a = Math.random() * Math.PI * 2;
      const sp = (Math.random() * 0.5 + 0.15) * dpr;
      particles.push({
        x: x + (Math.random() - 0.5) * 12 * dpr,
        y: y + (Math.random() - 0.5) * 12 * dpr,
        vx: Math.cos(a) * sp,
        vy: Math.sin(a) * sp - 0.18 * dpr, // slight upward float
        life: 1,
        decay: Math.random() * 0.018 + 0.011,
        size: (Math.random() * 2 + 1.2) * dpr,
        rot: Math.random() * Math.PI,
        spin: (Math.random() - 0.5) * 0.08,
        twk: Math.random() * Math.PI * 2,
        color: COLORS[(Math.random() * COLORS.length) | 0],
      });
    }

    function onMove(e) {
      const x = e.clientX * dpr;
      const y = e.clientY * dpr;
      const now = performance.now();
      if (now - lastSpawn > 12) {
        const dist = lastX == null ? 0 : Math.hypot(x - lastX, y - lastY);
        const count = Math.min(4, 1 + Math.floor(dist / (16 * dpr)));
        for (let i = 0; i < count; i++) spawn(x, y);
        lastSpawn = now;
        if (particles.length > 260) particles.splice(0, particles.length - 260);
      }
      lastX = x;
      lastY = y;
    }
    window.addEventListener('pointermove', onMove);

    let raf;
    function frame() {
      ctx.clearRect(0, 0, w, h);
      ctx.globalCompositeOperation = 'lighter';
      const now = performance.now() * 0.008;
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.006 * dpr; // gentle gravity so they arc and settle
        p.vx *= 0.98;
        p.vy *= 0.99;
        p.rot += p.spin;
        p.life -= p.decay;
        if (p.life <= 0) {
          particles.splice(i, 1);
          continue;
        }
        const twinkle = 0.55 + 0.45 * Math.sin(p.twk + now);
        drawSparkle(ctx, p.x, p.y, p.size * (0.5 + 0.5 * p.life), p.rot, p.color, p.life * twinkle);
      }
      ctx.globalCompositeOperation = 'source-over';
      raf = requestAnimationFrame(frame);
    }
    frame();

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return <canvas ref={canvasRef} className="pointer-events-none fixed inset-0 z-30" />;
}

// a soft 4-point star: a faint large pass for glow + a bright small core
function drawSparkle(ctx, x, y, size, rot, color, alpha) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rot);
  ctx.fillStyle = color;
  ctx.globalAlpha = Math.max(0, alpha) * 0.35;
  star(ctx, size * 1.9);
  ctx.globalAlpha = Math.max(0, Math.min(1, alpha));
  star(ctx, size);
  ctx.restore();
}

function star(ctx, s) {
  ctx.beginPath();
  for (let i = 0; i < 4; i++) {
    const outer = i * (Math.PI / 2);
    const inner = outer + Math.PI / 4;
    ctx.lineTo(Math.cos(outer) * s, Math.sin(outer) * s);
    ctx.lineTo(Math.cos(inner) * s * 0.38, Math.sin(inner) * s * 0.38);
  }
  ctx.closePath();
  ctx.fill();
}
