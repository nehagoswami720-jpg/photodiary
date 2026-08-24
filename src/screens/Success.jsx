// Screen 3 — the success beat: the bar completes in green, "upload complete",
// and a brief confetti burst that launches UP off the bar. Plays once on mount;
// no ongoing interaction.
const COLORS = ['#028300', '#1a1a1a', '#767676', '#c99a3b', '#6b8cce'];
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
    <div className="flex w-[620px] max-w-[90vw] flex-col">
      {/* confetti launches upward, anchored to the top of the bar */}
      <div className="pointer-events-none relative h-[180px] w-full">
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

      {/* completed bar + labels (green, matching Figma #028300) */}
      <div className="h-[8px] w-full bg-[#028300]" />
      <div
        className="mt-2 flex items-center justify-between py-1 text-[18px] leading-[1.7] tracking-[-0.6px] text-[#767676]"
        style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif', fontWeight: 300 }}
      >
        <span>upload complete</span>
        <span className="tabular-nums">100%</span>
      </div>
    </div>
  );
}
