# 08 · Phase 2 UI Brief (for the Figma design)

The engine is done and proven. This brief is the bridge to design: it says
exactly **what data the screen has to work with** and **every state it must
cover**, so the Figma design maps 1:1 to implementation.

Constraints (unchanged): **one screen · desktop web · calm and honest.**

## The card data contract

`buildCard()` returns this object. Design against these real fields — any of
them can be `null`, and the design must handle absence gracefully (never a
placeholder that implies invented data).

```js
{
  place:    "Chicago, Illinois",   // or coarse coords "41.878, -87.622", or null
  weekday:  "Friday",              // or null
  date:     "26 December 2025",    // or null
  time:     "3:16 PM",             // or null
  source:   "exif",                // "exif" | "manual"  — provenance of the facts
  coords:   { lat, lon },          // or null
  zone:     "America/Chicago",     // or null
  offset:   "-06:00",              // or null
  wallClock:"2025-12-26T15:16:00", // or null
}
```

**Real examples to design with** (from actual test photos):

- `Chicago, Illinois · Friday · 26 December 2025 · 3:16 PM`
- `New York City, New York · Saturday · 22 August 2026 · 8:11 PM`
- Abroad would read `Lisbon, Portugal · …` (city, country)

## States the one screen must cover

1. **Empty / resting** — the drop zone, inviting a photo. The first thing seen.
2. **Loading** — photo accepted; reading EXIF + fetching the place name (a
   network hop). Brief, but needs a calm indicator.
3. **The card (happy path)** — place · weekday · date · time, with the photo.
   This is the hero moment; everything else is in service of it.
4. **Card with no thumbnail** — data is present but the image can't be displayed
   (e.g. HEIC). The card still shows; the image area needs a graceful stand-in.
5. **Partial card — geocode failed** — has date/time, place shows coarse
   coordinates instead of a city. Must not look broken; it's still true.
6. **No data → manual entry** — photo carried no date/GPS (WhatsApp, screenshot).
   Inline fields to type place and/or date, then it builds a real card. Stays on
   the one screen. Consider a subtle marker that this entry's facts are
   user-provided (`source: "manual"`).
7. **Error** — the file couldn't be read at all. Honest, quiet message; never a
   fabricated card.

## Design principles to hold

- **Honesty is visible.** Absent data reads as calm absence, not an error or a
  guess. A manual-entry card may carry a quiet "you added this" cue.
- **The card is the product.** Restraint over decoration. One quiet card.
- **This is a diary.** (Persistence + how past entries appear is Phase 3, but
  keep in mind the screen will eventually hold more than one moment.)

## Handoff → implementation

When the design is ready, share the Figma file URL (or specific frames). I'll
implement it via the Figma MCP, wired directly to the engine in `src/lib/`,
matching your layout and states. No engine logic changes to accommodate the UI —
the data contract above is fixed.
