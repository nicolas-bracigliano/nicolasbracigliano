# Architecture Decision Records

One file per consequential trade-off. Lightweight format: status, date, context, decision, alternatives, consequences. The point isn't to bureaucratise — it's to make the _why_ of yesterday's choice legible to future-you (or anyone else who picks the code up).

When in doubt about whether a decision rates an ADR, ask: **would I want to know why this was decided in two years?** If yes, write it.

## Index

| ID                                                    | Status   | Title                                                            |
| ----------------------------------------------------- | -------- | ---------------------------------------------------------------- |
| [0001](./0001-cloudflare-pages.md)                    | Accepted | Cloudflare Pages as host                                         |
| [0002](./0002-csp-style-src-unsafe-inline.md)         | Accepted | Loosen `style-src` to enable native View Transitions             |
| [0003](./0003-mirrored-bilingual-routes.md)           | Accepted | Mirrored `/en` `/es` route trees with `ROUTES` map               |
| [0004](./0004-renovate-internal-automerge.md)         | Accepted | Renovate uses internal merger, not `platformAutomerge`           |
| [0005](./0005-theme-state-auto-override-retire.md)    | Accepted | Theme state model — auto + override + silent retire              |
| [0006](./0006-no-first-paint-animation.md)            | Accepted | No first-paint animation (axe + animation timing)                |
| [0007](./0007-tsconfig-strictness-flipped.md)         | Accepted | Tighten TypeScript strictness flags (post-bootstrap)             |
| [0008](./0008-externalize-hoisted-scripts-for-csp.md) | Accepted | Externalize every hoisted `<script>` so production CSP allows it |
| [0009](./0009-github-actions-sha-pinning.md)          | Accepted | Pin every GitHub Action to an immutable SHA                      |

## ADR format

```markdown
# {ID} — {Title}

**Status**: Accepted | Superseded by [{ID}](./...) | Deprecated
**Date**: YYYY-MM-DD

## Context

What problem are we solving? What constraints apply?

## Decision

What did we choose?

## Alternatives considered

What else could we have done? Why didn't we?

## Consequences

What do we now have to live with?
```

ADRs are append-only. If a decision changes, write a new ADR that supersedes the old one — never rewrite history. The chain of supersessions is part of the record.
