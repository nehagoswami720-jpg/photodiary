# 00 · Vision

## The idea in one breath

A person drops a photo into the app. The app reads the photo's own recorded
metadata — when and where it was taken — and shows a single quiet card:

> **Lisbon, Portugal**
> Tuesday, 3 June 2016 · 6:12 PM

No captions to write. No AI narration. No embellishment. Just the calm,
factual truth the photo has been carrying all along, made legible.

## Who it's for

People who feel that their photo libraries have become silent, searchable
piles — and who would find quiet meaning in seeing the *context* a photo
already holds: the exact day of the week, the place, the moment.

## The north star

**Beautiful execution of a simple, honest idea.** The concept is small on
purpose. The craft is in the restraint: one screen, one card, no noise, and
absolute trust that everything shown is real.

## The two principles

These are not features. They are constraints that define the product, and
they hold from v1 through the final version.

### 1. Nothing is invented

Every value on the card is either recorded data or it is absent. The app
never guesses a fact and presents it as truth. When later versions introduce
machine *organization* (grouping, tagging, search), the machine's role is
strictly to **sort and retrieve** what is real — never to fabricate. Any
label the machine *infers* (e.g. "beach") is visually distinct from a
recorded fact (e.g. the GPS place name) so the user always knows which is
which.

**Why this matters:** the product's entire emotional promise rests on trust.
A single invented or wrong-feeling "fact" breaks it. This is why v1
deliberately extracts only data that comes straight off the photo.

### 2. Photos never leave the device

No backend. No accounts. No cloud. Photos are read and stored locally
(IndexedDB). The one point where this constraint would have to break —
syncing across devices or sharing between people — is named ahead of time
(see the roadmap, v4+) and treated as a conscious architectural fork, never
an accidental leak.

## Design values

- **One screen for v1.** If a feature needs a second screen, it belongs to a
  later version.
- **Few files, boring code.** The codebase is built to be read and changed by
  a designer who vibe-codes. Clever abstractions are a cost, not a virtue.
- **Honest by construction.** The architecture itself should make it hard to
  ever show something untrue.
