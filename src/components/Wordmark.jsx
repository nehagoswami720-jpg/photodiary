// The "MOMENTS" wordmark with its calm entrance + breathing motion.
// Rendered once in App (stays mounted across screens) so the entrance plays
// only on first load, not on every screen change.
export default function Wordmark({ color = '#1a1a1a' }) {
  return (
    <h1
      className="mt-12 whitespace-nowrap text-[64px] leading-none tracking-[-0.64px]"
      style={{ fontFamily: '"DM Serif Text", serif', color }}
      aria-label="Moments"
    >
      <span className="title-breathe inline-block">
        {'MOMENTS'.split('').map((letter, i) => (
          <span
            key={i}
            className="title-letter"
            style={{ animationDelay: `${i * 0.09}s` }}
            aria-hidden="true"
          >
            {letter}
          </span>
        ))}
      </span>
    </h1>
  );
}
