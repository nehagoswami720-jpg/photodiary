# 01 · v1 Spec (locked)

## What v1 does

Drop **one** photo into a browser. The app reads the photo's own EXIF data
and shows a single quiet card:

> **Lisbon, Portugal**
> Tuesday, 3 June 2016 · 6:12 PM

## The four data points, and where each comes from

| Data point | Source | Network? |
|------------|--------|----------|
| **Date** | EXIF timestamp | No |
| **Weekday** | Derived from the timestamp | No |
| **Time** | EXIF timestamp | No |
| **Location (place name)** | EXIF GPS coordinates → place name | *To be decided in Phase 0* |
| *(supporting)* **Timezone** | Offline lookup from GPS coordinates | No |

Only the place name can possibly require a network call. Everything else is
computed on-device from data inside the photo.

> **Deliberately cut from v1:** weather, sunset time, and moon phase. They were
> in the original concept but removed to shrink the risk surface (see
> `06-decisions.md`, D2). They return as opt-in enrichment in v3.

## Rules

- **Nothing invented.** Every value is recorded data or it is absent.
- **Manual entry fallback.** When a photo has no usable EXIF date or GPS, the
  user can type the place and/or date inline, and the app builds the card from
  that. Still one screen.
- **Persistence.** Each entry is saved to IndexedDB and reappears when the app
  is reopened — this is a *diary*, not a one-shot tool.
- **Desktop web only.** Mobile is explicitly out of v1 scope.

## Stack

React · Vite · Tailwind · IndexedDB · deployed on Vercel.
Few files, boring readable code.

## Non-goals for v1

Albums / grouping · AI categorization · multiple photos at once · any second
screen · accounts, login, sync, cloud · sharing or export · photo editing ·
search · maps · mobile. If a request implies any of these, it is a later-version
conversation.

## "Done" — one verifiable sentence

> **v1 is done when I can drop a real photo in my browser and, within a second
> or two, see one quiet card with the real place, weekday, date, and time from
> that photo; with a manual-entry path when the data isn't there; and with
> entries still present when I reopen the app.**

### Done, as a checklist

- [ ] Dropping a real JPEG with EXIF shows a card with place, weekday, date, time.
- [ ] The place name is human-readable (not raw coordinates).
- [ ] The time and weekday are correct for the photo's local timezone.
- [ ] A photo with no EXIF date/GPS offers inline manual entry, then builds a card.
- [ ] A photo the app genuinely can't read fails honestly (never invents data).
- [ ] Entries persist across a page reload.
- [ ] The whole thing lives on one screen.
- [ ] Deployed and reachable on Vercel.
