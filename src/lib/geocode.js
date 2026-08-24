// Turn GPS coordinates into a place, using the online BigDataCloud endpoint
// (locked for v1 in decision D13 — no API key, CORS-friendly).
//
// This is the ONE place a coordinate leaves the device (the photo never does).
// Returns the raw geo pieces, or null on any failure — the caller then falls
// back to coarse coordinates, never to an invented place.
export async function reverseGeocode(lat, lon) {
  if (typeof lat !== 'number' || typeof lon !== 'number') return null;

  const url =
    'https://api.bigdatacloud.net/data/reverse-geocode-client' +
    `?latitude=${lat}&longitude=${lon}&localityLanguage=en`;

  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const j = await res.json();
    return {
      city: j.city || j.locality || null,
      principalSubdivision: j.principalSubdivision || null,
      countryName: j.countryName || null,
      countryCode: j.countryCode || null,
    };
  } catch {
    return null;
  }
}
