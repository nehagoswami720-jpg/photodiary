// The hero card — one photo shown at its natural aspect (never cropped), with
// place · weekday+date · time, read from the photo's own EXIF. Any field that
// isn't known is simply omitted (nothing invented). Fonts/colors/sizes match
// the Figma "Card component" (Mulish for the place, Newsreader for date/time).
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

export default function Card({ place, capturedAt, imageUrl }) {
  return (
    <div className="card-in flex w-fit max-w-[92vw] flex-col gap-4">
      <img
        src={imageUrl}
        alt=""
        className="block h-auto w-auto object-contain"
        style={{ maxWidth: 'min(520px, 92vw)', maxHeight: '62vh' }}
      />
      <div className="flex w-full items-start justify-between gap-6">
        <div className="flex flex-col gap-1">
          {place && (
            <p
              className="text-[24px] tracking-[-0.72px] text-[#2c2c2c]"
              style={{ fontFamily: '"Mulish", sans-serif', fontWeight: 500 }}
            >
              {place}
            </p>
          )}
          {capturedAt && (
            <p
              className="text-[20px] italic tracking-[-0.6px] text-[#959595]"
              style={{ fontFamily: '"Newsreader", serif', fontWeight: 400 }}
            >
              {formatDate(capturedAt)}
            </p>
          )}
        </div>
        {capturedAt && (
          <p
            className="whitespace-nowrap text-[20px] tracking-[-0.6px] text-[#959595]"
            style={{ fontFamily: '"Newsreader", serif', fontWeight: 500 }}
          >
            {formatTime(capturedAt)}
          </p>
        )}
      </div>
    </div>
  );
}
