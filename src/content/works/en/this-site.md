---
title: 'This site'
slug: 'this-site'
lang: en
translationId: this-site
date: 2026-05-21
status: published
tags: [code]
kind: code
lifecycle: ongoing
number: '01'
lede: 'The site you are reading.'
specs:
  framework: 'astro 7'
  hosting: 'cloudflare workers'
  language: 'typescript (strict)'
  fonts: 'newsreader · jetbrains mono'
iterations:
  - rev: 'v1.26'
    date: '2026-08-12'
    status: ongoing
    note: 'The site implementation page becomes Build notes, moves to /build, and sheds the old publishing metaphor across the visible English and Spanish copy.'
  - rev: 'v1.24'
    date: '2026-07-07'
    note: 'Astro 7 migration: Rust compiler path, Vite 8/Rolldown, static command-palette JSON endpoints, and OG image routes reshaped for trailing-slash prerendering.'
  - rev: 'v1.19'
    date: '2026-06-02'
    note: 'The works detail page becomes an editorial single column: eyebrow, deck, hero, specs, and this iterations ledger.'
  - rev: 'v1.16'
    date: '2026-06-02'
    note: 'Per-kind vignettes redrawn as crafted, animated illustrations.'
  - rev: 'v1.14'
    date: '2026-06-01'
    note: 'The ⌘K command palette ships as search across the site; the home bench and the Now bench tour draw from one shared source.'
  - rev: 'v1.12'
    date: '2026-05-28'
    note: 'Home, bench, and Now move to the content collections; per-entry SVG art arrives via the hero field.'
  - rev: 'v1.9'
    date: '2026-05-26'
    note: 'Long-form arrives: the editorial pieces layout, reusable SVG diagrams, and the design system written down as an authoring guide.'
  - rev: 'v1.7'
    date: '2026-05-24'
    note: 'Moved off Cloudflare Pages onto Workers Static Assets, then externalised every inline script so a strict same-origin CSP holds.'
  - rev: 'v1.3'
    date: '2026-05-23'
    note: 'The first content routes reach prototype parity: Build notes, About, the Numbered bench tour, and the Misplaced Letter 404.'
  - rev: 'v1.0'
    date: '2026-05-22'
    status: shipping
    note: 'Bootstrap: the Astro shell, bilingual en/es routing, the Día/Noche theme with no flash, and native View Transitions.'
elsewhere:
  - label: 'github / source'
    href: 'https://github.com/nicolas-bracigliano/nicolasbracigliano'
    note: 'the repo behind this page'
---

Every other entry here is something I made. This one is the shelf the rest sit on. It isn't a portfolio; the portfolio is the work itself. This site is where I keep the work, the drafts, and the receipts, with the tools left in view on purpose.

Static at deploy, near-zero JS at the edge; no framework on the page. The content is markdown typed with Zod, built by Astro, served from a single Cloudflare Worker. The constraints are the fun part. A strict policy that allows scripts only from this origin means nothing runs inline, so every bit of behaviour ships as its own small file; no cookies, no client-side analytics, no third-party anything.

Everything is written twice, English and Spanish, composed in parallel rather than translated. It's ongoing by design: the build notes update whenever the stack moves, and the stack keeps moving.
