# 09 · Build Log

Where the implementation actually stands. (Decisions and their reasoning live in
`06-decisions.md`; this is the "what exists" snapshot.)

## Deployed

- Live (stable alias): **https://photodiary-eight.vercel.app**
- Redeploy: `vercel --prod --yes`. Repo: github.com/nehagoswami720-jpg/photodiary

## Phase 1 — the engine (done)

Pure functions in `src/lib/`, proven headlessly via `npm run verify`:
`exif.js` (read honest facts, never guess) · `timezone.js` (offline zone from
GPS) · `geocode.js` (online BigDataCloud) · `place-format.js` (smart
local/abroad) · `card.js` (assemble; null / coarse coords on failure, never
invented).

## Phase 2 — the screens (in progress)

Structure: `App.jsx` is the screen state machine + the upload/processing flow.
`components/Wordmark.jsx` (the animated MOMENTS, rendered once so it persists
across screens). Screens in `src/screens/`.

| Screen | File | Status |
|--------|------|--------|
| Empty / resting | `EmptyState.jsx` | ✅ done — dashed upload box, camera SVG |
| Loading | `Loading.jsx` | ✅ done — real % + animated "thinking" status text |
| Success | `Success.jsx` | ✅ done — green bar + upward confetti |
| Error | `ErrorState.jsx` | ✅ done — red bar at real detection %, retry button |
| **The card (hero)** | — | ⏳ next |
| Manual entry | — | ⏳ to build (2 Figma frames) |

Flow wired: empty → loading → success (holds; card wires in here) · and
empty → loading → error for unreadable files.

### Testing the hard-to-reach states

- **Error:** drag a non-image file (PDF/txt) onto the box — the picker filters
  to images, but drag-drop doesn't. Or open `?state=error` for a static preview.
- **Success preview:** `?state=success`.

### Fidelity to Figma

Colors, fonts, weights, and letter-spacings are exact. Sizes/positions differ
only where chat-agreed: the viewport scale-down (D15), slimmer bar (D17),
top-pinned title (D15). Motion (D18) and the dynamic error (D19) were authored
beyond the static frames. See `06-decisions.md` D15–D19.

## v1 complete + v2 gallery (first iteration)

All screens built + wired, and **persistence (IndexedDB) done** — the diary
survives reloads (most-recent card returns; "+ add another" for a new photo).
Engine proven, deployed on Vercel. The v1 "done" checklist in `01-v1-spec.md`
is fully met.

## Still open (minor / v2)

- HEIC display: SOLVED (convert to JPEG on-device via heic2any, D28).
- Persistent-storage grant depends on browser engagement (requested; best-effort).
- v2: the albums/gallery view, and the design-system pass (below).

## Deferred to v2 — design-system pass

Each screen was scaled to feel right on its own, so the scale factors drift and
there is no unified system yet:

| Screen(s) | Scale vs Figma |
|-----------|----------------|
| Empty state | ~0.7× (designer-requested) |
| Loading / success / error | ~0.9× |
| Hero card | exact component tokens |
| Manual-entry invitation | ~0.75× |

**v2 task:** define one type scale + spacing scale + a shared button/token set,
then reconcile every screen to it. Deliberately deferred — better done once all
screens exist and can be seen together than reconciled mid-build.
