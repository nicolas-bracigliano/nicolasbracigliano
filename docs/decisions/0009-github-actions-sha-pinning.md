# 0009 — Pin every GitHub Action to an immutable SHA

**Status**: Accepted
**Date**: 2026-05-25

## Context

GitHub Actions resolve `uses:` references at the time the workflow runs. A floating ref like `actions/checkout@v5` or `@main` does a fresh tag/branch lookup on every invocation, so the code that executes can change without any commit to this repo — silently, between two consecutive CI runs.

That's the well-documented [tj-actions/changed-files supply-chain attack](https://www.stepsecurity.io/blog/harden-runner-detection-tj-actions-changed-files-action-is-compromised) shape: attacker compromises an upstream action, force-pushes a malicious commit onto the major-version branch, every workflow downstream picks it up on the next run. SHA pinning is the only mitigation that survives that scenario, because a 40-char commit/tag SHA can't be changed under us — the worst an attacker can do is publish a new tag pointing at a new SHA, which our pin won't pick up.

This convention emerged organically across `ci.yml`, `security.yml`, `security-txt-rotate.yml`, and `release-please.yml`. After it surfaced that the pin form was _inconsistent_ (commit SHAs for some actions, tag-object SHAs for others, depending on whether upstream tagged lightweight or annotated), and that several pins had drifted versions behind upstream without anyone noticing, it earned an ADR.

## Decision

Every `uses:` reference in any file under `.github/workflows/` pins to a full 40-char SHA, with a trailing `# vTAG` comment.

The mechanical rule:

```yaml
- uses: actions/checkout@de0fac2e4500dabe0009e67214ff5f5447ce83dd # v6.0.2
        │                │                                       │
        owner/repo       40-char immutable SHA                   readable version
```

### What kind of SHA?

Whichever one `gh api repos/<owner>/<repo>/git/refs/tags/<vTag> --jq .object.sha` returns. Don't normalize between commit-SHA and tag-object-SHA — both are immutable, both are valid pin targets, and `actions/checkout` v5 ships a lightweight tag (commit SHA) while `pnpm/action-setup` v6.0.8 ships an annotated tag (tag-object SHA). Forcing one form requires custom dereferencing logic and offers no security benefit.

Verifier:

```sh
gh api repos/<owner>/<repo>/git/refs/tags/<vTag> --jq '.object | "\(.sha) \(.type)"'
# → "de0fac2e4500dabe0009e67214ff5f5447ce83dd commit"  for actions/checkout v6.0.2
# → "d15e628ca66d93ee5f352c71671a7bc6a97af5c9 tag"     for pnpm/action-setup v6.0.8
```

If the type column says `commit`, that's the commit SHA — paste it.
If the type column says `tag`, that's the annotated tag-object SHA — also paste it as-is (don't dereference).

### What about first-party `actions/*`?

Same rule. `actions/*` is "first party" only in the sense that GitHub maintains it; the workflow still executes external code, and the compromise surface is identical. Treat it like any other third-party action.

### When to bump

When `gh api repos/<owner>/<repo>/releases/latest --jq '.tag_name'` reports a newer version _and_ the changelog doesn't introduce a runtime requirement we can't meet (most recent example: `actions/checkout v6` and `actions/setup-node v6` both raised the floor to Node 24, which `.nvmrc` already satisfies). Renovate, when properly configured for workflow files, will surface these as PRs (see [[ADR-0004]] on Renovate's role).

Bumps go through the same review as any other change: a PR with the new SHA, the `# vTAG` comment updated, and CI green before merge. No "bulk floating-ref upgrade then pin afterward" patterns — that defeats the point.

## Alternatives considered

| Option                                                | Why not                                                                                                                                                                                                                                |
| ----------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Float on `@vN` major versions**                     | Action maintainers commonly move `vN` to track latest patches. That's convenient but exactly the supply-chain vector this ADR rules out. The tj-actions/changed-files compromise exploited this.                                       |
| **Float on `@latest` / branch refs**                  | Worse than `@vN`. Branches are mutable by design.                                                                                                                                                                                      |
| **Pin commit SHAs only (dereference annotated tags)** | Adds a step (`git tag <X>^{commit}` or `gh api git/tags/<sha>`) without security benefit. Both forms are equally immutable. Verifier above accepts either.                                                                             |
| **Dependabot for workflow pins**                      | We use Renovate by [[ADR-0004]]. Dependabot would duplicate that surface. Renovate handles workflow pins when configured to scan `.github/workflows/**` — verifying its config is the action item, not switching tools.                |
| **Tag-signature verification on every bump**          | Stronger guarantee (the tagger's GPG/SSH signature would have to be compromised, not just the repo). Manual cost is high; we'd need tooling. Worth revisiting if we ever need it; for a personal site, SHA pinning is the right level. |

## Consequences

**Accepted cost:**

- Every action bump is a manual step. Renovate eases this when configured.
- The `# vTAG` comment can drift from reality if someone bumps the SHA without updating the comment. Code review catches this; no tooling enforcement today.
- Browsing the workflow files takes one extra cognitive step to see what version is in play (read past the SHA to the comment).

**Compensating controls:**

- The trailing `# vTAG` comment makes the pin readable at a glance, which mitigates the "is this SHA up to date?" question without forcing the reader to navigate to upstream.
- `gh api .../releases/latest` is a one-line check at audit time.

**Operational:**

- New action introductions: resolve the SHA via the verifier above, add the `# vTAG` comment, ship.
- Major version bumps: read the upstream changelog for runtime / API requirements before bumping. Most recent examples — `actions/checkout v6`, `actions/setup-node v6`, `peter-evans/create-pull-request v8`, `googleapis/release-please-action v5` — were all "now requires Node 24," which we already pin via `.nvmrc`.
- Bulk-audit of all pins: `gh api repos/<owner>/<repo>/releases/latest --jq '.tag_name'` per action, cross-reference with the `# vTAG` comment.

## When to revisit

- A tooling option lands that enforces SHA-pinning + comment-freshness in CI (e.g., a stricter `actionlint` or a custom check). Current state: linters flag floating refs as warnings but don't catch a stale comment.
- We move to GitHub Enterprise and want SAT / tag-signature attestation as a stronger pin. Worth revisiting at that point.
- The repo goes public + adopts GitHub Advanced Security; CodeQL's "Code scanning is not enabled" failure (security.yml history) goes away on its own and the supply-chain surface widens, justifying tighter controls.
