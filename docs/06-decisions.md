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
