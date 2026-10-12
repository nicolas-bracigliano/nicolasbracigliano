# 0004 — Renovate uses its internal merger

**Status**: Accepted
**Date**: 2026-05-22

## Context

Routine dependency updates should merge after validation, while major updates
and selected overrides require human review. The merge strategy needs to work
with the project's review and CI requirements.

## Decision

Keep `platformAutomerge: false` in [`renovate.json`](../../renovate.json).
Renovate monitors checks and uses its own merger. Update eligibility and review
requirements are defined by the package rules in that configuration.

## Consequences

Changes to the merge strategy need validation with a low-risk dependency PR.
CI requirements must continue to apply to automated merges independently of
the bot's own assessment of check results.

## When to revisit

Revisit if the internal merger no longer meets the project's needs. Validate
review requirements and failing-check behavior before enabling another merge
strategy.
