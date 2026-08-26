import { readPhotoData } from './exif.js';
import { zoneFromCoords } from './timezone.js';
import { reverseGeocode } from './geocode.js';
import { formatPlace } from './place-format.js';

const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'];

// Build a finished card from already-extracted photo data (from exif.js, or a
// manual-entry object of the same shape). Async because place naming is a
// network call.
//
// Honesty rule, enforced here: every field is a real value or null. When we
// have coordinates but the geocoder fails, we show coarse coordinates — still
// real data, never an invented place.
export async function buildCard(data, { homeCountry = null } = {}) {
  const { capturedAt = null, offset = null, lat = null, lon = null, source = 'exif' } = data || {};

  const when = capturedAt ? formatWhen(capturedAt) : { weekday: null, date: null, time: null };
  const hasCoords = typeof lat === 'number' && typeof lon === 'number';
  const zone = hasCoords ? zoneFromCoords(lat, lon) : null;

  // Place is the detected city, or null. If it can't be detected we show
  // nothing (never raw coordinates) — manual entry is the fallback (D19-era).
  let place = null;
  if (hasCoords) {
    const geo = await reverseGeocode(lat, lon);
    place = formatPlace(geo, homeCountry);
  }

  return {
    place, // "Chicago, Illinois" | null
    weekday: when.weekday, // "Friday" | null
    date: when.date, // "26 December 2025" | null
    time: when.time, // "3:16 PM" | null
    // provenance + fields the diary stores (see docs/05-architecture.md)
    source,
    coords: hasCoords ? { lat, lon } : null,
    zone,
    offset,
    wallClock: capturedAt ? toWallClockISO(capturedAt) : null,
  };
}

// Convenience: file -> { data, card } in one call.
export async function cardFromFile(file, opts) {
  const data = await readPhotoData(file);
  return { data, card: await buildCard(data, opts) };
}

// --- helpers ---

// The photo's local wall-clock components are exactly what we display.
function formatWhen(d) {
  let h = d.getHours();
  const ampm = h >= 12 ? 'PM' : 'AM';
  h = h % 12 || 12;
  return {
    weekday: WEEKDAYS[d.getDay()],
    date: `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`,
    time: `${h}:${String(d.getMinutes()).padStart(2, '0')} ${ampm}`,
  };
}

// Naive ISO (no timezone) capturing the wall-clock; paired with `offset`/`zone`
// this pins a real instant, which is what v2's timeline sorting will use.
function toWallClockISO(d) {
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}` +
    `T${p(d.getHours())}:${p(d.getMinutes())}:00`;
}
