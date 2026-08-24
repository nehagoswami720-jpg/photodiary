import exifr from 'exifr';

// Read the honest facts a photo carries in its EXIF metadata.
//
// Everything is returned as-is or as null — this function NEVER guesses. If a
// value isn't in the file, it comes back null and the rest of the app treats
// that absence honestly (offer manual entry, show nothing — never invent).
//
// The datetime is the photo's LOCAL wall-clock at the moment of capture (that's
// how cameras store it), so its calendar/clock components are what we display.
export async function readPhotoData(file) {
  let meta = {};
  try {
    meta = (await exifr.parse(file, { tiff: true, ifd0: true, exif: true, gps: true })) || {};
  } catch {
    meta = {};
  }

  const captured = meta.DateTimeOriginal || meta.CreateDate || meta.ModifyDate || null;
  const lat = typeof meta.latitude === 'number' ? meta.latitude : null;
  const lon = typeof meta.longitude === 'number' ? meta.longitude : null;

  return {
    capturedAt: captured instanceof Date && !isNaN(captured) ? captured : null,
    offset: meta.OffsetTimeOriginal || null, // e.g. "-06:00", when the camera recorded it
    lat,
    lon,
    camera: [meta.Make, meta.Model].filter(Boolean).join(' ') || null,
    source: 'exif',
  };
}
