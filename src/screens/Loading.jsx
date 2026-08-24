// Screen 2 — the upload progress indicator.
// The progress bar and % are driven by App as real work happens. The status
// line shimmers and its trailing dots animate (the "thinking" effect); it
// re-mounts on each label change (keyed) so the new phrase fades in gently.
export default function Loading({ percent, status }) {
  return (
    <div className="flex w-[620px] max-w-[90vw] flex-col gap-2">
      {/* progress bar (matches Figma: #d9d9d9 track, #080808 fill, 12px) */}
      <div className="h-[12px] w-full bg-[#d9d9d9]">
        <div className="h-full bg-[#080808]" style={{ width: `${percent}%` }} />
      </div>

      {/* status message (left) + percentage (right) */}
      <div
        className="flex items-center justify-between text-[18px] leading-none tracking-[-0.5px] text-[#767676]"
        style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif', fontWeight: 300 }}
      >
        <span key={status} className="status-line inline-flex items-baseline">
          <span className="status-shimmer">{status}</span>
          <span className="status-dots" aria-hidden="true">
            <span className="dot">.</span>
            <span className="dot">.</span>
            <span className="dot">.</span>
          </span>
        </span>
        <span className="tabular-nums text-right">{percent}%</span>
      </div>
    </div>
  );
}
