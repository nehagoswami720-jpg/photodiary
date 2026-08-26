# 06 · Decision Log

Every meaningful scope and architecture decision, with the reasoning behind it.
This is the record of *why* the product is shaped the way it is — and the
scoping discipline that made it stronger at each step.

Format: **Decision · Context · Choice · Why.**

---

### D1 — Plan the whole product before writing any code

- **Context:** The idea is simple, but the risk was discovering hidden
  complexity mid-build and abandoning the project.
- **Choice:** Do a thorough end-to-end plan first — risks, tests, dependencies,
  fallbacks, staged versions — before a single line of code or pixel of design.
- **Why:** Cheap to change a plan, expensive to change a half-built app. The
  plan's Step One is *running tests*, not building UI.

---

### D2 — Cut weather, sunset, and moon from v1

- **Context:** The original concept showed historical weather, sunset time, and
  moon phase for the photo's day and place.
- **Choice:** v1 extracts only **location, weekday, date, and time** — all from
  the photo's own EXIF. Weather/sunset/moon are deferred to v3 as opt-in
  enrichment.
- **Why:** Historical weather is real but *gridded and hourly* — it can be
  accurate yet *feel* wrong ("it says clear, but I remember rain"). For a
  product whose entire promise is honesty, a real-but-wrong-feeling fact is the
  most damaging failure mode. Cutting weather deleted the single scariest risk
  and removed the only hard-network dependency. Sunset/moon were pure-offline
  and harmless, but dropped alongside to keep v1 to one idea.

---

### D3 — Privacy boundary: coordinates may leave the device

- **Context:** To turn GPS into a place name, the coordinates + date must go to
  a third-party service. The photo file itself never leaves.
- **Choice:** Accepted that coordinates may leave for place naming, without a
  mandatory in-UI disclosure.
- **Note / open thread:** A soft recommendation was raised to disclose it in an
  "about" footer, since the product's pitch is radical honesty. Deferred to the
  online-vs-offline naming decision (D7) — if offline naming wins, no coordinate
  ever leaves and the question is moot.

---

### D4 — Persistence: it's a diary, not a one-shot tool

- **Context:** Should a dropped photo's card persist, or vanish after viewing?
- **Choice:** Entries persist in IndexedDB and reappear on reopen.
- **Why:** A diary is something you return to. Persisting also establishes the
  entry record that v2's albums are built on — no rewrite later.

---

### D5 — Missing data → manual entry, not decline

- **Context:** Many shared/screenshotted photos have no EXIF date or GPS.
- **Choice:** Offer inline manual entry (type the place / date), then build a
  real card from it — all on one screen.
- **Why:** Keeps the app useful on any photo without inventing anything (the
  user supplies the truth). `source: 'manual'` records the origin.

---

### D6 — Simplify v1 to four data points

- **Context:** After D2, the card is location + weekday + date + time.
- **Choice:** Lock exactly these four. No additional fields in v1.
- **Why:** Smallest honest, complete card. Three of the four come straight off
  the photo with zero network; only place naming has any dependency.

---

### D7 — Place naming: decide online vs. offline after testing

- **Context:** Location is the only data point that isn't already on the photo
  in human-readable form. Two approaches: an **offline** bundled city dataset
  (nearest city, zero network, zero leak, coarser) or an **online** geocoding
  API (precise, but a network call and a coordinate leaving the device).
- **Choice:** Defer to Phase 0 — test both against real coordinates and pick by
  actual name quality. Offline wins ties.
- **Why:** The right call depends on how the names actually read for the user's
  real photos. Offline would also make the app fully self-contained and retire
  D3's privacy question entirely.

---

### D8 — Web only; no mobile in v1

- **Context:** Briefly considered supporting mobile (as a PWA).
- **Choice:** Desktop web only for v1.
- **Why:** Mobile introduced three real complexities — the iOS file picker can
  mangle/strip photo metadata, mobile Safari can evict IndexedDB after ~7 days,
  and PWA install/offline machinery — none of which serve the core question of
  whether the honest card works. Dropping mobile removed all three at once. Can
  be revisited later on the proven core.

---

### D9 — PWA / native rejected for v1

- **Context:** How to reach "mobile" if wanted.
- **Choice:** Would have been a responsive PWA (one codebase), never React
  Native / Capacitor. Then mobile was cut entirely (D8).
