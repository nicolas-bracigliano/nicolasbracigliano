# Phase 0 — Infrastructure setup

This is the dashboard-clicking checklist that turns the green-on-`main`
codebase into a real production deployment. The code side (CI deploy
job, `wrangler.toml`, security workflows, `_headers`) is already
merged and waiting for secrets. Once you finish the steps below, the
next push to any branch produces a working preview URL on Cloudflare
Workers and `nicolasbracigliano.com` resolves to a real site.

**Estimated time**: ~3 hours, spread across one or two sittings.
Several steps have wait windows (DNSSEC propagation, mail MX
validation) so it's fine to do this in chunks.

**Cross-references**:

- `docs/security.md` — rationale for each security-relevant choice
  below (DNSSEC, commit signing, server-side analytics, …). Read it
  alongside if you want the "why".
- `public/_headers` — the live security headers; already deployed-
  ready, no edits needed for Phase 0.
- `~/.claude/plans/lets-review-the-plan-valiant-mccarthy.md` § "Phase
  0" — the original spec these steps implement.

---

## Before you start

Verify you have:

- [ ] Owner-level access to the GitHub repo (`nicolas-bracigliano/nicolasbracigliano`).
- [ ] A Cloudflare account, or willingness to create one (free tier
      is fine for everything here; Pages, DNS, and Analytics all sit
      in the free plan).
- [ ] Registrar access for `nicolasbracigliano.com` (to point the
      nameservers at Cloudflare and add the DNSSEC DS record).
- [ ] An SSH key on this machine that's NOT shared with another use
      (or willingness to generate one — Step 6 covers it).
- [ ] A mailbox for `security@nicolasbracigliano.com` (Step 7; now an
      iCloud+ Custom Email Domain address — see
      [ADR 0015](./decisions/0015-mail-on-icloud-custom-domain.md)).

Open these tabs and keep them open through the session:

- <https://dash.cloudflare.com/>
- <https://github.com/nicolas-bracigliano/nicolasbracigliano/settings>
- Your registrar's DNS/nameserver management page.

---

## Step 1 — Cloudflare account + Worker (Static Assets)

**Goal**: a Cloudflare Worker named `nicolas-bracigliano` (matching
the `name` in `wrangler.toml` at the repo root) hosting the Astro
build via the **Workers Static Assets** binding. Pushes from `main`
deploy to production; pushes from any other branch upload a preview
version reachable at `preview-<worker>.<account>.workers.dev`.

We use **Workers + Static Assets** (Cloudflare's unified hosting
product) rather than the legacy Pages product. Both still work as
of 2026, but Workers is where Cloudflare's roadmap points and what
the dashboard onboarding now defaults to.

1. Sign in to <https://dash.cloudflare.com/>. Create an account if
   needed — use an email you control long-term, not a vendor address.
