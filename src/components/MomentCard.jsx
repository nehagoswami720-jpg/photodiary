import { formatDate, formatTime } from '../lib/format.js';

// A single moment in the gallery grid: the photo at column width (natural
// aspect, uncropped) + a small caption (place · date · time). Any field that
// isn't known is omitted (same honesty as the hero card). Sizes here are
// provisional — the design-system pass will reconcile them later.
export default function MomentCard({ place, capturedAt, showTime, imageUrl }) {
  return (
    <div className="mb-12 break-inside-avoid">
      <img src={imageUrl} alt="" className="block h-auto w-full" />
      {(place || capturedAt) && (
        <div className="mt-3 flex items-start justify-between gap-3">
          <div className="flex min-w-0 flex-col gap-0.5">
            {place && (
              <p
                className="break-words text-[16px] tracking-[-0.5px] text-[#2f2f2f]"
                style={{ fontFamily: '"Mulish", sans-serif', fontWeight: 500 }}
              >
                {place}
              </p>
            )}
            {capturedAt && (
              <p
                className="break-words text-[13px] italic tracking-[-0.4px] text-[#959595]"
                style={{ fontFamily: '"Newsreader", serif', fontWeight: 300 }}
              >
                {formatDate(capturedAt)}
              </p>
            )}
          </div>
          {capturedAt && showTime && (
            <p
              className="shrink-0 whitespace-nowrap text-[13px] tracking-[-0.4px] text-[#959595]"
              style={{ fontFamily: '"Newsreader", serif', fontWeight: 300 }}
            >
              {formatTime(capturedAt)}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
