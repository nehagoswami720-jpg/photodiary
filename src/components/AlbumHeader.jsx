// An album's editorial header: place in the serif wordmark face, the date range
// below in Newsreader italic. When there's no place, the date label carries the
// header alone. Clean default — the design-system pass refines it later.
export default function AlbumHeader({ place, dateLabel }) {
  return (
    <div className="mb-6">
      {place ? (
        <>
          <h2
            className="text-[28px] leading-tight tracking-[-0.4px] text-[#1a1a1a]"
            style={{ fontFamily: '"DM Serif Text", serif' }}
          >
            {place}
          </h2>
          <p
            className="mt-0.5 text-[16px] italic tracking-[-0.4px] text-[#959595]"
            style={{ fontFamily: '"Newsreader", serif', fontWeight: 300 }}
          >
            {dateLabel}
          </p>
        </>
      ) : (
        <h2
          className="text-[26px] leading-tight tracking-[-0.4px] text-[#1a1a1a]"
          style={{ fontFamily: '"DM Serif Text", serif' }}
        >
          {dateLabel}
        </h2>
      )}
    </div>
  );
}
