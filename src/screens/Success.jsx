// Screen 3 — the success beat. Layout mirrors the Loading screen exactly (same
// bar + labels position) so the loading -> success swap doesn't move the bar.
// The confetti is an absolute overlay (no layout space), and the bar eases from
// black -> green in place. Plays once; no ongoing interaction.
const COLORS = ['#2fbf5f', '#ffffff', '#b5b5b5', '#e0b95a', '#7ea2f0'];
const PIECES = Array.from({ length: 20 }, (_, i) => ({
  left: Math.round(5 + Math.random() * 90), // spread along the bar
  color: COLORS[i % COLORS.length],
  delay: (Math.random() * 0.5).toFixed(2),
  duration: (1.8 + Math.random() * 0.9).toFixed(2), // slower
  rot: Math.round((Math.random() - 0.5) * 640),
  dx: Math.round((Math.random() - 0.5) * 90), // sideways drift as it rises
}));

export default function Success() {
  return (
    <div className="relative flex w-[620px] max-w-[90vw] flex-col gap-2">
      {/* confetti overlay — absolute so it doesn't push the bar down */}
      <div className="pointer-events-none absolute bottom-full left-0 h-[180px] w-full">
        {PIECES.map((p, i) => (
          <span
            key={i}
            className="confetti-piece"
            style={{
              left: `${p.left}%`,
              background: p.color,
              animationDelay: `${p.delay}s`,
              animationDuration: `${p.duration}s`,
              '--rot': `${p.rot}deg`,
              '--dx': `${p.dx}px`,
            }}
          />
        ))}
      </div>

      {/* bar eases black -> green in place (same position as the loading bar) */}
      <div className="success-bar h-[8px] w-full" />
      <div
        className="flex items-center justify-between py-1 text-[18px] leading-[1.7] tracking-[-0.6px] text-[#8f8f8f]"
        style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif', fontWeight: 300 }}
      >
        <span>upload complete</span>
        <span className="tabular-nums">100%</span>
      </div>
    </div>
  );
}
