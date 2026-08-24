# Photodiary

> Drop in a photo. See the quiet truth of when and where it happened.

Photodiary reads a photo's own recorded data — the EXIF timestamp and GPS
coordinates it was born with — and shows one calm card:

> **Lisbon, Portugal**
> Tuesday, 3 June 2016 · 6:12 PM

Nothing is invented. Nothing is AI-generated. Everything shown is real,
recorded data pulled from the photo itself. That honesty is the whole point.

## Two principles that never change

1. **Nothing is invented.** Every value shown is recorded data, or it is
   absent. When later versions add machine *organization*, the machine only
   sorts and retrieves — any guessed label is visibly marked as a guess and
   never presented as a recorded fact.
2. **Photos never leave the device.** No backend, no accounts, on-device
   storage only. The single point where this constraint would have to break
   (cross-device sync / sharing) is named in advance — never crossed by
   accident.

## Status

**Planning complete. No application code yet.** This repository currently
contains the full product plan and decision history. The first code written
will be a throwaway "Phase 0 probe" that tests, against real photos, whether
the core idea holds — before any UI or design work begins.

## Stack (planned)

React · Vite · Tailwind · IndexedDB · deployed on Vercel. Desktop web only
for v1. Few files, boring readable code — built to be understood and changed
by a designer, not just an engineer.

## Documentation

The thinking behind this product lives in [`docs/`](./docs):

| Doc | What it covers |
|-----|----------------|
| [00-vision.md](./docs/00-vision.md) | The product vision and the two principles |
| [01-v1-spec.md](./docs/01-v1-spec.md) | The locked v1 spec + verifiable "done" checklist |
| [02-roadmap.md](./docs/02-roadmap.md) | The version ladder: v1 → v2 → v3 → v4 |
| [03-risks-and-tests.md](./docs/03-risks-and-tests.md) | Riskiest assumptions, ranked, and the cheap tests that settle them |
| [04-dependencies.md](./docs/04-dependencies.md) | Every external dependency: how it fails, what the user sees, the fallback |
| [05-architecture.md](./docs/05-architecture.md) | Data model, engine-vs-UI split, how v2 avoids a rewrite |
| [06-decisions.md](./docs/06-decisions.md) | Decision log — every scope choice and why |
| [07-case-study.md](./docs/07-case-study.md) | Narrative arc for the portfolio case study |
