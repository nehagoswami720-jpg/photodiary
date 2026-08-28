// Browsers can read HEIC metadata but can't decode HEIC pixels for display.
// This converts a HEIC/HEIF file to a displayable JPEG blob, entirely on-device
// (photos never leave the device). The converter is heavy, so it's imported
// dynamically — only loaded when a HEIC actually appears.
//
// Non-HEIC files pass straight through. On any conversion failure we return the
// original (the card still shows its data; only the thumbnail may be blank).
export function isHeic(file) {
  return /heic|heif/i.test(file.type) || /\.hei[cf]$/i.test(file.name);
}

export async function toDisplayBlob(file) {
  if (!isHeic(file)) return file;
  try {
    const heic2any = (await import('heic2any')).default;
    const out = await heic2any({ blob: file, toType: 'image/jpeg', quality: 0.9 });
    return Array.isArray(out) ? out[0] : out;
  } catch {
    return file;
  }
}
