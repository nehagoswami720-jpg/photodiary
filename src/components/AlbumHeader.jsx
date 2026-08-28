// An album's header — the place, in the serif wordmark face. Albums are grouped
// by location only, so the header is just the place (each moment still carries
// its own date + time on its card). The no-location bucket uses `title`.
export default function AlbumHeader({ place, title }) {
  return (
    <h2
      className="mb-6 text-[28px] leading-tight tracking-[-0.4px] text-[#1a1a1a]"
      style={{ fontFamily: '"DM Serif Text", serif' }}
    >
      {place || title}
    </h2>
  );
}