- **Why:** A second toolchain multiplies files and complexity for a
  vibe-coding designer, with no v1 benefit. Superseded by D8.

---

### D10 — Engine-first, UI-last build order

- **Context:** Where to start once Phase 0 passes.
- **Choice:** Build the pure-function engine (no UI) before any screen or
  design; don't design a pixel until the engine works exactly as intended.
- **Why:** The whole product's credibility is the data pipeline. Proving it in
  isolation de-risks everything downstream and keeps the honest logic separate
  from presentation.

---

### D11 — Documentation-first git history

- **Context:** The project doubles as portfolio material.
- **Choice:** Initialize git with a pure-docs first commit capturing the full
  plan and this decision log, before any application code.
- **Why:** The scoping story (cutting weather, then mobile — and getting
  *stronger* each time) is the case study. Committing it preserves the
  reasoning, not just the result.

---

### D12 — Phase 0 passed: the idea holds on real photos

- **Context:** The gate — run the throwaway probe on the user's own realistic
  photos before any design or engine work.
- **Result (2026-08-23):** Of 9 dropped files, **7/7 genuine iPhone camera-roll
  photos kept both EXIF date and GPS**; the 2 misses were a WhatsApp forward and
  a screenshot (not real captures). Every camera photo also carried an offset
  tag *and* resolved to the correct timezone via GPS, and reverse-geocoded to
  the right city.
- **Choice:** Proceed to Phase 1 (the engine).
- **Why:** **R1** (EXIF survival — the scariest risk) and **R5** (timezone
  correctness) are effectively retired. Manual entry is confirmed as a genuine
  *fallback*, not the hero flow.
- **Open items carried forward:** HEIC was untested (all files arrived as JPEG)
  — kept as a low-priority open risk; persistent storage was not auto-granted on
  localhost — Phase 3 needs a small strategy; library duplicates noted for v2
  import.

---

### D13 — Online geocoding locked for v1 (resolves D7)

- **Context:** D7 deferred online-vs-offline place naming to Phase 0 evidence.
- **Choice:** Use the **online** geocoder (BigDataCloud client endpoint) for v1.
- **Why:** It worked well on real coordinates, names read cleanly, and D3
  already accepts coordinates leaving the device for naming. Simplest path to a
  shipped v1. A fully-offline city dataset can be revisited later without
  changing the product.

---

### D14 — Place-name format: smart local-vs-abroad

- **Context:** The geocoder returns city + region + country, but a raw dump
  ("Chicago, Illinois, United States of America (the)") is too busy and ugly for
  a quiet card.
- **Choice:** Format smartly — **domestic → "City, Region"** (Chicago,
  Illinois); **foreign → "City, Country"** (Lisbon, Portugal). Strip ISO
  artifacts like "(the)".
- **Why:** Reads the way a person would actually say where a photo was taken,
  and keeps the card calm.

---

## Phase 2 — building the screens from Figma

Figma file: the "V2 Designs" page. It has **no published variables**, so all
tokens are raw literals lifted directly from the design. Colors, fonts, weights,
and the key letter-spacings are used **exactly**; the deviations below are all
deliberate, made together in chat.

### D15 — Scale the UI down for real browser viewports

- **Context:** The Figma frames are 1728×1117 — far larger than a browser
  window, so elements rendered oversized.
- **Choice:** Scale the empty state down (upload box 868×465 → 620×340, camera
  300×171 → 210×120, body text 36 → 24px) and **pin the title 48px from the top**
  instead of Figma's vertically-centered position. Then scale the loading /
  success / error screens to match (bar width 684 → 620, status text 20 → 18px).
- **Why:** The designer asked for it on the empty state, then approved carrying
  the same scale through the other screens for consistency. Exact Figma sizes
  would have looked oversized next to the resized empty state.

### D16 — Body font: system Helvetica stack (real Helvetica on Mac)

- **Context:** The design uses Helvetica, which is proprietary and can't be
  legally bundled as a web font.
