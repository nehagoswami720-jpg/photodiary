# 05 · Architecture

The architecture exists to serve two goals: **stay honest by construction**,
and **let each version add screens without a rewrite**. It is intentionally
small.

## The entry record — the spine of every version

Everything is built around one stable shape, written once in v1 and never
outgrown:

```js
// One diary entry
{
  id,          // stable unique id
  photoBlob,   // the image bytes, stored locally (IndexedDB)
  capturedAt,  // the moment the photo was taken (UTC instant + original offset)
  lat,         // GPS latitude  (null if unknown)
  lon,         // GPS longitude (null if unknown)
  placeName,   // human-readable location ("Lisbon, Portugal")
  source,      // 'exif' | 'manual'  — where this entry's data came from
  createdAt,   // when the entry was added to the diary
}
```

**Why `capturedAt` stores both a UTC instant and the original offset:** it lets
us show the *local* time the photo was actually taken (the honest thing) while
still being able to sort entries on a single global timeline (what v2 needs).

**Why `source` matters:** it records whether a value was read from the photo or
typed by the user — honesty is traceable, and the UI can treat the two
differently.

## The engine / UI split

Two clearly separated layers:

### 1. The engine — pure functions, no UI, no React

Small single-purpose modules, each in its own readable file:

```
photo file ─► exif.js      ─► { date, lat, lon }
                   │
                   ▼
             timezone.js    ─► local time + weekday (offline)
                   │
                   ▼
             geocode.js     ─► placeName   (online or offline — TBD Phase 0)
                   │
                   ▼
             card.js        ─► the finished card object
```

Each function takes data in and returns data out. No side effects, easy to
reason about, testable without a browser. This is where "boring code a designer
can change" is won.

### 2. The UI — React, thin

The screen(s) call the engine and render the result. State is minimal:
the current entry (or list), plus loading / empty / error / manual-entry
states. The UI never computes facts — it only displays what the engine
returns.

## Persistence

One small `db.js` wraps IndexedDB. It stores and lists entry records. On first
save it requests Persistent Storage so the diary survives browser cleanup.

## How this avoids painting v2 into a corner

Because every entry already stores `{ capturedAt, lat, lon }`, v2's
"auto-group into albums by time + location gaps" is **pure arithmetic on an
array we already have** — sort by time, cut on gaps. No schema change, no
re-processing of photos, no network, no AI. The corner-avoidance was designed
in from the first commit.

## How honesty is enforced structurally

- The engine returns `null` for anything it cannot determine truthfully; the UI
  renders nothing (or a manual-entry prompt) in that slot — never a guess.
- `source` tags every entry as `exif` or `manual`, so the origin of each fact
  is always known.
- In v3, machine-*inferred* labels are stored and styled separately from
  recorded facts, so the two are never confused.
