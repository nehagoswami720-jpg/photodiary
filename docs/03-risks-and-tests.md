# 03 · Risks & Tests

The discipline: **before any design or UI work**, settle the assumptions that
could sink the product — each with the smallest possible throwaway test and a
clear decision rule. This is Phase 0.

## Riskiest assumptions, ranked

Ranked by "if this is false, the app doesn't work."

| # | Assumption | Why it's scary |
|---|------------|----------------|
| **R1** | Real photos from a normal camera roll still carry **EXIF date + GPS** by the time they reach a browser | Sharing (WhatsApp/iMessage/IG), screenshots, and downloads strip this. If most real photos are stripped, manual entry stops being a fallback and becomes the main flow — a different product. |
| **R2** | We can **read EXIF from HEIC** in-browser (Apple's default format) | Desktop browsers can't *display* HEIC without a heavy converter — but reading *metadata* doesn't require decoding pixels. Must confirm the card can work even when the thumbnail can't. |
| **R3** | We can get the **timezone right** for the time + weekday | EXIF time is usually local wall-clock with no zone attached. Wrong timezone = wrong "6:12" and possibly wrong "Tuesday" = an honesty violation. Solvable offline, but must be done deliberately. |
| **R4** | We can turn GPS into a **nice place name** ("Lisbon") reliably | This is the one remaining external dependency. Fails to ugly coordinates if not handled. Online vs. offline naming is the open question. |
| **R5** | IndexedDB **won't silently evict** the diary | Browsers can drop local storage under pressure. A diary that loses entries is heartbreaking. Mitigable with the Persistent Storage API. Lower risk at v1 scale, but real. |

> **Removed by scoping:** the original plan carried a high risk that *historical
> weather would be real but feel wrong* (reanalysis data is gridded and hourly).
> Cutting weather from v1 deleted that risk entirely. See `06-decisions.md`, D2.

## The tests (Phase 0)

Most share **one throwaway page** — a bare file input plus a few libraries that
dumps results to the screen. It is deleted after it answers its questions.

- **T1 — EXIF survival** *(the first test, known from the start)*
  Drop **15–20 of your own realistic photos** — one received over WhatsApp, one
  screenshot, one AirDropped, one downloaded, one from years ago, one recent.
  For each, log: *has date? has GPS? has timezone offset? format?*
  **Decision rule:** if a large share of *realistic* photos lack GPS, the hero
  flow is manual entry — redesign around that before any UI work.

- **T2 — HEIC**
  Feed the same page HEIC files. Check (a) does the EXIF library return
  metadata, and (b) can we display the image at all. Note decode time + bundle
  weight.
  **Decision rule:** if metadata works but display doesn't, v1 shows a neutral
  placeholder for HEIC rather than shipping a heavy converter.

- **T3 — Timezone**
  Feed photos taken while traveling (a different zone than home). Verify the
  offline timezone lookup produces the correct local time and weekday.
  **Decision rule:** confirm the offline timezone path before trusting any card.

- **T4 — Place naming (online vs. offline), head-to-head**
  Run ~10 varied coordinates (city, rural, foreign, coastal) through both a
  small **offline** city dataset and an **online** geocoding API. Compare name
  quality, honesty of coarseness, and — for the online option — rate limits.
  **Decision rule:** pick whichever reads better against *real* coordinates;
  offline wins ties (zero network, zero leak).

- **T5 — Storage durability**
  Write entries to IndexedDB, request Persistent Storage, confirm entries
  survive a reload and that the durability request is granted.
  **Decision rule:** if durability can't be guaranteed, surface an honest
  "your diary lives only in this browser" note.

## The gate

Phase 0 is a **gate**, not a formality. We proceed to Phase 1 (the engine) only
if the tests come back acceptable on *the user's own real photos*. If they
don't, we change the *product*, not just the code — and we learn it on day one,
not mid-build.
