import { formatDate, formatDateRange } from './format.js';

// Auto-group moments into albums by gaps in time and location — pure arithmetic
// on the data every entry already stores. Honest by construction: only recorded
// values are used; names come from real places/dates; anything undated is never
// guessed into a group.

// Tunable thresholds — a new album starts when EITHER is exceeded.
// 24h keeps a day-or-overnight in one place together (an overnight trip is one
// album); a real multi-day break or a 50km location jump starts a new album.
const TIME_GAP_MS = 24 * 60 * 60 * 1000; // 24 hours
const DISTANCE_GAP_KM = 50;

// Distance between two lat/lon points in km (haversine).
function distanceKm(a, b) {
  const R = 6371;
  const toRad = (d) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLon = toRad(b.lon - a.lon);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

const hasCoords = (e) => typeof e.lat === 'number' && typeof e.lon === 'number';

// True when `curr` belongs to a new album relative to the previous moment.
function isBoundary(prev, curr) {
  if (curr.capturedAt - prev.capturedAt >= TIME_GAP_MS) return true;
  if (hasCoords(prev) && hasCoords(curr) && distanceKm(prev, curr) >= DISTANCE_GAP_KM) {
    return true;
  }
  return false;
}

// The most common non-null place in a group (ties → the earliest occurrence).
function dominantPlace(moments) {
  const counts = new Map();
  for (const m of moments) {
    if (m.place) counts.set(m.place, (counts.get(m.place) || 0) + 1);
  }
  let best = null;
  let bestN = 0;
  for (const [place, n] of counts) {
    if (n > bestN) {
      best = place;
      bestN = n;
    }
  }
  return best;
}

// entries -> [{ id, place, dateLabel, moments }], albums newest-first, moments
// within each album newest-first. Undated moments become a final section.
export function groupIntoAlbums(entries) {
  const timed = entries.filter((e) => e.capturedAt instanceof Date);
  const undated = entries.filter((e) => !(e.capturedAt instanceof Date));

  // chronological, to walk the gaps
  const chrono = [...timed].sort((a, b) => a.capturedAt - b.capturedAt);

  const groups = [];
  for (const e of chrono) {
    const last = groups[groups.length - 1];
    if (!last || isBoundary(last[last.length - 1], e)) groups.push([e]);
    else last.push(e);
  }

  const albums = groups.map((moments) => {
    const start = moments[0].capturedAt;
    const end = moments[moments.length - 1].capturedAt;
    return {
      id: moments[0].id,
      place: dominantPlace(moments),
      dateLabel: formatDateRange(start, end),
      // newest-first within the album (consistent with the flat grid)
      moments: [...moments].reverse(),
    };
  });

  // newest album first
  albums.reverse();

  if (undated.length) {
    albums.push({
      id: 'undated',
      place: null,
      dateLabel: 'Undated',
      moments: undated, // already newest-first from getAllEntries
    });
  }

  return albums;
}

// re-exported for any caller that wants the single-day label
export { formatDate };