2. Left sidebar → **Compute (Workers)** → **Workers & Pages** →
   **Create** → **Worker**. (The dashboard may also offer "Import
   a repository" or a framework picker; either path is fine — the
   goal is "a Worker named `nicolas-bracigliano` exists on this
   account".)
3. **Worker name**: `nicolas-bracigliano` (lowercase, hyphenated,
   no underscores — Cloudflare uses this as the
   `*.<account>.workers.dev` subdomain).
4. If the onboarding asks for a build command, build output, or
   framework preset: **skip or pick the most minimal option**. The
   real config lives in `wrangler.toml` in this repo, not on the
   dashboard. The dashboard's build configuration is only used if
   you let Cloudflare auto-build from Git — we don't (see step 5).
5. **Disconnect Git integration** if the onboarding wired it up:
   - Worker dashboard → **Settings** → **Build** → find the
     **Git repository** row → click **Disconnect**.
   - **Reason**: our CI workflow in `.github/workflows/ci.yml`
     gates every deploy on typecheck / lint / vitest /
     lighthouse / e2e all passing. Cloudflare's auto-build runs on
     every push regardless of test status — the wrong default for
     this project. Two parallel deploy paths also race each other.
   - The Worker target stays; only the auto-build watcher goes.
     Our CI pushes the built `dist/` to the same Worker via the
     `wrangler deploy` API.

### If your Worker has a different name

The CI workflow reads the deploy target from `wrangler.toml`'s
`name` field. If the Worker on Cloudflare is named anything other
than `nicolas-bracigliano`, edit `wrangler.toml`:

```toml
name = "your-worker-name-here"
```

`wrangler.toml` is the **single source of truth** for the deploy
target — no separate GitHub variable, no dashboard config to keep
in sync.

### Best practices

- **Disconnect Git integration on the Worker (step 5 above).** Two
  deploy paths running in parallel waste compute and race on which
  version wins, and Cloudflare's auto-build doesn't honour our
  test gates.
- **Don't add `wrangler.toml` overrides in the dashboard.** A few
  Worker settings (compatibility date, assets directory) can be
  set both in the repo's `wrangler.toml` and on the dashboard.
  Always use the repo file — dashboard overrides drift silently.
- **Account ID** — note the Account ID shown in the Cloudflare
  dashboard's right sidebar. You'll need it for Step 5 (GitHub
  secrets).

---

## Step 2 — DNS + custom domain

**Goal**: `nicolasbracigliano.com` and `www.nicolasbracigliano.com`
both resolve to the Cloudflare Worker.

1. In the Cloudflare dashboard sidebar: **Websites** → **+ Add a
   site**. Enter `nicolasbracigliano.com`. Pick the **Free** plan.
2. Cloudflare will scan your current DNS and offer to import existing
   records. Accept whatever it finds (MX, TXT, etc. — they stay
   intact). Add or verify:
   - `A` record: `@` (apex) → `192.0.2.1` (placeholder; Cloudflare
     will rewrite this when you attach the Worker — actual IP comes
     from CF's anycast pool). **Proxy status: Proxied (orange
     cloud).**
   - `CNAME` record: `www` → `nicolasbracigliano.com`. Proxied.
3. Cloudflare will give you two nameservers (something like
   `xena.ns.cloudflare.com` + `yuri.ns.cloudflare.com` — they're
   randomized per account). Copy those.
4. Go to your domain registrar's nameserver management page. Replace
   the existing nameservers with the two Cloudflare names. Save.
   - Propagation usually takes 5-30 minutes but can take up to 24
     hours. Cloudflare emails you when it's confirmed.
5. Back in Cloudflare: **Workers & Pages** → click
   `nicolas-bracigliano` → **Settings** → **Domains & Routes** →
   **+ Add**. Add both:
   - `nicolasbracigliano.com`
   - `www.nicolasbracigliano.com`
   - Cloudflare automatically writes the CNAME / AAAA records — it'll
     replace your placeholder `A` from step 2.2.

### Best practices

- **Do enable `www` even if you don't intend to use it.** Catches
  visitors who type the subdomain reflexively; Cloudflare can
  redirect `www` → apex via a Page Rule (free tier includes 3 rules).
- **Don't disable DNSSEC anywhere upstream** while migrating. If your
  current registrar has DNSSEC enabled, leave it on — the next step
  re-enables it on the Cloudflare side.

### Verification

```sh
dig nicolasbracigliano.com NS +short
# Should show two `*.ns.cloudflare.com` names

dig nicolasbracigliano.com A +short
# Should show two anycast IPs (104.x.x.x or 172.x.x.x range)

curl -I https://nicolasbracigliano.com/en/
# Should return 200 OK with `server: cloudflare` and all 9
# security headers (CSP, HSTS, X-Frame-Options, etc.) once the
# Worker deploys. Until deploy works, expect a Workers-default
# error page or HTTP 522.
```

---

## Step 3 — DNSSEC

**Goal**: chain-of-trust signatures on every DNS response, so a
hostile resolver can't spoof `nicolasbracigliano.com`'s records.

1. In Cloudflare: pick the `nicolasbracigliano.com` zone → **DNS** →
   **Settings**. Scroll to **DNSSEC**. Click **Enable DNSSEC**.
2. Cloudflare shows you a **DS record** (Digest, Algorithm, Key Tag,
   Digest Type). Copy the four values.
3. Go to your registrar's DNSSEC settings (varies wildly by
   registrar — search "DNSSEC" in the registrar's domain dashboard).
   Paste the four values into the DS record entry. Save.
4. Wait 5-60 minutes. Cloudflare's DNSSEC tab will flip from
   "Pending" to "DNSSEC is active".

### Best practices

- **Don't change the Cloudflare-side DS record after publishing it
  to the registrar.** If you ever need to rotate it (e.g., key
  rollover), Cloudflare orchestrates this automatically. Manual
  rotations risk a DNS-resolution outage for hours-to-days.
- **Don't enable DNSSEC at your registrar before you publish the DS
  record from Cloudflare.** Doing it the other way around causes
  validation failures and the domain looks broken to resolvers that
  enforce DNSSEC.

### Verification

```sh
dig +dnssec nicolasbracigliano.com
# Look for RRSIG records in the ANSWER section.

dig DS nicolasbracigliano.com @8.8.8.8 +short
# Should show the same digest you pasted into the registrar.

# Or via a one-shot online checker:
# https://dnssec-analyzer.verisignlabs.com/nicolasbracigliano.com
```

If anything red appears in the Verisign analyzer, do NOT proceed to
production traffic. DNSSEC failures cause hard resolution failures
on resolvers that enforce (~20% of public traffic).

---

## Step 4 — Cloudflare Web Analytics

**Goal**: per-page traffic analytics without shipping any JavaScript
to the browser. Cloudflare counts requests at the edge.

1. In Cloudflare: left sidebar → **Analytics & Logs** → **Web
   Analytics**. Click **Manage site** for `nicolasbracigliano.com`.
2. **Important**: pick **Server-side analytics** (not "Add JS
   snippet"). The free server-side mode reads requests at
   Cloudflare's edge — no client JS, no `<script>` tag, nothing to
   block.
3. Save. Analytics start populating within a few minutes of the
   first request hitting the deployed site.

### Best practices

- **Server-side analytics has no PII by design.** No cookies, no
  fingerprinting, no GDPR consent banner needed. Don't add Google
  Analytics or Plausible "for completeness" — the design system §
  doesn't want client-side tracking JS.
- **Don't enable bot-mode "I'm Under Attack"** unless you actually
  see a sustained attack. It triggers a JS challenge on every visit,
  which violates the no-JS-tracking budget and breaks the page-load
  experience for legitimate visitors.

---

## Step 5 — GitHub repo secrets

**Goal**: CI's deploy job has the credentials it needs to push the
built `dist/` to the Worker.

1. Generate a Cloudflare API token:
   - Cloudflare dashboard → **My Profile** (top right) → **API
     Tokens** → **Create Token**.
   - Use the **"Edit Cloudflare Workers"** template, then **edit
     permissions** before creating. We're deploying a Worker with
     Static Assets, so the Workers permissions are required;
     Pages is not used by this project.
     - **Account → Workers Scripts → Edit** ← keep
     - **Account → Account Settings → Read** ← keep
     - **Account → Cloudflare Pages → Edit** ← REMOVE (we use
       Workers, not Pages)
     - **Zone → Workers Routes → Edit** ← keep (needed once a
       custom domain is attached to the Worker in Step 2)
   - **Account Resources**: Include → Specific account → your
     account.
   - **Zone Resources**: Include → All zones from an account → your
     account.
   - **Client IP Address Filtering**: leave open (CI runs from
     ephemeral GitHub-hosted runners).
   - **TTL**: set an expiry (12 months is reasonable). Calendar a
     reminder to rotate.
   - Click **Continue to summary** → **Create Token**. **Copy the
     token immediately** — it's shown only once.
2. Copy your Cloudflare **Account ID** (right sidebar of any zone
   dashboard, or **Workers & Pages** → **Overview**).
3. Go to **GitHub** → repo → **Settings** → **Secrets and variables**
   → **Actions** → **New repository secret**. Add two:
   - `CLOUDFLARE_API_TOKEN` ← the token from step 1
   - `CLOUDFLARE_ACCOUNT_ID` ← from step 2
4. Push a small change (or re-run the latest workflow on `main`). The
   **Deploy to Cloudflare Workers** step should flip from `SKIPPED`
   to `SUCCESS`.

### Best practices

- **Scope the API token to Workers only.** The Cloudflare template
  pre-selects Workers + Pages permissions; remove Pages (we don't
  use it). Future-you wants the blast radius small.
- **Set an expiry.** No-expiry tokens become forgotten ambient
  credentials.
- **Don't put the token in `.env` files or `package.json`.** Only
  GitHub Secrets (encrypted at rest, masked in workflow logs).
- **Rotate when in doubt.** If you suspect a leak — anywhere; the
  CI logs, a screenshot, a paste — revoke and re-issue. Takes
  90 seconds.

### Verification

```sh
gh secret list
# Should show CLOUDFLARE_API_TOKEN and CLOUDFLARE_ACCOUNT_ID

gh workflow run ci.yml --ref main
# Watch the "Deploy to Cloudflare Workers" step succeed
```

After the deploy succeeds, you'll have a `<worker-name>.<account>.workers.dev`
URL plus the real `nicolasbracigliano.com` URL serving content.
Non-`main` branches deploy as preview versions of the same Worker,
reachable at `preview-<worker-name>.<account>.workers.dev`.

---

## Step 6 — SSH commit signing (local + GitHub)

**Goal**: every commit you push to GitHub is signed with your SSH
key. Pairs with the `pre-push` lefthook that refuses unsigned
commits, and once GitHub branch protection lands (Step 8 below),
becomes server-side-enforced.

The `docs/security.md` file has the rationale + recipe; the steps
below are the action set.

1. Pick an SSH key dedicated to signing (separate from auth keys).
   If you don't have one, generate it:

   ```sh
   ssh-keygen -t ed25519 -f ~/.ssh/id_ed25519_signing -C "nicolas.bracigliano@signing"
   ```

2. Configure git globally:

   ```sh
   git config --global gpg.format ssh
   git config --global user.signingkey ~/.ssh/id_ed25519_signing.pub
   git config --global commit.gpgsign true
   ```

3. Add the **public** half of the key to GitHub:
   - GitHub → **Settings** → **SSH and GPG keys** → **New SSH key**.
   - **Key type**: **Signing Key** (not "Authentication Key" — that's
     a separate slot).
   - Title: something like `Nicolas — signing key (2026)`.
   - Paste the contents of `~/.ssh/id_ed25519_signing.pub`.

### Best practices

- **Separate signing key from auth key.** If your auth key gets
  exposed (e.g., laptop theft), revoking auth doesn't revoke the
  signing identity. Compromising one doesn't compromise the other.
- **Don't sign on the GitHub web UI.** Edits via the web UI are
  always unsigned. Treat web edits as forbidden on `main`; the
  upcoming branch protection rule (Step 8) rejects them.

### Verification

```sh
echo "test commit signing" > /tmp/.sigtest && cd /tmp
git init -q && git add .sigtest && git commit -m "sig test" -q
git log --show-signature -1
# Expect: "Good signature from ..." with your key
cd ~- && rm -rf /tmp/.sigtest /tmp/.git
```

---

## Step 7 — Mail for `security@`

**Status**: superseded — see
[ADR 0015](./decisions/0015-mail-on-icloud-custom-domain.md).
Mail for the domain now runs on **iCloud+ Custom Email Domain**
(cutover 2026-06-04), not Cloudflare Email Routing. The apex MX set
is exclusive, so this was a swap, not an addition: Email Routing is
retired and its records are gone from the zone.

**Goal** (unchanged): `security@nicolasbracigliano.com` reaches you,
so the RFC 9116 `security.txt` contact isn't decorative.

If you're standing this up fresh on a new domain, ADR 0015 § Decision
has the record set and the reasoning. The steps below are kept as the
historical record of what Phase 0 actually did — don't follow them.

<details>
<summary>Original Phase 0 steps (Cloudflare Email Routing, retired)</summary>

1. Cloudflare dashboard → `nicolasbracigliano.com` zone → **Email**
   → **Email Routing** → **Get started**.
2. Cloudflare adds the required MX + TXT records automatically.
   Approve.
3. Create a route:
   - **Custom address**: `security@nicolasbracigliano.com`
   - **Action**: **Send to an email** → your real inbox.
4. Cloudflare emails your real inbox a verification link. Click it.

The limitation that retired this: Email Routing forwards but offers
no SMTP submission, so a report arriving at `security@` could be read
but not replied to _as_ that address.

</details>

### Best practices

- **Don't list more than one contact in `public/.well-known/security.txt`.**
  Single point of receipt = no ambiguity. The current file lists
  `security@nicolasbracigliano.com` only; keep it that way.
- **Test before relying.** From a different email account:
  `Subject: test  Body: hello` to `security@nicolasbracigliano.com`.
  Should land within a minute. Then reply, and confirm the `From:`
  is the custom domain — that's the half Email Routing couldn't do.
- **`security.txt`'s `Expires:` rotates itself.** Currently
  `2027-05-21`. `security-txt-rotate.yml` runs monthly and opens a PR
  when fewer than 60 days remain — no manual step, but the PR does
  need merging.

### Verification

```sh
# Use DoH, not dig: the origin network intercepts port-53 DNS and
# serves stale forged answers even against an authoritative server
# (see ADR 0015 § Verification).
curl -s -H 'accept: application/dns-json' \
  "https://cloudflare-dns.com/dns-query?name=nicolasbracigliano.com&type=MX" \
  | python3 -c 'import sys,json;[print(a["data"]) for a in json.load(sys.stdin)["Answer"]]'
# → 10 mx01.mail.icloud.com.  /  10 mx02.mail.icloud.com.

# Then send a test from another inbox, and reply to it.
```

---

## Step 8 — Branch protection

**Status**: available — free since the repo went public on
2026-05-25. Recommended once Step 6 (commit signing) is wired up.

1. GitHub repo → **Settings** → **Branches** → **Add branch
   protection rule**.
2. **Branch name pattern**: `main`.
3. Enable:
   - **Require a pull request before merging** (yes)
   - **Require status checks to pass** — pick `Build & verify`,
     `Lint workflow pins (ADR 0009)`, `Lighthouse CI`,
     `E2E tests (Playwright)`. Mark them required.
   - **Require branches to be up to date before merging** (yes)
   - **Require signed commits** (yes — pairs with Step 6)
   - **Restrict who can push** → just you
   - **Do not allow bypassing the above settings** (yes — even for
     admins; intentional friction)
4. Save.
5. Flip Renovate's `platformAutomerge: false` → `true` in
   `renovate.json` so it can self-merge patch bumps that pass CI.
   See ADR 0004's postscript for the safe-rollout sequence.

### Best practices

- **Don't enable `Require linear history`** unless you're sure.
  Squash-merges produce a linear history naturally on this repo;
  the rule mostly fires false on revert commits.
- **Don't add too many required checks at once.** Start with the 3
  above. Add more (e.g., per-route Lighthouse budgets) when they're
  proven stable.

---

## Final verification

Run all of these after Steps 1–7 are done. If anything fails, fix
that step before continuing to Phase 2.

```sh
# DNS + DNSSEC
dig nicolasbracigliano.com NS +short        # 2 cloudflare names
dig +dnssec nicolasbracigliano.com          # RRSIG present
dig DS nicolasbracigliano.com @8.8.8.8 +short

# HTTPS + security headers
curl -I https://nicolasbracigliano.com/en/  # 200, server: cloudflare,
                                            # all 9 security headers

# Public security headers audit
# Open in browser:
# https://securityheaders.com/?q=nicolasbracigliano.com
# Should return "A+".

# GitHub side
gh secret list                              # both CF secrets shown
gh run list --limit 1                       # most recent CI green,
                                            # including the deploy step

# Commit signing
git log -1 --show-signature                 # any commit, signed

# Email (ADR 0015 — iCloud+ Custom Email Domain)
# Send a test to security@nicolasbracigliano.com from another inbox;
# expect delivery within ~60 seconds. Reply, and confirm the From: is
# the custom domain and the far end sees dkim=pass / dmarc=pass.
```

---

## What's next (Phase 2)

Once Phase 0 lights up, you've got two parallel tracks:

- **Phase 2 (real content)** — drop your real bio / notes / works /
  now / colophon copy into `src/content/{pages,notes,works}/{en,es}/`.
  Mostly markdown editing, no code.
- **Phase 3 (polish)** — Pagefind search UI on `/notes` (shipped
  instead as the ⌘K command palette — see design-system §11), avatar
  integration once the SVG/AVIF asset is ready, print-stylesheet
  Phase-3 expansion (URL after-link, per-route layout tuning).

The plan at `~/.claude/plans/lets-review-the-plan-valiant-mccarthy.md`
has the full breakdown for both. Phase 4 (pre-launch QA) waits on
those two; Phase 5 (launch day) waits on Phase 4.

If anything in Phase 0 above is unclear or you hit a registrar /
Cloudflare UI mismatch, drop me the step + the screen you're stuck
on and I'll work through it.
