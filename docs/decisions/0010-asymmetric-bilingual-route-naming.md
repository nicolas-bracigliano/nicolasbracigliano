# 0010 — EN and ES route slugs may diverge when the same word lands differently in each language

**Status**: Accepted
**Date**: 2026-05-25

## Context

ADR 0003 established mirrored `/en` and `/es` route trees with a shared `ROUTES` map: every route key resolves to one URL per locale (`notes.en = '/en/notes/'`, `notes.es = '/es/notas/'`). The original design intent was that EN and ES are first-class siblings — neither is a translation of the other, both are canonical.

In practice the asymmetry has crept in for substantive reasons, not by oversight:

- `works` (EN) · `obras` (ES) — both carry "catalog of finished things" but the English `obras` would read as art-history jargon; the Spanish `works` would read as half-Spanish.
- `notes` (EN) · `notas` (ES) — same word, different inflection. Trivial.
- `pieces` (EN, new) · `ensayos` (ES, new) — Spanish `ensayo` keeps the older, lovelier meaning (an _attempt_, a _rehearsal_; musicians' ensayo, theatre ensayo) which is on-brand for §6 ("admit uncertainty over polish"). English `essay` accreted school/thought-leadership baggage that fights the spirit of the site; `pieces` returns the craft register (a "piece" of writing, alongside the `works` catalog).

These aren't translation failures — they're places where the same concept lands at a different weight in each language. Forcing symmetry would mean shipping at least one locale with a worse word.

## Decision

EN and ES route slugs may diverge when both of the following hold:

1. The candidate symmetric word would be a worse fit in one locale (academic, jargony, performative, or off-register) than the asymmetric pair.
2. Both alternatives are first-class words in their own language — not transliterations, calques, or "the closest available match." The asymmetry exists because each language has its own better word, not because one language is being approximated.

This refines ADR 0003 — mirroring is still the default. Asymmetric naming is the deliberate exception, and each exception lives in the `ROUTES` map with a comment explaining why.

## Alternatives considered

| Option                                           | Why not                                                                                                                                                                                                            |
| ------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Force symmetric naming everywhere**            | Ships at least one locale with a worse word, every time. The asymmetric examples above (`works`/`obras`, `pieces`/`ensayos`) were each chosen after weighing the symmetric alternatives and finding them inferior. |
| **Always use the EN word in both locales**       | Performative monolingualism in a bilingual project. `casa` / `home` mixing would alienate Spanish readers without giving English readers anything.                                                                 |
| **Always use the ES word in both locales**       | Same problem, mirrored. `obras` reads as art-history terminology to most English readers.                                                                                                                          |
| **Hide asymmetric URLs behind a redirect layer** | Adds latency, complicates the static-asset story, and obscures the IA from anyone reading the routing config. The URL IS the asymmetry — making it honest beats hiding it.                                         |

## Consequences

**What we accept:**

- The IA is mildly inconsistent across locales when viewed as URL strings. A reader scanning the routes map sees `notes.en = '/en/notes/'` but `pieces.en = '/en/pieces/'` pairing with `pieces.es = '/es/ensayos/'`.
- Each new route has to be evaluated against the test in §"Decision" — symmetric by default, asymmetric only when both conditions hold.
- Any documentation that lists routes (the design-system IA table, the architecture diagram) has to render the pair, not just one slug.

**What we gain:**

- Each locale gets the right word, not the available word.
- The site's bilingual stance stays first-class. ES is not "EN translated" — it has its own vocabulary where that matters.
- The deliberate-exception convention prevents drift. A future contributor can't accidentally rename a symmetric route to an asymmetric one without an inline comment justifying it.

## Precedents

The `ROUTES` map currently holds three asymmetric pairs:

| Key      | EN            | ES                                                         |
| -------- | ------------- | ---------------------------------------------------------- |
| `works`  | `/en/works/`  | `/es/obras/`                                               |
| `notes`  | `/en/notes/`  | `/es/notas/` (mostly mirrored — different inflection only) |
| `pieces` | `/en/pieces/` | `/es/ensayos/`                                             |

The remaining routes (`home`, `about`, `now`, `colophon`) ship symmetric pairs (`/en/about/` ↔ `/es/sobre/` is asymmetric in form but mechanical translation — `sobre` is the plain Spanish for "about").

## When to revisit

If more than half of the routes in `ROUTES` end up asymmetric, the doctrine should flip — at that point asymmetric IS the norm and mirrored becomes the exception worth flagging. (The ratio matters, not the absolute count; the IA is allowed to grow or shrink.)

## Related infrastructure

PR P1 (the `essays` → `pieces` rename) also carved out a per-URL Lighthouse budget in `lighthouserc.json` for the pieces routes: 90 KB total / 30 KB images, vs. the strict 50 KB total / 200 KB images everywhere else. Pieces are long-form content with bespoke SVG diagrams (PR P2), so the strict notes-density budget doesn't fit. The carve-out lives in `assertMatrix` — the pieces URL pattern matches first and wins; everything else falls through to the strict default. Adding a new route family that needs its own budget should follow the same pattern (new `assertMatrix` entry above the catch-all).
