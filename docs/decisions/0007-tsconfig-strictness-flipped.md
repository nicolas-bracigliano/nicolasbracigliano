# 0007 — TypeScript strictness flags flipped on

**Status**: Accepted
**Date**: 2026-05-23

## Context

The bootstrap PR set four TypeScript strictness flags to `false` with the comment "deferred from initial bootstrap — flip back on in a follow-up PR":

```jsonc
"exactOptionalPropertyTypes": false,
"noUnusedLocals": false,
"noUnusedParameters": false,
"noImplicitReturns": false
```

These were left off so the initial scaffold could compile without paying the cost of cleaning up bootstrap-era loose ends. By the time the marginalia notebook (PR 1.2) shipped, the codebase had accumulated stale exports (`indexRouteFor`, `RouteKey`, `LangAlternate`, `buildHreflangAlternates`, `LOCALES`), dead route styles (`.entry-list`), and infrastructure-without-consumers (the OG card pipeline, `readingTimeMinutes`). One of those dead route styles — `.note, .work, .page { max-width: var(--measure) }` — silently capped a new `<li class="note">` grid container, collapsing the body column to ~120 px in production.

A static-pattern audit (PR #10) caught most of the dead exports. But the underlying class of bug — "shipping infrastructure ahead of its consumer" — kept recurring. Flipping the four deferred flags was the structural fix: TypeScript would have flagged the unused exports at build time instead of letting them rot.

## Decision

Flip all four flags to `true`:

- **`noUnusedLocals: true`** — unused `import`s, `const`s, and `let`s fail typecheck. This is what catches the "exported helper with zero callers" class going forward.
- **`noUnusedParameters: true`** — unused function parameters fail typecheck (prefix with `_` to opt out for genuine API-shape reasons).
- **`noImplicitReturns: true`** — every code path in a function must explicitly return (or the function must explicitly return `void`).
- **`exactOptionalPropertyTypes: true`** — `prop?: string` no longer accepts `prop: undefined`. The property must be either omitted or set to a `string`. This is the strictest of the four and surfaces real call-site bugs.

## Consequences

### Call-site pattern for optional props

Callers that pass `entry.data.lede` (typed as `string | undefined`) into a `description?: string` prop now have to conditionally spread:

```astro
<BaseLayout
  title={title}
  locale={locale}
  path={path}
  siblingPath={siblingPath}
  {...lede && { description: lede }}
/>
```

This is verbose but preserves the absent-vs-undefined distinction. The lazy alternative (widening the receiver to `description?: string | undefined`) was used briefly in PR #11 and reverted in this PR's predecessor — it defeats the flag for the affected props while still imposing the cost everywhere else.

### Linter alignment

ESLint's `@typescript-eslint/no-unused-vars` is also active. It catches the same set of issues as `noUnusedLocals` / `noUnusedParameters` but at the file level rather than via type-checking; the two layers reinforce each other.

### What this doesn't catch

- **Dead conditional branches** (`{cond && ...}` where `cond` is always truthy). TypeScript can't prove this from types alone.
- **Convention duplicated across files** (e.g., a URL template encoded in three places). Type-aware linting can't see it; either factor through a shared helper or accept the periodic-audit cost.

For those cases, periodic manual audits or a dead-code analyzer like `knip` remain necessary.

## Alternatives considered

- **Keep the flags off, rely on periodic audits.** Tried this for ~6 PRs. Stale exports accumulated; one shipped bug (PR #8). Not sustainable.
- **Flip flags one at a time in separate PRs.** Cleaner for review but stretches the cleanup across multiple PRs without compounding benefit. Bundled in PR #10 instead.
- **Widen receiver types instead of conditional-spreading at call sites.** Defeats `exactOptionalPropertyTypes` for the affected props. Rejected.

## References

- PR #10 (`chore(cleanup): remove stale exports + CSS + tighten tsconfig`) — initial flip
- PR #11 (`feat(meta): wire OG cards and auto reading-time`) — accidentally introduced the receiver-widening anti-pattern
- The staff-critique follow-up PR — reverted the receiver widening, established the conditional-spread pattern
- Memory: `feedback-legacy-route-selectors` documents the bug class this decision structurally addresses
