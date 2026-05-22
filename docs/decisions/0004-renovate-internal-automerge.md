# 0004 — Renovate uses internal merger, not `platformAutomerge`

**Status**: Accepted
**Date**: 2026-05-22

## Context

We want Renovate to auto-merge safe dependency updates (patch, minor, digest, lockfile-maintenance, vulnerability alerts) so dependency hygiene doesn't become an unscheduled human chore. Majors still gate on human review.

Two merging strategies exist:

- **Platform automerge** (`platformAutomerge: true`): Renovate enables GitHub's native auto-merge on the PR; **GitHub** does the merge once required status checks pass. The "required" part depends on **branch protection rules**.
- **Internal automerge** (`platformAutomerge: false`): Renovate itself watches the PR's CI status and merges via API once all configured checks have passed.

GitHub's native auto-merge has a sharp edge: without required-status-check rules in branch protection, _it merges as soon as it's enabled_ — even before CI has finished running. The "wait for status checks" behaviour is opt-in via branch protection.

Our repo is **private** and we don't have GitHub Pro, so **branch protection isn't available**. If we set `platformAutomerge: true`, Renovate's PRs would merge instantly, bypassing all CI checks.

## Decision

`"platformAutomerge": false` at the top of `renovate.json`. Renovate's internal merger watches all CI status checks and only merges once they're green. No branch protection required.

## Alternatives considered

| Option                                                   | Why not                                                                                                                                                                                                                                                     |
| -------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **`platformAutomerge: true` + GitHub branch protection** | The right answer for a public/Pro repo. Not available to us without paying for GitHub Pro on a hobby project. Listed in `README.md` deferred items — when branch protection is eventually configured, flip this flag.                                       |
| **`automerge: false` (no automerge at all)**             | The CI gates (typecheck, lint, 29 unit + 32 e2e, build, Lighthouse, axe a11y, html-validate, audit) are _exactly_ the rigorous checks that make automerge safe. Disabling it makes every dep update a human chore — defeating the point of investing in CI. |
| **Manual review of every Renovate PR**                   | Hours of weekly toil for a one-person project. No.                                                                                                                                                                                                          |

## Consequences

**What we accept:**

- Slight loss of the GitHub auto-merge UI niceties (the green "Merge when ready" pill).
- Renovate's internal merger requires the GitHub App to have merge permission on the repo — granted at install time.

**What we gain:**

- Automerge works _correctly_ without depending on a feature we don't have.
- All CI gates run before merge — same safety properties as platform automerge with branch protection, achieved differently.
- One less thing to configure when we eventually add branch protection. The flag exists, ready to flip.

## When to revisit

- We add GitHub Pro to the personal account, or migrate the repo to a GitHub org with branch protection.
- We add a `main`-protecting rule via GitHub's free CodeOwners-based enforcement (limited but free).
- Renovate's internal merger has a bug or limitation that makes platform automerge the only viable option.

When any of those happen: flip `platformAutomerge: false` → `true` in `renovate.json` and configure the branch protection. No other code changes required.
