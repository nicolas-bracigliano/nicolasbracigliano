#!/usr/bin/env bash
# Enforce ADR 0009 — every `uses:` reference in `.github/workflows/`
# must be `@<40-char SHA> # vTAG`. Floating refs (`@v5`, `@main`)
# and unannotated SHAs both fail the check.
#
# Acknowledged limitation: this is a syntactic check. It does not
# verify that the SHA actually resolves to the version in the
# trailing `# v...` comment (that would require network access via
# `gh api git/refs/tags/...`). Semantic correctness of the comment
# is on the author + reviewer; Renovate catches version drift over
# time. See `docs/decisions/0009-github-actions-sha-pinning.md`.
#
# Local usage:   pnpm run lint:actions
# CI usage:      one step in `ci.yml`'s Build & Verify job.

set -e

WORKFLOWS_DIR="${1:-.github/workflows}"

if [ ! -d "$WORKFLOWS_DIR" ]; then
  echo "::error::Directory not found: $WORKFLOWS_DIR"
  exit 1
fi

# Match `@<40-char-hex> # vMAJOR(.MINOR(.PATCH)?(-suffix)?)?`.
# The optional `-suffix` covers tags like `v2.3.9-rc1` or
# `v1.0.0-beta` if upstream ever ships one.
SHA_TAG_RE='@[a-f0-9]{40}[[:space:]]+#[[:space:]]+v[0-9]+(\.[0-9]+){0,2}(-[a-zA-Z0-9.-]+)?$'

errors=0
checked=0

# Find every `uses:` line across workflow files. Skip local-action
# refs (`uses: ./...`) — those are paths into the repo and don't
# carry a SHA.
while IFS= read -r line; do
  trimmed=$(echo "$line" | sed 's/^[[:space:]]*-[[:space:]]*//; s/^[[:space:]]*//')

  # Skip local action references.
  if echo "$trimmed" | grep -qE '^uses:[[:space:]]+\./'; then
    continue
  fi

  checked=$((checked + 1))
  if ! echo "$trimmed" | grep -qE "$SHA_TAG_RE"; then
    echo "::error::Unpinned or unannotated action: $trimmed"
    errors=$((errors + 1))
  fi
done < <(grep -hE '^[[:space:]]*-?[[:space:]]*uses:[[:space:]]+' "$WORKFLOWS_DIR"/*.yml 2>/dev/null)

if [ "$errors" -gt 0 ]; then
  echo ""
  echo "ADR 0009 requires every \`uses:\` ref to be:"
  echo "    uses: owner/repo@<40-char SHA> # vTAG"
  echo ""
  echo "See docs/decisions/0009-github-actions-sha-pinning.md for the"
  echo "verifier command and the rationale."
  exit 1
fi

echo "All $checked workflow pins follow ADR 0009 ✓"
