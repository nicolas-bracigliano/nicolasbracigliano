# 0011 — Long-form pieces follow a kernel-plus-six-sections shape

**Status**: Accepted
**Date**: 2026-05-27

## Context

PR P3 migrated four legacy WordPress posts into `/pieces` and `/ensayos`. The editorial pass that followed surfaced a consistent structural shape across all four pieces — not because the source posts shared a template, but because the §6 voice rules + ADR 0012's editorial layout converged on the same skeleton.

The four shipped pieces:

| Piece                      | H2 sections | Body words |
| -------------------------- | ----------- | ---------- |
| Rings (Clean Architecture) | 6           | ~1300      |
| CPR (communication)        | 6           | ~1200      |
| C4 (architecture model)    | 7           | ~1300      |
| Agile (process)            | 6           | ~1400      |

Same skeleton, same length window, same required components. Documenting it as a system rule means future pieces don't have to re-derive the shape, and gives PR V's tooling something concrete to assert against.

## Decision

Long-form pieces follow this structure:

1. **Kernel paragraph** (no heading) — one paragraph; sets up the framework with a personal anecdote, decision, or observation. The remark plugin marks this paragraph with `class="lead-p"` for the drop-cap rule.

2. **6–7 H2 sections** in roughly this order for framework pieces:
   - personal-story-section (often combines with the kernel; or a dedicated H2 expanding on it)
   - framework-explanation-with-attribution
   - what-it-gets-right (sometimes combined with the next)
   - what-it-doesn't-fix
   - common-mistakes-I-keep-making
   - when-this-isn't-the-right-tool
   - closing wrap (often a "what I'd tell past me" or "what I'd protect" or similar)

3. **Required components** for framework pieces:
   - (a) **Attribution paragraph** naming the originator + canonical reference (book or website with edition or date).
   - (b) **"Common mistakes I keep making"** section — patterns the author has fallen into more than once. Specific, hedged, owned.
   - (c) **"When this isn't the right tool"** section — three to four concrete cases where the framework is overkill or wrong.
   - (d) **Terminology disambiguation** where names collide with adjacent industry terms (e.g., C4 Container ≠ Docker; Scrum ≠ agile).

4. **Length floor and ceiling.** Body 1200–1500 words. Below = too thin for the format; above = wrong format (push to a series, not a single piece). Asserted loosely by `tests/unit/piece-shape.test.ts` (800–1800 envelope to allow editorial range without flagging healthy outliers).

5. **Margin notes / pull quotes.** 3 per piece, each anchored to a real H2 in the body via the `marginNotes[].section` slug, each ≤180 chars (schema-enforced), distributed structurally (not stacked at the closing). Voice = self-aware aside, often hedging or self-deprecating, never editorial.

6. **Tag pattern.** 2–3 tags, framework-first. EN keeps the framework as an English noun phrase; ES keeps the English loanword + translates the domain term.

## Alternatives considered

| Option                                             | Why not                                                                                                                                                                                                                                            |
| -------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| No structural rule — let each piece find its shape | The four P3 pieces independently converged on this skeleton during the editorial pass. Documenting it saves the re-derivation cost; deviating from it is still allowed, but the deviation should be deliberate.                                    |
| Stricter template (numbered sections, fixed names) | Defeats the §6 voice — pieces aren't form-fill. The required-components list is the binding part; section names stay flexible.                                                                                                                     |
| Length floor only (no ceiling)                     | A 2500-word piece is a different format. Multiple shorter pieces in a series read better than one long piece; the ceiling forces that decision.                                                                                                    |
| Anecdote fidelity as voice rule only (no test)     | The rule is enforceable only by the author at write time — a unit test can't tell a real anecdote from an invented one. Documenting in §6 is the right home; the test surface for PR V is the structural rules (em dashes, banned phrases, shape). |

## Consequences

**Tooling** (PR V):

- `tests/unit/piece-em-dash.test.ts` — assert no em dashes (`—`, U+2014) in piece body prose. Skip frontmatter (captions and ledes allow them on rare occasion). Build-failing.
- `tests/unit/piece-banned-phrases.test.ts` — assert no §6 banned phrases appear in piece bodies. Build-failing (the catalogue is small and curated; a soft-warning test gives no CI signal).
- `tests/unit/piece-margin-note-anchors.test.ts` — assert every `marginNotes[i].section` resolves to an H2 slug in the body. Catches the orphan-section bug surfaced during PR P5.
- `tests/unit/piece-shape.test.ts` — assert each piece has 6–8 H2 sections, 800–1800 body words, and 2–3 tags. Loose guardrail against accidental thinness or sprawl.

**Not enforced by tooling — review-only (a known gap).** The _required components_ in rule 3 (attribution paragraph, "common mistakes" section, "when-not-to-use" section, terminology disambiguation) are the most load-bearing rules in this ADR but are deliberately left to code review rather than a unit test. Two reasons:

1. **Prose detection is unreliable.** "Has an attribution paragraph" can't be matched against a regex without false positives/negatives — it's a judgement about whether a paragraph names the originator + canonical reference.
2. **Section names aren't consistent enough to slug-match.** The "when-not-to-use" section is "When this isn't the right tool" in C4/CPR/Agile but "When to reach for something else" in Rings. A heading-slug test would false-negative on legitimate variation. And there's no `kind:` frontmatter to scope a test to _framework_ pieces (vs. a future memoir/manifesto piece that wouldn't need these components).

The right time to revisit: when a non-framework piece arrives and forces a `kind:` discriminator. Until then, a brittle multi-variant slug matcher would cost more than the review-enforcement it replaces.

**Revisit clause.** These standards derive from four pieces. After the next 2–3 long-form additions, revisit:

- Is the section-count window (6–7) still right?
- Is the length window (1200–1500) still right?
- Are the required components binding, or do some pieces work without one?
- Is the "framework piece" framing too narrow? Memoir/manifesto/talk pieces may need their own shape.

**Open questions** (deferred, not blocking ADR acceptance):

- Series support — what happens when one argument spans multiple linked pieces? Out of scope for ADR 0011.
- Non-framework piece shapes (memoir, essay, manifesto) — this ADR is explicit about _framework_ pieces. Other shapes are TBD; revisit when a non-framework piece is on the bench.

## References

- Four worked examples in `src/content/pieces/{en,es}/` — see ADR 0012's "References" for the prototype CSS this lineage derives from.
- PR P3 (#72) — initial migration.
- PR P5 (#74) — editorial layout, drop cap, italic H2 with `§`.
- ADR 0012 — pieces editorial layout (companion to this ADR).
