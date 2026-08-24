import tzlookup from 'tz-lookup';

// Derive the IANA timezone (e.g. "America/Chicago") from GPS coordinates,
// entirely offline. In Phase 0 this agreed with every photo's own offset tag,
// so it's a trustworthy confirmation of where/when the photo was taken.
//
// Returns null when there are no coordinates or the point isn't found
// (e.g. mid-ocean) — never a guess.
export function zoneFromCoords(lat, lon) {
  if (typeof lat !== 'number' || typeof lon !== 'number') return null;
  try {
    return tzlookup(lat, lon);
  } catch {
    return null;
  }
}
