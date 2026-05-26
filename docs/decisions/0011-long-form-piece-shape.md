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

Same skeleton, same length window, same required components. Documenting it as a system rule means future pieces don't have to re-derive the shape — it becomes a guide the writer (and the LLM) consults and reflects against, captured as the §7b review checklist.

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

4. **Length floor and ceiling.** Body 1200–1500 words. Below = too thin for the format; above = wrong format (push to a series, not a single piece). A healthy outlier is fine — this is a reflection prompt (§7b), not a hard bound.

5. **Margin notes / pull quotes.** 3 per piece, each anchored to a real H2 in the body via the `marginNotes[].section` slug, each ≤180 chars (schema-enforced), distributed structurally (not stacked at the closing). Voice = self-aware aside, often hedging or self-deprecating, never editorial.

6. **Tag pattern.** 2–3 tags, framework-first. EN keeps the framework as an English noun phrase; ES keeps the English loanword + translates the domain term.

## Alternatives considered

| Option                                             | Why not                                                                                                                                                                                                                                                                    |
| -------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| No structural rule — let each piece find its shape | The four P3 pieces independently converged on this skeleton during the editorial pass. Documenting it saves the re-derivation cost; deviating from it is still allowed, but the deviation should be deliberate.                                                            |
| Stricter template (numbered sections, fixed names) | Defeats the §6 voice — pieces aren't form-fill. The required-components list is the binding part; section names stay flexible.                                                                                                                                             |
| Length floor only (no ceiling)                     | A 2500-word piece is a different format. Multiple shorter pieces in a series read better than one long piece; the ceiling forces that decision.                                                                                                                            |
| Enforce the rules with build-failing unit tests    | Tried in an early PR V draft (em-dash, banned-phrase, anchor, shape tests) and reverted. It turned a reflective craft into a pass/fail pipeline and moved editorial judgement into CI. The rules are a guide to consult (§7b), not gates. See "How this is applied" below. |

## How this is applied — a reflective guide, not CI gates

The standards in this ADR are a **writer's guide**, consulted after a draft exists and reflected against — not a set of build-failing unit tests. An early version of PR V shipped four unit tests (em-dash scan, banned-phrase scan, margin-note-anchor validator, shape envelope); they were removed because they turned a reflective craft into a pass/fail pipeline and pushed the judgement into CI instead of leaving it with the writer.

Where the rules live and how they're used:

- **§7b "Reviewing a piece (the reflection pass)"** in `docs/design-system.md` is the checklist. After a draft exists, the writer reads it once against §7b. The LLM runs the same pass when it writes or reviews a piece: walk the list, flag what it notices, explain its reasoning — the writer decides, the list informs.
- **§6** holds the voice rules (banned phrases, anecdote fidelity, hedges, five-word test, em dashes).
- **§7a** is the writing-time recipe; **§7b** is the review-time reflection.

Why a guide and not tests:

1. **Most rules are judgement, not lint.** "Is this anecdote real?", "is this the wrong register?", "is 1700 words a healthy outlier or sprawl?" — none of these have a clean pass/fail. A test would force a binary on inherently editorial calls.
2. **Prose detection is unreliable.** "Has an attribution paragraph" can't be regex-matched without false positives/negatives.
3. **Section names vary legitimately.** The "when-not-to-use" section is "When this isn't the right tool" in C4/CPR/Agile but "When to reach for something else" in Rings. A slug test would false-negative on healthy variation.

**The one genuinely test-shaped item** is the margin-note anchor check (every `marginNotes[].section` must match an H2 slug, or the pull quote silently doesn't render — this bit during PR P5). It's a correctness bug, not a style call. It stays on the §7b checklist as the most error-prone item; if orphan margin notes recur despite the checklist, revisit adding a narrow build-time validator just for that one case.

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
