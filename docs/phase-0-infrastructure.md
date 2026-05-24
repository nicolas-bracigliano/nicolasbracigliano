# Phase 0 — Infrastructure setup

This is the dashboard-clicking checklist that turns the green-on-`main`
codebase into a real production deployment. The code side (CI deploy
job, wrangler config, security workflows, `_headers`) is already
merged and waiting for secrets. Once you finish the steps below, the
next push to any branch produces a working preview URL on Cloudflare
Pages and `nicolasbracigliano.com` resolves to a real site.

**Estimated time**: ~3 hours, spread across one or two sittings.
Several steps have wait windows (DNSSEC propagation, email-forwarding
MX validation) so it's fine to do this in chunks.

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
      is fine for everything here; Pages, DNS, Analytics, and Email
      Forwarding all sit in the free plan).
- [ ] Registrar access for `nicolasbracigliano.com` (to point the
      nameservers at Cloudflare and add the DNSSEC DS record).
- [ ] An SSH key on this machine that's NOT shared with another use
      (or willingness to generate one — Step 6 covers it).
- [ ] Your primary email inbox accessible (Step 7 forwards
      `security@nicolasbracigliano.com` there).

Open these tabs and keep them open through the session:

- <https://dash.cloudflare.com/>
- <https://github.com/nicolas-bracigliano/nicolasbracigliano/settings>
- Your registrar's DNS/nameserver management page.

---

## Step 1 — Cloudflare account + Pages project

**Goal**: a Cloudflare Pages project named `nicolas-bracigliano`
connected to this GitHub repo, so pushes from `main` (and PR branches)
auto-deploy.

1. Sign in to <https://dash.cloudflare.com/>. Create an account if
   needed — use an email you control long-term, not a vendor address.
2. In the left sidebar: **Compute (Workers)** → **Workers & Pages**.
   Click **Create application** → **Pages** → **Connect to Git**.
3. Authorize Cloudflare to read the repo (`nicolas-bracigliano/nicolasbracigliano`).
   Pick **"Only select repositories"** rather than "all repositories" —
   minimum-privilege.
4. Project name: **`nicolas-bracigliano`** (lowercase, hyphenated, no
   underscores — Cloudflare uses this as the `*.pages.dev` subdomain).
5. Build settings:
   - **Framework preset**: Astro
   - **Build command**: `pnpm build`
   - **Build output directory**: `dist`
   - **Root directory**: `/` (leave default)
   - **Environment variables**: leave empty for now (none required).
6. Build behaviour:
   - Enable **"Build on push for all branches"** so PR branches also
     produce preview URLs.
7. Save & deploy. The first build will fail — that's expected,
   because no GitHub-side secret is in place yet. We're using
   Cloudflare's Pages integration for the deploy _target_, but the CI
   workflow in `.github/workflows/ci.yml` is what actually triggers
   it. Continue to Step 5 below to wire that up; for now, you just
   need the Pages project to _exist_.

### Best practices

- **Do not** enable the Cloudflare Pages "automatic deployments from
  GitHub" if it offers — we want the deploy to be driven by our
  hand-tuned CI workflow, not Cloudflare's. (The choice depends on
  the Pages onboarding flow at the time you do this; if you can pick
  "manual / via API" do that. If only the GitHub auto-deploy option
  is offered, accept it; the workflow still functions.)
- **Account ID** — note the Account ID shown in the Cloudflare
  dashboard's right sidebar. You'll need it for Step 5.

---

## Step 2 — DNS + custom domain

**Goal**: `nicolasbracigliano.com` and `www.nicolasbracigliano.com`
both resolve to the Cloudflare Pages project.

1. In the Cloudflare dashboard sidebar: **Websites** → **+ Add a
   site**. Enter `nicolasbracigliano.com`. Pick the **Free** plan.
2. Cloudflare will scan your current DNS and offer to import existing
   records. Accept whatever it finds (MX, TXT, etc. — they stay
   intact). Add or verify:
   - `A` record: `@` (apex) → `192.0.2.1` (placeholder; Cloudflare
     will rewrite this when you attach the Pages project — actual IP
     comes from CF's anycast pool). **Proxy status: Proxied (orange
     cloud).**
   - `CNAME` record: `www` → `nicolasbracigliano.com`. Proxied.
3. Cloudflare will give you two nameservers (something like
   `xena.ns.cloudflare.com` + `yuri.ns.cloudflare.com` — they're
   randomized per account). Copy those.
4. Go to your domain registrar's nameserver management page. Replace
   the existing nameservers with the two Cloudflare names. Save.
   - Propagation usually takes 5-30 minutes but can take up to 24
     hours. Cloudflare emails you when it's confirmed.
