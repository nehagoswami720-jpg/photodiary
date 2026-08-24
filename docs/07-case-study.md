# 07 · Case Study Notes

Raw narrative material for the portfolio case study. Not final copy — a
structured store of the story, the tension, and the artifacts, ready to shape
into a written or visual case study.

---

## One-line positioning

> A photo diary that never lies. It shows only what your photos already
> know — the real place, day, and time — and nothing it can't prove.

## The problem

Photo libraries have become silent, searchable piles. The *context* every
photo already carries — the exact day of the week, the place, the moment — is
locked away in metadata no one reads. Most "smart" photo products respond by
*adding* things: AI captions, generated highlights, invented narratives. That
trades away trust.

## The insight

The meaning is already *in the photo*. You don't need to invent anything — you
need to make what's already true legible and calm. Restraint is the feature.

## The design tension (the heart of the case study)

**Honesty vs. richness.** A richer card (weather, sunset, moon) is more
impressive but risks showing something real that *feels* wrong — which, for a
product built on trust, is worse than showing less. The entire project is a
series of choices that pick **honesty over impressiveness**, and the product
gets *stronger* each time it does.

## The riskiest assumptions we surfaced

Before any design, we listed the assumptions that — if false — mean the app
doesn't work, ranked by danger. This is the **full original picture**, before
the simplifications below shrank it. It's the evidence of rigor: the product
was pressure-tested on paper before a pixel was drawn.

| # | Assumption (if false, the app breaks) | Why it was scary |
|---|----------------------------------------|------------------|
| **R1** | Real camera-roll photos still carry **EXIF date + GPS** when they reach a browser | Sharing / screenshots / downloads strip it. If most real photos are bare, manual entry becomes the *main* flow — a different product. |
| **R2** | We can **read EXIF from HEIC** (Apple's default) in-browser | Browsers can't *display* HEIC without a heavy converter; had to confirm the card works even when the thumbnail can't. |
| **R3** | Historical **weather** is accurate *and feels true* | Reanalysis data is gridded (~10–25 km) and hourly — it can be right yet *feel* wrong. For a trust product, that's the worst failure mode. |
| **R4** | GPS reliably becomes a **nice place name** ("Lisbon") | The one external dependency; degrades to ugly coordinates if unhandled. |
| **R5** | We can get the **timezone right** for time + weekday | EXIF time is local wall-clock with no zone. Wrong zone = wrong "6:12" / "Tuesday" = an honesty violation. |
| **R6** | **IndexedDB** won't silently evict the diary | Browsers drop local storage under pressure; a diary that loses entries is heartbreaking. |
| **R7** | One quiet card actually **feels meaningful** | A design/emotional risk, not technical — cheapest to test on paper before code. |

And when we *briefly* considered mobile, two more risks appeared: mobile file
pickers that mangle or strip metadata, and mobile Safari evicting IndexedDB
after ~7 days. Every risk was paired with the smallest throwaway test that
would settle it — see `03-risks-and-tests.md`.

## How the designer drove the simplification

The turning point of the process was the **client making sharp product calls
that collapsed the risk table above.** This was collaboration, not dictation —
the plan got smaller and safer because of the designer's instincts, not in
spite of them. Each call, and what it bought:

- **"Extract only location, day, date, and time."** One decision killed **R3**
  entirely (weather), removed the only hard-network dependency, and cut the
  card to its honest essentials. *(→ D6, D2)*
- **"Web only — no mobile app."** Erased the two mobile-specific risks
  (metadata-stripping pickers, 7-day storage eviction) and all PWA machinery in
  a single stroke. *(→ D8)*
- **"Manual entry as the fallback."** Turned the scariest technical risk
  (**R1**, stripped EXIF) from a dead end into a graceful path — the user
  supplies the truth, the app still never invents it. *(→ D5)*
- **"Save it — it's a diary."** Committed to persistence, which also quietly
  established the data model that makes v2 albums almost free. *(→ D4)*
- **"Decide place-naming after testing."** Refused to guess online-vs-offline in
  the abstract; deferred it to evidence from real photos. *(→ D7)*

**Before → after.** The risk surface shrank from **seven technical risks, plus
two mobile risks and a hard weather dependency**, down to **five contained
risks and a single, degradable place-naming dependency** — without losing the
core experience.

**The takeaway line:** *Every time the designer made the scope smaller, the
product got more honest — and more buildable.*

## Process to show

- **Plan before pixels.** No screen was designed until the risks were named and
  the data pipeline was proven. *(Decisions D1, D10.)*
- **De-risk with throwaway tests.** The plan's Step One is a disposable "probe"
  that checks, on the user's *own real photos*, whether EXIF date + GPS even
  survive to the browser — before any UI. *(See `03-risks-and-tests.md`.)*
- **Honest by construction.** The architecture returns *nothing* rather than a
  guess, and tags every fact with its source (`exif` vs `manual`). *(See
  `05-architecture.md`.)*

## Artifacts to include in the case study

- The final card mockup: `Lisbon, Portugal · Tuesday, 3 June 2016 · 6:12 PM`.
- The risk table and the decision log (`03`, `06`) — evidence of rigor.
- A before/after of scope: the original rich concept vs. the disciplined v1.
- The roadmap ladder (`02`) — showing vision beyond v1 without over-building it.

## Metrics / definition of success (for the write-up)

Success for v1 is not downloads — it's the "done" checklist in `01-v1-spec.md`
being fully verifiable, and every fact on every card being provably real.

## Open threads to revisit as the build proceeds

- Phase 0 results: did EXIF survive on real photos? (Could reshape the hero
  flow toward manual entry.)
- Online vs. offline place naming (D7) — and whether offline naming retires the
  privacy question (D3) entirely.
- Whether a small honesty disclosure belongs in the UI (D3 soft recommendation).
