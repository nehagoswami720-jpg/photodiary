// Group moments into albums by LOCATION only — one album per place. Pure
// arithmetic on the place every entry already stores. Honest by construction:
// only the recorded place is used; nothing is invented. Time is not a grouping
// factor (each moment still shows its own date + time on its card).

// The moment used to order/represent an album: its most recent point in time.
function recencyOf(m) {
  return (m.capturedAt instanceof Date ? m.capturedAt.getTime() : 0) || m.createdAt?.getTime?.() || 0;
}

// entries -> [{ id, place, moments }], one per place, most-recent place first;
// moments within an album newest-first. Moments with no place collect in a
// final "No location" section.
export function groupIntoAlbums(entries) {
  const byPlace = new Map(); // place -> moments[]
  const noPlace = [];

  for (const e of entries) {
    if (e.place) {
      if (!byPlace.has(e.place)) byPlace.set(e.place, []);
      byPlace.get(e.place).push(e);
    } else {
      noPlace.push(e);
    }
  }

  const albums = [...byPlace.entries()].map(([place, moments]) => ({
    id: place,
    place,
    // newest-first within the album (consistent with the flat grid)
    moments: [...moments].sort((a, b) => recencyOf(b) - recencyOf(a)),
  }));

  // most-recently-visited place first
  albums.sort((a, b) => recencyOf(b.moments[0]) - recencyOf(a.moments[0]));

  if (noPlace.length) {
    albums.push({
      id: 'no-location',
      place: null,
      title: 'No location',
      moments: noPlace, // already newest-first from getAllEntries
    });
  }

  return albums;
}
