# CI reference

[`.github/workflows/ci.yml`](../.github/workflows/ci.yml) defines the build,
test, and deployment pipeline. Workflow configuration is the source of truth
for triggers, permissions, and deployment behavior.

## Quality checks

| Check                  | Purpose                                                                            |
| ---------------------- | ---------------------------------------------------------------------------------- |
| Build & Verify         | Typecheck, lint, workflow pins, formatting, unit tests, build, and HTML validation |
| Lighthouse CI          | Performance, accessibility, best practices, SEO, and resource budgets              |
| E2E tests (Playwright) | Browser behavior and accessibility regression checks                               |

Lighthouse and Playwright run after the build. Path filtering can skip these
jobs for documentation-only changes. Preserve check names when editing the
workflow; renaming a required check also requires updating repository settings.

## Local verification

```sh
pnpm verify:fast   # typecheck, lint, workflow pins, formatting, unit tests
pnpm verify:slow   # build, HTML validation, Playwright, Lighthouse
pnpm verify        # both suites
```

Use the fast suite during development and the slow suite for changes that
affect rendered pages or browser behavior. Deployment credentials are not
needed for local verification.

## Deployment checks

The deployment job uses the verified build artifact and runs route, body, and
header smoke checks. [`scripts/smoke-routes.ts`](../scripts/smoke-routes.ts)
derives its routes from the shared route map and published content.
Its propagation retries are intentional: a newly deployed route may briefly
return 404 before the asset is available.

Header smoke checks verify presence. Unit tests verify the configured security
header values and parity between static and Worker responses.

## Workflow maintenance

Keep action references pinned to immutable SHAs and annotate their versions.
Run `pnpm lint:actions` after editing a workflow. A new quality check should
produce a clear pass/fail result and fit the existing path-filter strategy.
