# Security

## Vulnerability disclosure

Report suspected vulnerabilities privately to
[security@nicolasbracigliano.com](mailto:security@nicolasbracigliano.com).
Include the affected URL or file, reproduction steps, and expected impact.
Please avoid posting exploit details or personal information in public issues.

The machine-readable contact is published at
[`public/.well-known/security.txt`](../public/.well-known/security.txt).

## Public repository boundary

Commit only source code, published content, tests, and documentation needed to
understand or contribute to the site. Keep credentials, account inventories,
access-control details, infrastructure runbooks, personal notes, plans, and
security audit reports outside the repository.

Ignored files are a convenience, not an access control. Review the staged diff
before committing. A content entry marked `draft` is excluded from the built
site but remains public if committed to this repository.

## Response headers

[`public/_headers`](../public/_headers) defines the static response headers.
[`src/lib/security-headers.ts`](../src/lib/security-headers.ts) applies the
same security headers to Worker-generated responses; unit tests check parity.
When changing headers, update both implementations and run the relevant tests.

### CSP delivery

CSP is delivered through response headers. Astro's ClientRouter creates
view-transition styles at runtime, so the policy permits inline styles while
keeping `script-src 'self'`. Hoisted scripts must remain external files.
See [ADR 0002](./decisions/0002-csp-style-src-unsafe-inline.md) and
[ADR 0008](./decisions/0008-externalize-hoisted-scripts-for-csp.md) for the
implementation constraints.

## Automated checks

The [security workflow](../.github/workflows/security.yml) runs dependency and
license checks, secret scanning, static analysis, and a `security.txt` expiry
check. Keep these checks and the local staged-secret hook enabled.
