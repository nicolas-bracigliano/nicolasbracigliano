# 0004 — Renovate uses internal merger, not `platformAutomerge`

**Status**: Accepted — pending revisit. The original justification (branch protection unavailable on a private repo without GitHub Pro) evaporated when the repo went public on 2026-05-25. See the **Postscript** for the revisit conditions; the flag still reads `platformAutomerge: false` until branch protection is configured and validated.
**Date**: 2026-05-22

## Context

We want Renovate to auto-merge safe dependency updates (patch, minor, digest, lockfile-maintenance, vulnerability alerts) so dependency hygiene doesn't become an unscheduled human chore. Majors still gate on human review.

Two merging strategies exist:

- **Platform automerge** (`platformAutomerge: true`): Renovate enables GitHub's native auto-merge on the PR; **GitHub** does the merge once required status checks pass. The "required" part depends on **branch protection rules**.
- **Internal automerge** (`platformAutomerge: false`): Renovate itself watches the PR's CI status and merges via API once all configured checks have passed.

GitHub's native auto-merge has a sharp edge: without required-status-check rules in branch protection, _it merges as soon as it's enabled_ — even before CI has finished running. The "wait for status checks" behaviour is opt-in via branch protection.

At the time this ADR was written, the repo was **private** and we didn't have GitHub Pro, so **branch protection wasn't available**. With `platformAutomerge: true`, Renovate's PRs would have merged instantly, bypassing all CI checks. This constraint no longer applies on a public repo (see Postscript), but the original decision still holds until branch-protection rules are configured to require the CI gates.

## Decision

`"platformAutomerge": false` at the top of `renovate.json`. Renovate's internal merger watches all CI status checks and only merges once they're green. No branch protection required.

## Alternatives considered

| Option                                                   | Why not                                                                                                                                                                                                                                                     |
| -------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **`platformAutomerge: true` + GitHub branch protection** | The right answer once branch protection is configured. The repo became public on 2026-05-25, making branch protection free and available — but the flag stays `false` until the protection rules are set up and the migration validated. See Postscript.    |
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

- Branch protection rules on `main` are configured (now possible — see Postscript).
- Renovate's internal merger develops a bug or limitation that makes platform automerge the only viable option.

When any of those happen: flip `platformAutomerge: false` → `true` in `renovate.json` and configure the branch protection. No other code changes required.

## Postscript — 2026-05-25

The repo became **public**. Branch protection on `main` is now free — the gating constraint that justified `platformAutomerge: false` (private repo, no GitHub Pro) has evaporated.

The flag has not been flipped yet. Doing so safely requires:

1. **Branch-protection rules configured on `main`**: require all CI status checks to pass before merge (Build & Verify, Lighthouse CI, E2E tests, Detect changed paths, Lint workflow pins, Check deploy prerequisites). Without these, `platformAutomerge: true` re-introduces the "merge before CI finishes" sharp edge documented in Context above.
2. **A test Renovate PR** that exercises the new path end-to-end (Renovate opens PR → GitHub auto-merge is queued → CI runs → CI passes → GitHub merges automatically). The first time this runs it should be a low-risk dep update (a patch bump) so any misconfiguration surfaces on something cheap.
3. **`renovate.json`** flips `platformAutomerge: false → true`; the `dependencyDashboard` and per-PR rules stay as-is. No other code changes required.

This revisit will land as its own PR. Until then, the Decision still holds as the safer default.

## Postscript — 2026-05-25 (later)

The Mend Renovate GitHub App was installed via the [developer.mend.io](https://developer.mend.io) portal. Renovate is now actively consuming `renovate.json`; the auto-created Dependency Dashboard issue is the canonical view of what's queued at any given time.

Branch protection on `main` is configured (the "Base" ruleset, scoped to `~DEFAULT_BRANCH`), but it does not yet include a `required_status_checks` rule. Until that's added, `platformAutomerge: true` would let GitHub merge the moment Renovate enables it, before CI completes — the failure mode this ADR was written to prevent. The flag stays at `false`.

The flip to `platformAutomerge: true` will land as a separate PR that does three things together: adds `required_status_checks` (Build & Verify, Lighthouse CI, E2E tests, Lint workflow pins (ADR 0009), Check deploy prerequisites) to the Base ruleset, flips the flag in `renovate.json`, and amends this ADR with the final postscript closing the loop.