5. Back in Cloudflare: **Workers & Pages** → click `nicolas-bracigliano` → **Custom domains** → **Set up a custom domain**. Add both:
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
# Pages deploy lands. Until deploy works, expect a Pages-default
# 404 page.
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
built `dist/` to your Pages project.

1. Generate a Cloudflare API token:
   - Cloudflare dashboard → **My Profile** (top right) → **API
     Tokens** → **Create Token**.
   - Use the **"Edit Cloudflare Workers"** template, then **edit
     permissions** before creating:
     - **Account → Cloudflare Pages → Edit** ← keep
     - **Account → Workers Scripts → Edit** ← REMOVE (Pages doesn't
       need it)
     - **Account → Account Settings → Read** ← keep
     - **Zone → Workers Routes → Edit** ← REMOVE
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
   **Deploy to Cloudflare Pages** step should flip from `SKIPPED` to
   `SUCCESS`.

### Best practices

- **Scope the API token to Pages only.** The Cloudflare template
  pre-selects Workers + Pages permissions; remove Workers if you
  don't deploy Workers. Future-you wants the blast radius small.
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
# Watch the "Deploy to Cloudflare Pages" step succeed
```

After the deploy succeeds, you'll have a `*.pages.dev` URL plus the
real `nicolasbracigliano.com` URL serving content.

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

## Step 7 — Email forwarding for `security@`

**Goal**: `security@nicolasbracigliano.com` forwards to your
real inbox, so the RFC 9116 `security.txt` contact actually
reaches you.

1. Cloudflare dashboard → `nicolasbracigliano.com` zone → **Email**
   → **Email Routing** → **Get started**.
2. Cloudflare adds the required MX + TXT records automatically.
   Approve.
3. Create a route:
   - **Custom address**: `security@nicolasbracigliano.com`
   - **Action**: **Send to an email** → your real inbox.
4. Cloudflare emails your real inbox a verification link. Click it.

### Best practices

- **Don't use a personal address as the destination if you can
  avoid it.** A dedicated `inbox+security@example.com` (Gmail / Fastmail
  plus-addressing) makes filtering trivial later.
- **Test before relying.** From a different email account:
  `Subject: test  Body: hello` to `security@nicolasbracigliano.com`.
  Should land in the destination inbox within a minute.
- **Don't list more than one contact in `public/.well-known/security.txt`.**
  Single point of receipt = no ambiguity. The current file lists
  `security@nicolasbracigliano.com` only; keep it that way.

### Verification

```sh
dig MX nicolasbracigliano.com +short
# Should show *.cloudflare.com MX records

# Then send a test from another inbox and watch your destination.
```

---

## Step 8 (optional) — Branch protection

**Status**: blocked on GitHub Pro for private repos. Skip if you're
on the free tier.

If you do upgrade to GitHub Pro (~$4/mo):

1. GitHub repo → **Settings** → **Branches** → **Add branch
   protection rule**.
2. **Branch name pattern**: `main`.
3. Enable:
   - **Require a pull request before merging** (yes)
   - **Require status checks to pass** — pick `Build & verify`,
     `Lighthouse CI`, `E2E tests (Playwright)`. Mark them required.
   - **Require branches to be up to date before merging** (yes)
   - **Require signed commits** (yes — pairs with Step 6)
   - **Restrict who can push** → just you
   - **Do not allow bypassing the above settings** (yes — even for
     admins; intentional friction)
4. Save.
5. Flip Renovate's `platformAutomerge: false` → `true` in
   `renovate.json` so it can self-merge patch bumps that pass CI.

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

# Email
# Send a test to security@nicolasbracigliano.com from another inbox;
# expect delivery within ~60 seconds.
```

---

## What's next (Phase 2)

Once Phase 0 lights up, you've got two parallel tracks:

- **Phase 2 (real content)** — drop your real bio / notes / works /
  now / colophon copy into `src/content/{pages,notes,works}/{en,es}/`.
  Mostly markdown editing, no code.
- **Phase 3 (polish)** — Pagefind search UI on `/notes`, avatar
  integration once the SVG/AVIF asset is ready, print-stylesheet
  Phase-3 expansion (URL after-link, per-route layout tuning).

The plan at `~/.claude/plans/lets-review-the-plan-valiant-mccarthy.md`
has the full breakdown for both. Phase 4 (pre-launch QA) waits on
those two; Phase 5 (launch day) waits on Phase 4.

If anything in Phase 0 above is unclear or you hit a registrar /
Cloudflare UI mismatch, drop me the step + the screen you're stuck
on and I'll work through it.
