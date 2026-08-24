// Screen 3 — the success beat: the bar completes in green, "upload complete",
// and a brief confetti burst (matches the Figma confetti element). Plays once
// on mount; no ongoing interaction.
const COLORS = ['#028300', '#1a1a1a', '#767676', '#c99a3b', '#6b8cce'];
const PIECES = Array.from({ length: 18 }, (_, i) => ({
  left: Math.round(Math.random() * 100),
  color: COLORS[i % COLORS.length],
  delay: (Math.random() * 0.4).toFixed(2),
  duration: (1.1 + Math.random() * 0.6).toFixed(2),
  rot: Math.round((Math.random() - 0.5) * 640),
}));

export default function Success() {
  return (
    <div className="flex w-[620px] max-w-[90vw] flex-col items-center gap-5">
      {/* confetti burst */}
      <div className="pointer-events-none relative h-[160px] w-[222px] overflow-hidden">
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
            }}
          />
        ))}
      </div>

      {/* completed bar + labels (green, matching Figma #028300) */}
      <div className="flex w-full flex-col gap-2">
        <div className="h-[8px] w-full bg-[#028300]" />
        <div
          className="flex items-center justify-between py-1 text-[18px] leading-[1.7] tracking-[-0.6px] text-[#767676]"
          style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif', fontWeight: 300 }}
        >
          <span>upload complete</span>
          <span className="tabular-nums">100%</span>
        </div>
      </div>
    </div>
  );
}
