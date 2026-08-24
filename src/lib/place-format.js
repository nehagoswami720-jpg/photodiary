// Turn a raw geocoder result into a calm place string (decision D14).
//
//   Domestic  -> "City, Region"   e.g. "Chicago, Illinois"
//   Abroad    -> "City, Country"  e.g. "Lisbon, Portugal"
//
// "Domestic" means the photo's country matches the viewer's home country, which
// the caller passes in (detected from the browser). When home is unknown, we
// fall back to "City, Country" — universal and matching the original vision.
//
// Also strips ISO artifacts like the trailing "(the)" in
// "United States of America (the)".
export function formatPlace(geo, homeCountryCode = null) {
  if (!geo) return null;

  const city = clean(geo.city);
  const region = clean(geo.principalSubdivision);
  const country = clean(geo.countryName);

  const isDomestic =
    homeCountryCode && geo.countryCode && geo.countryCode === homeCountryCode;

  const tail = isDomestic ? region || country : country || region;
  const label = [city, tail].filter(Boolean).join(', ');

  return label || city || tail || null;
}

function clean(s) {
  if (!s) return null;
  return s.replace(/\s*\(the\)\s*$/i, '').trim() || null;
}
