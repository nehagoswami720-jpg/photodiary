// One stable object URL per photo, for the whole session.
//
// Why this exists: the 3D canvas (drei `useTexture`) caches GPU textures keyed by
// the image URL string. If we minted a fresh `URL.createObjectURL` on every album
// open / delete (as we used to), every navigation created new textures and the old
// ones were never freed — GPU memory climbed and the app progressively stuttered.
// Keying the URL by the entry id means the same string is reused, so exactly one
// texture exists per photo and it's reused across screens. URLs are revoked only
// when a photo is actually deleted; everything clears on page reload anyway.
const cache = new Map(); // entryId -> objectURL

export function photoUrl(entry) {
  if (!(entry?.photoBlob instanceof Blob)) return undefined;
  let url = cache.get(entry.id);
  if (!url) {
    url = URL.createObjectURL(entry.photoBlob);
    cache.set(entry.id, url);
  }
  return url;
}

export function revokePhotoUrl(id) {
  const url = cache.get(id);
  if (url) {
    URL.revokeObjectURL(url);
    cache.delete(id);
  }
}
