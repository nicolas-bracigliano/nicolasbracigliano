# 0015 — Mail on iCloud+ Custom Email Domain, not Cloudflare Email Routing

**Status**: Accepted
**Date**: 2026-07-30

## Context

[Phase 0 Step 7](../phase-0-infrastructure.md) wired `security@nicolasbracigliano.com` through **Cloudflare Email Routing**: Cloudflare owns the apex MX, one custom address forwards to a real inbox, done in four dashboard clicks. That satisfied the narrow requirement at the time, which was making the RFC 9116 contact in `public/.well-known/security.txt` actually reach a human.

Two things it doesn't satisfy:

- **Email Routing is inbound-only.** It forwards; it offers no SMTP submission. So a report arriving at `security@` can be _read_, but any reply leaves from the destination mailbox's own domain. A published security contact you can't reply _as_ is half a contact.
- **The domain has no outbound identity at all.** Correspondence from `nicolasbracigliano.com` — not just security reports — wants a real mailbox, and a domain that sends needs its own SPF, DKIM, and DMARC. Email Routing's records describe only the inbound path.

The binding constraint: **the apex MX set is exclusive.** One mail provider serves a domain's mail. So picking a mailbox provider isn't additive — it means removing Email Routing, and moving `security@` onto whatever replaces it.

## Decision

**iCloud+ Custom Email Domain** is the mail provider for `nicolasbracigliano.com`, inbound and outbound. Cloudflare Email Routing is retired. Set up 2026-06-04.