- **Choice:** Use the stack `"Helvetica Neue", Helvetica, Arial` (weight 300 =
  Light, 400 = the button's Regular). Verified in-browser that this renders
  genuine Helvetica Neue on macOS; non-Mac visitors fall back to Arial.
- **Why:** It IS real Helvetica for the designer and every Mac/iOS visitor, at
  zero cost. Guaranteeing Helvetica everywhere would need a paid Monotype web
  license — deferred as overkill for v1.

### D17 — Slimmer progress bar

- **Choice:** Progress bar height 12px → **8px** across loading / success / error.
- **Why:** The designer asked to slim it; reads more refined.

### D18 — Calm, self-authored motion (not in the Figma)

- **Context:** The Figma frames are static; motion was designed in chat.
- **Choices:** MOMENTS wordmark — per-letter blur-fade entrance + a ~7s
  breathing loop. Loading status text — cycles phrases on a slow independent
  loop, each rising up from below with a soft crossfade, plus a dark "thinking"
  shimmer (dark sweep because the base gray is already light) and blinking dots.
  Success — bar eases black→green in place, confetti launches upward off the
  bar. Error — bar eases black→red in place. **All honor
  `prefers-reduced-motion`.**
- **Why:** The product's whole feel is "quiet and calm"; motion had to match.

### D19 — The error state emerges from the real flow

- **Context:** The Figma error frame is static at 25%.
- **Choice:** A dropped non-photo goes through the loading flow; a genuine
  image-validity check (`createImageBitmap`) runs, and the bar stops and turns
  red at the **actual % it had reached** at detection (varies run to run), not a
  hardcoded number. HEIC is treated as valid (real photo, metadata readable even
  when it can't be decoded for display).
- **Why:** A static instant error isn't how a real interrupted upload behaves.

### Spacing snapped to exact Figma ratios

Two values were briefly eyeballed, then recomputed to the exact proportional
values from Figma:
- Empty-state inner padding: Figma `px-40 py-50` scaled to the 620×340 box →
  `28.57px` / `36.56px`.
- Error button offset below the bar: Figma `gap-64` × (620/684 bar ratio) →
  `58px`.

### D20 — The hero card

- **Context:** After success, show the single photo's card. Uses the Figma
  "Card component" — which introduces two new fonts (**Mulish** for the place,
  **Newsreader** for date/time) as a deliberate contrast to the app's DM
  Serif / Helvetica.
- **Tokens (per the updated component):** place Mulish Medium 20px #2f2f2f
  −0.6px; date Newsreader Light Italic 16px #959595 −0.48px; time Newsreader
  Light 16px #959595 −0.48px.
- **Image:** shown at its natural aspect, never cropped, sized to reflect the
  original and vary per photo, capped to `min(520px, 92vw)` wide × `62vh` tall.
- **Place honesty:** the detected city, or the line is omitted entirely — never
  raw coordinates. Missing date/time are likewise omitted (just the photo).
  Verified on real photos: Chicago / NYC detect correctly; GPS-less shots show
  photo-only.
- **No text may cross the photo edges:** the caption row is constrained to the
  image's measured rendered width (`ResizeObserver`), and the place name wraps
  within it on tall/narrow photos rather than bleeding out.
- **Transition:** success beat breathes ~1.8s, then the card fades/rises in.

### D21 — Manual entry, screen 1: the invitation

- **Context:** When a photo's place can't be detected, the fallback is manual
  entry. First screen is the invitation (Figma 136:277).
- **Trigger:** after the success beat, if `place` is null → show the invitation
  instead of the card (if place is detected → straight to the card).
- **Choices:** photo shown uncropped but smaller than the hero card (fits the
  composition); type **scaled ~0.75×** to match the app's density (title 24px,
  description 15px, "Add the details" 18px reusing the error button's treatment,
  "Skip" 15px, 36px gaps). We briefly tried the exact Figma tokens (32/20/24/20,
  48px gaps) but the designer preferred the scaled version. Copy verbatim from
  the design.
- **Wiring:** "Skip" → the photo-only card. "Add the details" → the entry form
  (screen 2). Preview: `?state=manual`.

### D22 — Manual entry, screen 2: the form

- **Context:** The form (Figma 136:301) — photo + "add a place" / "date" /
  "time" + Submit — lets the user supply what the photo didn't carry.
- **Native date & time pickers (not free-text).** Parsing a typed date like
  "07/08/2026" is ambiguous and could store the *wrong* date — an honesty
  violation. Native `<input type="date/time">` guarantees the value is exactly
  what the user picked. Trade-off: they don't match the design's italic
  "date"/"time" placeholders pixel-for-pixel (format hint + small picker icon).
  Place stays a text field with the italic "add a place" placeholder.
- **All fields optional** — only what's entered is shown (nothing invented). A
  date without a time shows the date and hides the time (`showTime` flag on the
  Card). Submit with nothing → just the photo.
- **Scaled** to match the invitation (Submit reuses the shared button treatment).
  Preview: `?state=form`. Verified: Paris / 2026-08-26 / 14:30 →
  "Paris, France · Wednesday, 26th August 2026 · 2.30 pm".

### D23 — Custom date & time pickers (replace native)

- **Context:** The native pickers were reliable but their browser chrome
  (mm/dd/yyyy, calendar/clock icons) clashed with the minimal aesthetic and
  can't be restyled.
- **Choice:** Build self-contained custom pickers (`components/DateField.jsx`,
  `TimeField.jsx`) — no library. Same value shape (`YYYY-MM-DD` / `HH:MM`), so
  the honest data path is unchanged. Calendar popover (month nav, today marked,
  black selected day); time popover with hour/minute/AM-PM columns (black-pill
  selection, hidden scrollbars, selected row centered on open). Both fade+rise
  in (`.picker-pop`), flip upward when there's no room below, close on
  outside-click, and honor `prefers-reduced-motion`.
- **Field styling (chosen by designer):** the place/date/time fields are
  soft-filled rounded pills (light-grey, hover-highlight) with small line icons
  (pin / calendar / clock) and a caret that rotates open — replacing the bare
  underlines.

### D24 — Persistence (IndexedDB) — the diary survives reloads

- **Context:** The last v1 item. Entries must persist so it's a real diary (and
  it's the data spine v2 albums sort).
- **Storage:** `lib/db.js` — one IndexedDB store of entries
  `{ id, photoBlob, place, capturedAt, showTime, lat, lon, source, createdAt }`.
  The photo is stored as a Blob so the card can be re-rendered on reload.
- **Reload behaviour (Option A):** on load, show the most-recent entry's card.
  A quiet "+ add another" under the card starts a new photo; earlier entries
  stay saved (browsing all of them = the v2 gallery).
- **Saved at every card-entry point:** EXIF card, manual submit, and "Skip"
  (photo-only). Best-effort — the app still works if storage fails.
- **`navigator.storage.persist()`** requested on save so the browser is less
  likely to evict the diary (granted based on engagement; fine if not).
- Verified: drop a photo → reach a card → reload → the card comes back.

---

## v2 — the gallery

### D25 — The gallery grid (v2, first iteration)

- **Context:** v2 makes the app a browsable diary. Scope agreed: a **flat
  masonry grid of all moments** (no album grouping yet), the grid is "home",
  tapping a grid moment does nothing this iteration.
- **Why it's a light build:** everything is read from the entries v1 already
  persists — no new dependencies, no backend, no grouping algorithm.
- **Screens/nav:** app opens to `Gallery` (or the drop zone if empty).
  "+ add a moment" (floating button) → the existing upload flow → card reveal →
  "← back to moments" returns to the grid (now including the new moment).
- **Grid:** CSS multi-column masonry (2 cols / 3 wide), newest first; each cell
  is `MomentCard` (photo at column width + place/date/time, honest omissions).
  A fixed bottom **fade** so the grid reveals as you scroll. Object URLs per
  blob, revoked on unmount.
- **Reuse:** shared `lib/format.js` (date/time) across the hero card and the
  grid cell; `getAllEntries()` added to `lib/db.js`.
- **Deferred:** album grouping by time+location gaps, and a detail view when
  tapping a grid moment.

### D26 — Gallery refinements (designer feedback)

- **No card-reveal step:** after an upload, the app drops **straight into the
  updated gallery** (no single-card reveal / "back to moments"). The hero
  `Card` is now used only for the `?state=card` preview and a future
  tap-to-open detail view.
- **Spacing tokens (from the designer):** 24px between columns, 48px between
  rows (`MomentCard` margin), 128px from the title to the grid.
- **Button:** matches the Figma — a rectangular #111 button with a plus icon,
  "Upload a moment" (was a rounded pill).
- **Softer fade:** the bottom fade is a gentle `white → transparent` (was a
  hard, mostly-opaque band).
