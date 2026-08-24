# CLAUDE.md — Photodiary working agreement

Read this before doing anything in this project. It is the scope fence. When a
request conflicts with it, stop and flag the conflict instead of quietly
widening scope.

## What this project is

A photo diary that shows only what a photo already knows. Drop a photo → one
quiet card: **place · weekday · date · time**, read from the photo's own EXIF.
Full plan lives in [`docs/`](./docs) — start with `docs/01-v1-spec.md` and
`docs/06-decisions.md`.

## Two principles — never break these

1. **Nothing is invented.** Every value shown is recorded data or it is absent.
   Never guess a fact and present it as truth. If a value can't be obtained
   truthfully, show nothing (or invite manual entry) — never fill the gap with
   a guess. Machine features (later versions) only *organize* real data; any
   inferred label must be visibly marked as a guess.
2. **Photos never leave the device.** No backend, no accounts, no cloud.
   On-device storage only (IndexedDB). The one exception under discussion is
   sending GPS coordinates for place-naming — and that is the ONLY thing that
   may ever leave. Crossing into sync/sharing (v4+) is a deliberate,
   flagged decision, never an accident.

## v1 scope — LOCKED

- **In:** one photo at a time → a card with exactly four data points
  (location, weekday, date, time); manual-entry fallback when EXIF is missing;
  persistence in IndexedDB; **one screen**; **desktop web only**.
- **Out (do not build in v1):** albums / grouping · AI / ML categorization ·
  multiple photos at once · any second screen · accounts, login, sync, cloud ·
  sharing or export · photo editing · search · maps · **mobile** · weather,
  sunset, or moon phase.
- If a request implies anything in the "Out" list, it is a **later-version**
  conversation — say so and point to `docs/02-roadmap.md`.

## Stack & code style

- React · Vite · Tailwind · IndexedDB · deployed on Vercel.
- **Fewer files, boring readable code over clever abstractions.** The person
  maintaining this is a designer who vibe-codes and must be able to open any
  file and understand it. Match the surrounding code; no premature frameworks.
- Keep the **engine (pure functions) separate from the UI** (see
  `docs/05-architecture.md`). The UI never computes facts — it displays what the
  engine returns.

## Build order — do not skip

1. **Phase 0 first: the throwaway probe.** Before any design or UI, test on the
   user's *own real photos* whether EXIF date + GPS survive to the browser
   (see `docs/03-risks-and-tests.md`). This is a gate, not a formality.
2. Then: engine (pure functions) → the one screen → persistence → deploy.
3. **Do not design a single pixel until the engine works as intended.**

## Data model (the spine — don't outgrow it)

Every entry: `{ id, photoBlob, capturedAt, lat, lon, placeName, source, createdAt }`.
`capturedAt` keeps a UTC instant + original offset; `source` is `'exif' | 'manual'`.
This shape is what makes v2 albums pure arithmetic — keep storing it from day one.

## Open decisions (don't resolve unilaterally)

- Online vs. offline place-naming — decide from Phase 0 evidence (`D7`).
- Whether an honesty disclosure belongs in the UI (`D3`).
