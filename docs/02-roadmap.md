# 02 · Roadmap

The version ladder. Each version adds *screens and capability* on top of a
stable foundation — never a rewrite. The two principles (nothing invented;
photos never leave the device) hold at every rung.

---

## v1 — The honest card *(locked)*

Drop one photo → one quiet card: **place · weekday · date · time**, all from
the photo's own EXIF. Manual entry when data is missing. Persists in
IndexedDB. Desktop web. See `01-v1-spec.md`.

**What it quietly sets up for everything after:**
- A stable entry record (see `05-architecture.md`).
- A pure-function engine kept separate from the UI.

---

## v2 — The diary of albums

Import many photos; they **auto-group into albums by gaps in time and
location** — a trip, an evening, a weekend.

**The elegant part:** this is *not* AI and *not* a network call. It is
arithmetic on the `{ timestamp, lat, lon }` already stored for every photo in
v1. Sort by time; start a new album wherever the time gap or the distance
jump crosses a threshold. Each album names itself honestly from real data:
*"Lisbon · June 2016."*

- **Earns the second screen:** a timeline / gallery view and an album detail
  view. The v1 card lives on inside each photo.
- **New complexity to plan for:** bulk-import performance (reading EXIF for
  hundreds of photos), thumbnails vs. full images, and IndexedDB growth —
  where we begin requesting Persistent Storage.

---

## v3 — Smarter, still honest

Machine intelligence enters strictly as an **organizer**, never a fabricator.

- **On-device semantic grouping** (beach / city / mountains / people) via a
  small in-browser model — photos *still* never leave the device. Guessed
  tags are visually distinct from recorded facts.
- **Search & resurfacing:** "on this day," rediscovery of forgotten moments.
- **The rich card returns as opt-in enrichment:** the original weather +
  sunset + moon idea comes back here, now that the honest core is proven, as
  a clearly-real, network-fed extra layer the user can turn on.
- **Export a card as an image:** a shareable, honest artifact.

---

## v4+ — The named fork

The moment the product wants **sync across devices** or **sharing between
people**, the "no backend / no accounts" constraint has to break: that means
a server, accounts, and end-to-end encryption to keep the privacy promise
intact.

This is a genuine architectural pivot, so it is deliberately parked at the far
end. Everything through v3 stays local-only. We cross this line only as a
conscious decision — never by drifting into it.

---

## One-line summary

| Version | Theme | Screens | New dependency | Still local-only? |
|---------|-------|---------|----------------|-------------------|
| v1 | The honest card | 1 | place naming (TBD) | Yes |
| v2 | Diary of albums | 2–3 | none (pure arithmetic) | Yes |
| v3 | Smart & honest | +search/enrichment | on-device ML; opt-in weather | Yes (ML on-device) |
| v4+ | Sync & sharing | — | backend + accounts + E2E encryption | **No — the named fork** |
