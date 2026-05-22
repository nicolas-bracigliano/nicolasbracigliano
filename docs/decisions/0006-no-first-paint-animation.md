# 0006 — No first-paint animation

**Status**: Accepted
**Date**: 2026-05-22

## Context

Two entry animations were originally implemented:

1. **Page-load fade-up** — `main { animation: fade-up var(--speed-standard) both }`. Whole page faded in over 320 ms on first render.
2. **Scroll-driven view-timeline reveal** — `.entry-list > li`, `.card-list > .card`, `.specs` faded up as they entered the viewport via `animation-timeline: view()`.

Both fit the design system's motion principle ("animate into existence, then rest"). Both were the _primary_ visual signal that the site was "alive" on first load.

When axe-core was wired into Playwright e2e in CI, both animations broke the build. The mechanism:

- Axe inspects rendered pixel colours, not declared CSS values
- An element mid-animation at `opacity: 0.77` renders as an alpha-blended pixel — for `--ink-3` text on `--bg`, that blends to `#918a7f` instead of the design-token `#736b5e`
- Axe sees `#918a7f` on `#f6f4ef` as 3.1:1 contrast — failing AA
- The actual end-state colours pass AA comfortably; the failure is a _timing artefact_ of axe running before the animation reaches 100%

We tried four workarounds:

| Workaround                                                                                          | Result                                                                                                                                                                                 |
| --------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `await page.waitForFunction(() => document.getAnimations().every(a => a.playState === 'finished'))` | Scroll-driven animations report `running` indefinitely (they're tied to scroll, never "finish"); the wait hangs.                                                                       |
| Playwright `use: { reducedMotion: 'reduce' }`                                                       | TypeScript types don't expose `reducedMotion` at the `use` level (it's a context option). Compile error. Per-test `page.emulateMedia()` would work but adds boilerplate to every test. |
| `animation-fill-mode: backwards` instead of `both`                                                  | Element still starts at the `from` keyframe; same partial-opacity-at-first-frame problem.                                                                                              |
| Drop the axe color-contrast check or downgrade severity                                             | Defeats the purpose of having axe in CI. Color-contrast IS a serious violation.                                                                                                        |

## Decision

**No first-paint animation.** The page renders at its final state on the first frame.

- `main { animation: fade-up … }` removed.
- `@supports (animation-timeline: view()) { .entry-list > li, .card-list > .card, .specs { … } }` removed.
- All other motion is preserved: hover transitions, click feedback, theme transition, cross-page View Transitions (handled by `<ClientRouter />`), the day/night sun/moon icon morph.

## Alternatives considered

Beyond the four workarounds above:

- **Wait for `requestAnimationFrame` × N before axe runs** — would mask the issue, not solve it; brittle to changes in animation duration or browser timing.
- **Set `animation-duration: 0.01ms` only in CI via an env-conditional CSS** — adds a CI-only code path that diverges from production behaviour. Tests would no longer be testing what users see.
- **Keep the animation but use `prefers-reduced-motion` at the OS level on the CI runner** — fragile and runner-specific; doesn't help local e2e runs.
- **Use the View Transitions API to fade the whole document on initial paint** — same partial-opacity-at-first-frame problem.

## Consequences

**What we accept:**

- First paint is the final state. No "ease in" feel on initial page load.
- This is the _most visible_ motion regression from the prototype's experience. The prototype had a deliberate fade-in on every navigation — we lose that on initial loads (subsequent navigations still get View Transition fades via ClientRouter).

**What we gain:**

- Axe-core can enforce WCAG AA contrast deterministically in CI. No more flaky test runs because of animation timing.
- First Contentful Paint and Largest Contentful Paint are _slightly_ faster (no animation duration on critical render).
- The Lighthouse a11y score is now reliably 100/100 across all 5 audited URLs.

**Compensating motion (what still plays):**

- Per-element hover effects on every interactive surface (nav, entry-list, cards, prose links)
- Theme transition (320 ms cross-fade of `data-theme`)
- Sun ↔ moon icon morph on the day/night toggle (mask animation)
- Cross-page View Transitions on every internal navigation (Mark morphs across pages via `transition:name`; rest of the page fades)

The site still feels animated — just not on the very first frame.

## When to revisit

- Browsers reliably report final-state colours for scroll-driven animations at first paint (Chromium / Firefox / Safari behavior converges).
- A new CSS feature (or axe-core option) lets us declare "this element's mid-animation opacity should not affect contrast checks".
- We adopt a different e2e a11y tool that's animation-timing-aware (none exist as of 2026-05).
- We accept a visual-only test alongside axe (Percy / Playwright screenshots after `await page.waitForLoadState('networkidle')`) and re-introduce first-paint motion behind that gate.
