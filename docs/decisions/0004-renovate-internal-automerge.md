# 0004 — Renovate uses internal merger, not `platformAutomerge`

**Status**: Accepted — revisit closed 2026-09-26. The original justification (branch protection unavailable on a private repo) evaporated on 2026-05-25, but a new one replaced it: GitHub's native auto-merge doesn't honour the Renovate app's ruleset bypass, so with `Base`'s required review it would never complete. `platformAutomerge` stays `false` for good; CI is now enforced on Renovate's own merges by a separate `CI Gate` ruleset. See the **third Postscript**.
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

| Option                                                   | Why not                                                                                                                                                                                                                                                                                                                                                                                                                             |
| -------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **`platformAutomerge: true` + GitHub branch protection** | The right answer once branch protection requires the CI checks. The repo became public on 2026-05-25, making branch protection free and available. _Amended 2026-08-07: it was configured the same day (the `Base` ruleset), so the blocker is narrower than this row read — the ruleset has no `required_status_checks` rule, and the flag stays `false` until it does and the migration is validated._ See the second Postscript. |
| **`automerge: false` (no automerge at all)**             | The CI gates (typecheck, lint, 29 unit + 32 e2e, build, Lighthouse, axe a11y, html-validate, audit) are _exactly_ the rigorous checks that make automerge safe. Disabling it makes every dep update a human chore — defeating the point of investing in CI.                                                                                                                                                                         |
| **Manual review of every Renovate PR**                   | Hours of weekly toil for a one-person project. No.                                                                                                                                                                                                                                                                                                                                                                                  |

## Consequences

**What we accept:**

- Slight loss of the GitHub auto-merge UI niceties (the green "Merge when ready" pill).
- Renovate's internal merger requires the GitHub App to have merge permission on the repo — granted at install time.

**What we gain:**

- Automerge works _correctly_ without depending on a feature we don't have.
- All CI gates run before merge — same safety properties as platform automerge with branch protection, achieved differently.
- One less thing to configure when the required-checks rule lands. The flag exists, ready to flip.

## When to revisit

- A `required_status_checks` rule is added to the `Base` ruleset on `main`. Branch protection itself has been configured since 2026-05-25; this rule is the single piece still missing, and it is the piece this ADR depends on. See the second Postscript.
- Renovate's internal merger develops a bug or limitation that makes platform automerge the only viable option.

When any of those happen: flip `platformAutomerge: false` → `true` in `renovate.json` and add the required-checks rule to the ruleset. No other code changes required.

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

## Postscript — 2026-09-26: the flip is off, the gate is on

The plan in the second postscript, adding `required_status_checks` to `Base` and flipping `platformAutomerge` to `true`, turns out to be wrong on both halves.

**Why not add the rule to `Base`.** Renovate merges today because the Renovate app (integration `2740`) is a `Base` bypass actor with `bypass_mode: always`. That's what waives the review rule (1 approval plus code-owner review) on PRs nobody reviews. But a bypass covers every rule in its ruleset, so a `required_status_checks` rule inside `Base` wouldn't bind Renovate either. The one gate on a Renovate merge would still be Renovate's own look at the check runs, which its maintainers call ["just a basic/easy one"](https://github.com/renovatebot/renovate/discussions/28601).

**Why not flip `platformAutomerge`.** GitHub's native auto-merge doesn't honour an app bypass on the approval rule: the PR sits blocked with every check green ([reported since January 2025, acknowledged by GitHub in March 2026, unfixed as of September 2026](https://github.com/gwenneg/mintmaker-automerge/pull/38)). With `Base` requiring review, every Renovate PR would wait forever. The repo's "Allow auto-merge" setting was briefly switched on during this revisit and then off again. Nothing uses it.

**What landed instead.** A second ruleset, `CI Gate` (id `24025027`), targets `~DEFAULT_BRANCH` and carries a single rule: `required_status_checks` for `Build & Verify`, `Lighthouse CI` and `E2E tests (Playwright)`, each pinned to the GitHub Actions app (`integration_id: 15368`), not strict. Its only bypass actor is the admin role, so Renovate is outside it. Renovate still merges through its own API call, and `Base` still waives the review, but GitHub now rejects that merge unless all three checks passed. This is the same safety property the flip was meant to deliver, without depending on GitHub fixing the bypass bug.

The required set follows `docs/ci.md` § Status checks, not the list above. `Lint workflow pins (ADR 0009)` is a step inside `Build & Verify`, not a check of its own. `Check deploy prerequisites` and `Deploy to Cloudflare Workers` stay informational, so a Cloudflare outage can't block merges. Jobs skipped by the path filter report success, so docs-only PRs still merge.

**When to revisit, now.** Only if GitHub's native auto-merge starts honouring app bypass actors _and_ there's a reason to prefer it. The likeliest reason is throughput: the internal merger lands about one PR per Renovate run and rebases the rest in between. Even then, keep `CI Gate` as a separate ruleset, since folding it into `Base` would put Renovate back outside it.
