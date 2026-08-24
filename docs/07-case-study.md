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

## The narrative arc — scoping as a design skill

The most portfolio-worthy thread: **three deliberate cuts, each making the
product better, not weaker.**

1. **Cut historical weather.** It was the emotional centerpiece of the original
   pitch — but gridded, hourly reanalysis data can be accurate yet *feel*
   wrong. Cutting it deleted the single scariest risk and removed the only hard
   network dependency. *(Decision D2.)*
2. **Cut mobile.** Chasing "works on mobile too" dragged in three real
   complexities (metadata-stripping file pickers, storage eviction, PWA
   machinery) that had nothing to do with proving the core idea. Cutting it
   removed all three at once. *(Decision D8.)*
3. **Cut to four data points.** Location, weekday, date, time — three of which
   come straight off the photo with zero network. The smallest card that is
   still complete and honest. *(Decision D6.)*

**The takeaway line:** *Every time the scope got smaller, the product got more
honest — and more buildable.*

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
