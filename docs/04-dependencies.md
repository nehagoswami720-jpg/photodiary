# 04 · External Dependencies

For every dependency: **how it fails, what the user sees, and the fallback.**
The design goal is that no single failure ever produces an invented fact or a
dead end — the app degrades to an honest, partial card instead.

## v1 dependency surface (deliberately tiny)

After cutting weather, sunset, and moon from v1, the surface is small:

| Dependency | When it fails | What the user sees | Fallback |
|------------|---------------|--------------------|----------|
| **EXIF reader** (client-side library) | Photo has no date/GPS, or an unparseable format | "This photo doesn't carry that data — want to add it?" | **Manual entry** (user types place / date) |
| **HEIC display** (only if needed) | Browser can't decode HEIC, or converter is too heavy/slow | Card renders normally; the image area shows a neutral placeholder | Show the card without the thumbnail — the card *is* the product |
| **Place naming** (online API *or* offline city list — TBD Phase 0) | Network down / rate-limited / no match (e.g. mid-ocean) | Place line shows a coarser region or the raw coordinates | Fall back to coarser name → coordinates; user can edit |
| **Timezone lookup** (offline data library) | Coordinate not found (mid-ocean) | *(invisible)* | Use EXIF's own timezone-offset tag if present, else UTC, flagged internally |
| **IndexedDB** (browser storage) | Eviction under storage pressure | Older entries could disappear | Request Persistent Storage on first save; show an honest note if not granted |

**The shape to notice:** the only potential hard-network dependency in v1 is
place naming, and even that degrades to coordinates. Date, weekday, and time
never touch a network.

## Dependencies added in later versions

| Version | Dependency | Failure posture |
|---------|-----------|-----------------|
| v2 | *(none new)* — grouping is pure arithmetic on stored data | n/a |
| v3 | On-device ML model (in-browser) | Runs locally; if unsupported, semantic grouping is simply unavailable — time/location grouping still works |
| v3 | Weather / sunset / moon (opt-in enrichment) | Enrichment layer only; if it fails, the honest core card is unaffected |
| v4+ | Backend, accounts, E2E encryption | The named architectural fork — planned deliberately, not inherited |

## Guardrail

If a value can't be obtained truthfully, the app **shows nothing in its place
and, where useful, invites manual entry** — it never fills the gap with a
guess. This rule is what keeps "nothing is invented" true even when
dependencies fail.
