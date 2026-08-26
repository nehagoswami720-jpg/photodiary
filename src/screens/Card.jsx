import { useEffect, useRef, useState } from 'react';

// The hero card — one photo at its natural aspect (never cropped), with
// place · weekday+date · time, read from the photo's own EXIF. Any field that
// isn't known is simply omitted (nothing invented). Fonts/colors/sizes match
// the Figma "Card component" (Mulish for the place, Newsreader Light for
// date/time).
//
// The text row is constrained to the image's actual rendered width, so on a
// tall/narrow photo the place name wraps instead of bleeding past the edges.
const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'];

function ordinal(n) {
  const v = n % 100;
  const suffix = ['th', 'st', 'nd', 'rd'];
  return n + (suffix[(v - 20) % 10] || suffix[v] || suffix[0]);
}

function formatDate(d) {
  return `${WEEKDAYS[d.getDay()]}, ${ordinal(d.getDate())} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

function formatTime(d) {
  let h = d.getHours();
  const ampm = h >= 12 ? 'pm' : 'am';
  h = h % 12 || 12;
  return `${h}.${String(d.getMinutes()).padStart(2, '0')} ${ampm}`;
}

export default function Card({ place, capturedAt, imageUrl, showTime = true }) {
  const imgRef = useRef(null);
  const [width, setWidth] = useState(null); // the image's rendered width

  useEffect(() => {
    const el = imgRef.current;
    if (!el) return;
    const measure = () => setWidth(el.getBoundingClientRect().width);
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [imageUrl]);

  return (
    <div className="card-in flex w-fit max-w-[92vw] flex-col gap-4">
      <img
        ref={imgRef}
        src={imageUrl}
        alt=""
        onLoad={() => imgRef.current && setWidth(imgRef.current.getBoundingClientRect().width)}
        className="block h-auto w-auto object-contain"
        style={{ maxWidth: 'min(520px, 92vw)', maxHeight: '62vh' }}
      />
      {/* row constrained to the image width so nothing spills past the photo */}
      <div
        className="flex items-start justify-between gap-4"
        style={{ width: width ? `${width}px` : undefined, maxWidth: 'min(520px, 92vw)' }}
      >
        <div className="flex min-w-0 flex-col gap-1">
          {place && (
            <p
              className="break-words text-[20px] leading-[1.5] tracking-[-0.6px] text-[#2f2f2f]"
              style={{ fontFamily: '"Mulish", sans-serif', fontWeight: 500 }}
            >
              {place}
            </p>
          )}
          {capturedAt && (
            <p
              className="break-words text-[16px] italic leading-[1.4] tracking-[-0.48px] text-[#959595]"
              style={{ fontFamily: '"Newsreader", serif', fontWeight: 300 }}
            >
              {formatDate(capturedAt)}
            </p>
          )}
        </div>
        {capturedAt && showTime && (
          <p
            className="shrink-0 whitespace-nowrap text-[16px] leading-[1.5] tracking-[-0.48px] text-[#959595]"
            style={{ fontFamily: '"Newsreader", serif', fontWeight: 300 }}
          >
            {formatTime(capturedAt)}
          </p>
        )}
      </div>
    </div>
  );
}
