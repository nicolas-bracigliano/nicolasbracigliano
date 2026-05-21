# Security notes

## Commit signing

SSH commit signing is enforced server-side via branch protection on `main`.
The local mirror is the `pre-push` hook in `lefthook.yml` — it refuses to
push unsigned commits as a fast feedback loop.

Setup:

```bash
git config --global gpg.format ssh
git config --global user.signingkey ~/.ssh/id_ed25519.pub
git config --global commit.gpgsign true
```

Then add the **public** half of the SSH key to GitHub Settings → SSH and GPG
keys → **Signing keys** (separate section from authentication keys).

Edits via the GitHub web UI or mobile won't be signed. Treat them as forbidden
on `main` — the branch protection rule rejects them.

## DNSSEC

Enable DNSSEC for `nicolasbracigliano.com` in the Cloudflare DNS dashboard.
Cloudflare will produce a DS record (KSK). Copy that DS record to the registrar
for the apex domain. The chain of trust is live once the registrar publishes
the DS at the TLD level (usually within an hour).

Verify with:

```bash
dig +dnssec nicolasbracigliano.com
```

You should see `RRSIG` records alongside the answer set.

## Vulnerability disclosure

Use the alias `security@nicolasbracigliano.com` (forward to primary inbox).
RFC 9116 expects a long-lived contact; an alias is easier to retire/rotate
than the primary address. The CI `security-txt-expires` job fails the build
if `Expires` is < 30 days away.

## Analytics

Cloudflare Web Analytics is enabled in **server-side mode** for the zone.
Aggregates pageview / referrer / country stats from edge logs at the proxy
— no JS, no cookies, no CSP loosening, no PII.

## Draft preview

`getStaticPaths` filters on `status: 'published'`, so drafts are invisible
locally too. To preview a draft, flip `status: published` in a working copy,
do not commit, run `pnpm dev`.

## Token rotation

- **Cloudflare API token** — scoped to Pages on `nb-site` only. Rotate annually
  or on staff change. Rotate immediately on suspected leak.
- **GitHub Actions tokens** — workflows use `permissions: {}` at the top and
  only request the minimum scope per job. Audit on each PR that touches `.github/workflows/`.
