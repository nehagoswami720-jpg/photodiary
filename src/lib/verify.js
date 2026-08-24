// Headless proof of the engine (run: `npm run verify`).
//
// It feeds the pipeline the real coordinates + timestamps observed in the
// Phase 0 probe and prints the finished cards. This exercises timezone +
// online geocoding + place formatting + card assembly for real — no UI, no
// photo file needed. (exif.js itself was validated by the Phase 0 probe, which
// used the same exifr call.)
import { buildCard } from './card.js';

const cases = [
  {
    label: 'Chicago (iPhone, Dec 2025)',
    data: { capturedAt: new Date(2025, 11, 26, 15, 16), offset: '-06:00', lat: 41.87848, lon: -87.62231, source: 'exif' },
    expect: 'Chicago, Illinois · Friday · 26 December 2025 · 3:16 PM',
  },
  {
    label: 'New York (iPhone, Aug 2026)',
    data: { capturedAt: new Date(2026, 7, 22, 20, 11), offset: '-04:00', lat: 40.70353, lon: -73.99552, source: 'exif' },
    expect: 'New York City, New York · Saturday · 22 August 2026 · 8:11 PM',
  },
  {
    label: 'Stripped photo (WhatsApp/screenshot) -> manual-entry case',
    data: { capturedAt: null, offset: null, lat: null, lon: null, source: 'exif' },
    expect: 'all fields null — app should offer manual entry',
  },
];

const line = (card) =>
  [card.place, card.weekday, card.date, card.time].filter(Boolean).join(' · ') || '(nothing — honest empty)';

console.log('\nPhotodiary engine — verification\n' + '='.repeat(40));
for (const c of cases) {
  const card = await buildCard(c.data, { homeCountry: 'US' });
  console.log(`\n▸ ${c.label}`);
  console.log(`  card:   ${line(card)}`);
  console.log(`  expect: ${c.expect}`);
  console.log(`  zone:   ${card.zone ?? '—'}   offset: ${card.offset ?? '—'}   source: ${card.source}`);
}
console.log('\n' + '='.repeat(40));
console.log('If the card lines match the expectations above, the engine is proven.\n');