Live records, verified 2026-07-30 over DoH against `cloudflare-dns.com` (see [§ Verification](#verification) on why not `dig`):

| Name              | Type  | Value                                                                                                |
| ----------------- | ----- | ---------------------------------------------------------------------------------------------------- |
| `@`               | MX    | `10 mx01.mail.icloud.com.` / `10 mx02.mail.icloud.com.`                                              |
| `@`               | TXT   | `v=spf1 include:icloud.com ~all`                                                                     |
| `@`               | TXT   | `apple-domain=rOvPCprl0JLzksxg` (Apple's ownership token — keep it, Apple re-checks)                 |
| `sig1._domainkey` | CNAME | `sig1.dkim.nicolasbracigliano.com.at.icloudmailadmin.com.`                                           |
| `_dmarc`          | TXT   | `v=DMARC1; p=reject; rua=mailto:894c…@dmarc-reports.cloudflare.net,mailto:me@nicolasbracigliano.com` |

Three details in there are load-bearing:

**DKIM is a CNAME, not a literal key.** Apple hosts the public key at the target and rotates it on their schedule; the zone holds only the pointer. One selector (`sig1`) — there is no `sig2`. Never "simplify" this into a TXT record with the key inlined: that pins a key Apple will eventually rotate out from under it, and DKIM starts failing silently on a date nobody scheduled.

**DMARC was staged `none` → `reject`, skipping `quarantine`.** Cutover on 2026-06-04 published `p=none; rua=mailto:me@…` and sat there while reports came in. Once they were clean, the policy went to `reject` directly. `quarantine` is the intermediate step you want when there's a long tail of forgotten legitimate senders that would start bouncing — here there was no tail (one human, one provider, no marketing platform, no transactional service), so an interim spam-foldering policy would only have delayed enforcement without teaching anything the `none` phase hadn't already.

**Aggregate reports go two places** — Cloudflare's DMARC Management aggregator (the parsed view) and `me@` (the raw XML, and a dead-man's-switch on the aggregator quietly breaking). There is no `ruf=`; forensic reports are near-universally unsent by receivers and would only leak message content if they were.

The zone is DNSSEC-signed (see [`docs/security.md`](../security.md) § DNSSEC), so these lookups are themselves integrity-protected — which matters more for mail than for the website, because SPF/DKIM/DMARC are the one place where a forged DNS answer directly buys an attacker the ability to send as this domain.

### Unresolved

**How `security@` is served on the Apple side is not recorded here** — specific custom-domain address vs. catch-all. It's configured in Apple's dashboard, and that dashboard is the only source of truth for it. Whoever confirms it should write the answer into this section.

## Alternatives considered

| Option                                                | Why not                                                                                                                                                                                                                           |
| ----------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Cloudflare Email Routing** (the Phase 0 status quo) | Inbound forwarding only, no submission — the reason this ADR exists. Secondary: it would put DNS, hosting, _and_ mail at one vendor, thickening the lock-in surface `docs/security.md` deliberately tracks.                       |
| **Hostinger / Titan** (the prior arrangement)         | The mailbox this migration replaced (cutover 2026-06-04; the Titan SPF `include` came out of the apex TXT at the same time). Retired along with the rest of that plan — a separate paid line item to hold one mailbox.            |
| **Fastmail / Migadu / Purelymail**                    | All genuinely good, all a separate line item. iCloud+ was already paid for (storage), and Custom Email Domain is included — marginal cost zero. Revisit if Apple's feature set ever becomes the constraint rather than the price. |
| **Google Workspace**                                  | Per-seat pricing for a single mailbox, and the heaviest admin surface of the options.                                                                                                                                             |
| **Self-hosted MTA**                                   | Outbound port 25 is blocked on the origin network, so this can't even be tested from here. Add earning sender reputation from a cold IP, and it's a non-starter for a domain whose mail volume is "occasional."                   |

## Consequences

- **One provider at the apex.** Adding a second mail path later isn't an addition, it's a re-decision. Write a new ADR.
- **`security@` now depends on Apple, and its routing config lives outside this repo.** Cloudflare Email Routing at least surfaced the route in the same dashboard as the DNS. Apple's doesn't, and there's no IaC for it. The only check that proves the whole path works is still an end-to-end send.
- **A permanent reverse-DNS warning on deliverability testers.** iCloud sends from shared outbound infrastructure, so the PTR of the sending IP doesn't match this domain. mail-tester and friends flag it; it is not fixable from the DNS side and does not affect SPF, DKIM, DMARC, or delivery. Don't chase it.
- **`p=reject` is unforgiving of future senders.** Any service that ever sends as this domain — a newsletter platform, a form-mail relay, a CI notifier — gets rejected outright, not quarantined, until it's in SPF _and_ DKIM-aligned. Wire the sender up **before** its first send, not after reading the bounce.
- **[`docs/phase-0-infrastructure.md`](../phase-0-infrastructure.md) Step 7 now describes the retired arrangement**, including a verification block that expects `dig MX` to return `*.cloudflare.com`. It returns `*.mail.icloud.com`. That runbook needs a correction pointing here.
- **BIMI is not reachable, and that's a dated fact rather than a permanent one.** No registered trademark rules out a VMC. A Common Mark Certificate requires the logo to have been in continuous public use for 12+ months, and `public/favicon.svg` landed 2026-06-14 (`fe1645c`) — so the earliest plausible CMC is around **2027-06**. Separately, the shipped favicon couldn't serve as a BIMI logo as-is: it uses `<text>` in Helvetica and an SVG 1.1 external `<!DOCTYPE>` reference, both disqualifying under SVG Tiny PS. `docs/assets/favicon-options/11-master-mark.svg` (path-only, square, `<title>`, no external refs) is the closest existing construction reference. **Apple Branded Mail** via Apple Business Connect needs no certificate at all and covers the Apple Mail side for free, which is where this domain's mail already lives.

## Verification

```sh
# Records — via DoH, not dig. The origin network intercepts port-53 DNS and
# returns stale forged answers even when querying an authoritative server
# directly, so `dig` is not trustworthy from here for this zone.
for n in nicolasbracigliano.com _dmarc.nicolasbracigliano.com; do
  curl -s -H 'accept: application/dns-json' \
    "https://cloudflare-dns.com/dns-query?name=$n&type=TXT" \
    | python3 -c 'import sys,json;[print(a["data"]) for a in json.load(sys.stdin).get("Answer",[])]'
done
# @      → v=spf1 include:icloud.com ~all  +  apple-domain=…
# _dmarc → v=DMARC1; p=reject; rua=…

curl -s -H 'accept: application/dns-json' \
  "https://cloudflare-dns.com/dns-query?name=nicolasbracigliano.com&type=MX" \
  | python3 -c 'import sys,json;[print(a["data"]) for a in json.load(sys.stdin)["Answer"]]'
# → 10 mx01.mail.icloud.com.  /  10 mx02.mail.icloud.com.

# End-to-end (the only check that proves the Apple-side routing):
# send from an unrelated inbox to security@nicolasbracigliano.com, expect
# delivery in ~60s; reply, and confirm the From: is the custom domain.
# Then check the reply's headers at the far end for dkim=pass d=nicolasbracigliano.com
# and dmarc=pass.
```

## When to revisit

- **~2027-06** — CMC eligibility opens, if BIMI at Gmail is worth the certificate by then.
- The domain needs to send from anything other than iCloud (see the `p=reject` consequence).
- Apple changes or retires Custom Email Domain. The escape is a provider swap at MX + SPF + DKIM; DMARC and the `_dmarc` reporting addresses carry over unchanged.
- Role addresses beyond `security@` and `me@` are needed, or a second mailbox.
- **Hostinger plan cancellation** (pending as of this ADR) — when it happens, re-run the verification above and confirm no MX or SPF remnant of the old provider survives.

References: [ADR 0001](./0001-cloudflare-pages.md) (host),
[`docs/security.md`](../security.md) (DNSSEC, vendor lock-in surface),
[`docs/phase-0-infrastructure.md`](../phase-0-infrastructure.md) (Step 7, now stale).
