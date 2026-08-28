// Shared display formatting for a moment's date and time, used by both the hero
// card and the gallery cell. These render the photo's local wall-clock exactly
// as recorded (or manually entered) — nothing invented.
const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'];

export function ordinal(n) {
  const v = n % 100;
  const suffix = ['th', 'st', 'nd', 'rd'];
  return n + (suffix[(v - 20) % 10] || suffix[v] || suffix[0]);
}

// "Friday, 26th December 2025"
export function formatDate(d) {
  return `${WEEKDAYS[d.getDay()]}, ${ordinal(d.getDate())} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

// "3.16 pm"
export function formatTime(d) {
  let h = d.getHours();
  const ampm = h >= 12 ? 'pm' : 'am';
  h = h % 12 || 12;
  return `${h}.${String(d.getMinutes()).padStart(2, '0')} ${ampm}`;
}

// A human date label for an album spanning [start, end] (both Date, start<=end):
//   same day    -> "Friday, 26th December 2025"
//   same month  -> "June 2016"  (or "3–9 June 2016" if different days)
//   same year   -> "3 June – 9 August 2016"
//   otherwise   -> "Dec 2025 – Feb 2026"
export function formatDateRange(start, end) {
  const sameDay =
    start.getFullYear() === end.getFullYear() &&
    start.getMonth() === end.getMonth() &&
    start.getDate() === end.getDate();
  if (sameDay) return formatDate(start);

  const sameMonth =
    start.getFullYear() === end.getFullYear() && start.getMonth() === end.getMonth();
  if (sameMonth) {
    return `${ordinal(start.getDate())}–${ordinal(end.getDate())} ${MONTHS[start.getMonth()]} ${start.getFullYear()}`;
  }

  const sameYear = start.getFullYear() === end.getFullYear();
  if (sameYear) {
    return `${ordinal(start.getDate())} ${MONTHS[start.getMonth()]} – ${ordinal(end.getDate())} ${MONTHS[end.getMonth()]} ${start.getFullYear()}`;
  }

  return `${MONTHS[start.getMonth()].slice(0, 3)} ${start.getFullYear()} – ${MONTHS[end.getMonth()].slice(0, 3)} ${end.getFullYear()}`;
}
