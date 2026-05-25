# nicolas.bracigliano — design system

The reference for everything about this site. Read this before changing color, copy, layout, or adding a route. The document exists to make next month's work easier, not to look comprehensive.

> **This file is the authoritative source.** If `~/Developer/NB/Design System/DESIGN-SYSTEM.md` (or any other personal-notes copy) disagrees, the in-repo version wins.

## Change log

- **2026‑05‑21** — initial system written down. Two palettes (Dia / Noche). Five nav routes. Avatar is a placeholder.
- **2026‑05‑21** — v1 scope cuts to clear the bootstrap path. Dropped: intro overlay (§11), scroll thread (§11). Clarified: "no analytics" → "no client-side analytics" in §16 (Cloudflare server-side aggregation is allowed). Why: removing JS-heavy decorations keeps the near-zero-JS promise honest and unblocks the Astro/Cloudflare bootstrap.
- **2026‑05‑22** — §16 CSP clarified: `script-src` stays strict (`'self'`); `style-src` adds `'unsafe-inline'`. Why: enables Astro `<ClientRouter />` native View Transitions, which inject per-build runtime styles that build-time CSP hashing can't cover. The real attack surface (script execution) is untouched.
- **2026‑05‑22** — `docs/design-system.md` declared the canonical version. Why: was previously forked between this in-repo copy and the external `~/Developer/NB/Design System/DESIGN-SYSTEM.md`. One source of truth, lives with the code.
- **2026‑05‑22** — `--ink-3` tokens darkened (Día `#736b5e`) and lightened (Noche `#8c8678`) to pass WCAG AA. Why: axe-core caught the originals failing contrast in CI.
- **2026‑05‑22** — §11/§12/§16 brought up to current state; §17 Search + OG cards moved to shipped. Why: canonical promotion missed everything but the change-log.
- **2026‑05‑22** — first-paint motion removed (ADR 0006). Why: incompatible with axe-core contrast checks in CI.

When something material changes, add a line. Keep the log short: date, what changed, why. If you can't write the _why_ in one clause, you probably shouldn't make the change.

---

## 1 · Concept (don't expand)

A small, hand-built personal site for **Nicolas Bracigliano** — senior software engineer in Melbourne, AU. The site is a place to keep the work, the drafts, and the receipts. Not a portfolio (the portfolio is the work). More like the colophon of a book: a back-of-the-house view of the maker, the tools, and the process.

Two sentences. Don't grow them.

## 2 · What this site is _not_

Negative-space rules. These prevent more feature creep than positive ones.

- **Not a portfolio.** The portfolio is the work itself. This site is the _colophon_ — the colour, the press, the maker.
- **Not a SaaS.** No marketing copy. No "transform your workflow." No round-number claims of impact.
- **Not a blog platform.** Don't add features for hypothetical other users. Every feature has to earn its place in _Nicolas's_ daily workflow.
- **Not a CMS.** Content lives in Markdown files, edited in a text editor, committed to git. No admin panel. Ever.
- **Not bilingual in the half-measure sense.** Either a page exists in both languages, or it doesn't have a language toggle at all. Mixed states (English page with a few sprinkled Spanish words) are a stylistic device, not a translation strategy.

## 3 · Per-route visual treatment (the most important table)

Each route gets a distinct visual metaphor. This is what makes the system feel hand-built rather than templated. Promote this to the top of your mind before anything else.

| Route       | Treatment                   | Visual metaphor                                      |
| ----------- | --------------------------- | ---------------------------------------------------- |
| `/`         | Workshop bench              | Vignette grid of what's on the bench right now       |
| `/now`      | Numbered bench tour         | Calm column, one detailed update per craft           |
| `/notes`    | Marginalia notebook         | Dated entries, left-margin tags, right-margin asides |
| `/works`    | Index-card catalog          | Stackable cards with status dots and spec lists      |
| `/about`    | Editorial article + sidebar | Body copy with §-section marks + facts cards         |
| `/colophon` | Typewriter credits roll     | Monospace key-value blocks + ASCII signature         |
| `/404`      | Misplaced letter            | Single illustration, calm copy, ways back            |

Routes share the type and palette systems. They share nothing else by force. **If a new route doesn't have a distinct metaphor, it doesn't belong in the nav.**

## 4 · Core principles (with tests, not slogans)

Each principle is paired with a concrete test. If you can't pass the test, you've violated the principle.

1. **Hecho a mano.**
   _Test:_ What one detail on this page would only exist if a human decided it should? If you can't answer in one sentence, add a detail or cut the page.

2. **One maker, many crafts.**
   _Test:_ Does this page mention only code? Add one non-code reference somewhere on it (in copy, in a vignette, in a margin note) — or move it to `/works`. The home page should always cross at least two crafts.

3. **Tools are part of the work.**
   _Test:_ If a reader asks "what's this built with?", the answer is one click away (the colophon). If they ask "why?", at least three principles in §4 are visible on the page they're reading.

4. **En público, en proceso.**
   _Test:_ Does this entry pretend to be finished? Add a status, a date, or an aside that admits what's unresolved. _"Five iterations, still wrong about the fillets"_ is better than _"v5, shipping."_

5. **Curiosity over conclusion.**
   _Test:_ Read the headline aloud. Is it a claim or a question? Claims are fine _if_ the body opens by complicating them. If the body's first sentence is the same as the headline, rewrite one of them.

6. **Performance, accessibility, security as aesthetics.**
   _Test:_ Lighthouse > 95 on every static page. Tab-key reaches every interactive element in a sensible order. No third-party requests. If any is false, fix it before publishing the next entry.

## 5 · Information architecture

Bilingual URL pattern: `/es/...` and `/en/...` mirror each other. The language toggle persists choice in `localStorage`. Missing translations show the available language with a small note linking to it. Do **not** auto-translate or hide the toggle.

| Route (ES / EN)               | Purpose                                         | Status        |
| ----------------------------- | ----------------------------------------------- | ------------- |
| `/`                           | Identity-first home: bio, bench, latest entries | shipping      |
| `/notas` · `/notes`           | Short notes, TILs, micro-posts                  | shipping      |
| `/obras` · `/works`           | Projects — digital and physical                 | shipping      |
| `/sobre` · `/about`           | Fuller bio, contact                             | shipping      |
| `/sobre/ahora` · `/about/now` | Current focus ("now" page)                      | shipping      |
| `/colofón` · `/colophon`      | Stack, fonts, hosting, workflow, principles     | shipping      |
| `/404`                        | Page not found                                  | shipping      |
| `/ensayos` · `/essays`        | Long-form essays                                | **[planned]** |
| `/rss.xml`                    | RSS feed (per-language variant)                 | **[planned]** |

Hidden routes are reachable by direct link but absent from the nav. They make the nav shorter and reward the curious. `/now` is one of these.

## 6 · Voice — with side-by-side examples

The voice section only works with concrete pairs. Add to this list as new patterns emerge.

### General

✓ _"Tomatoes are in. Bees showed up early."_
✗ _"We planted tomatoes today and observed pollinators arriving earlier than expected."_

✓ _"I had the loop wrong."_
✗ _"I encountered a logic error in the iteration."_

✓ _"This is the third try. I think it's right."_
✗ _"After iterative refinement, this implementation is now production-ready."_

### Numbers

✓ _"20 g in, 38 g out, 28 seconds."_
✓ _"Three weeks of looping bars 9–16."_
✗ _"Significantly improved performance."_
✗ _"Around twenty years of experience, give or take."_ (round numbers in self-claims are a tell)

### Hedges

✓ _"I think,"_ _"I'm not sure,"_ _"I was wrong about this last time."_
✗ _"Best practices,"_ _"Industry-standard,"_ _"Cutting-edge."_

### Bilingual

Reserve Spanish for words that are emphatically the right word. Use sparingly.

✓ _colofón, mate, huerta, hecho a mano_
✗ _casa, sobre, obras_ (using Spanish for things that read perfectly in English is performative)

### The five-word test

If a line is longer than five words and contains no specifics (no number, no name, no time, no place), suspect it. Either add a specific or cut the line.

## 7 · How to write a note (the recipe)

This is the bridge between _system_ and _daily use_.

1. **Open** `content/notes/YYYY-MM-DD-short-slug.md` in your editor.
2. **Frontmatter:**
   ```yaml
   date: 2026-05-21
   tags: [garden] # 1–3 lowercase
   glyph: garden # or code | guitar | coffee | none
   lede: 'One line of italic context.'
   minutes: 2 # estimate read time honestly
   lang: en
   aside: '(optional) one line for the right margin'
   ```
3. **Body.** Write in markdown. The first paragraph is the most important. Use the `rule` keyword on its own line to insert the dotted ornament when a real section break is earned. Avoid the temptation to add subheadings — notes are short enough to live without them.
4. **Status check.** Before publishing, read aloud. If you can't say it conversationally, it's still an essay. Wait, or move it to `/essays`.
5. **No previewing in production.** Notes get pushed when they are _almost_ right. Polish happens after they exist in public.
6. **Don't backfill.** Don't date a note earlier than today. The dated stream is a story, not a portfolio.

The same recipe shape applies to `/works` (add status + specs), `/now` (replace, don't append), and `/about` (rare; rewrite, don't patch).

## 8 · Color

Two palettes, switched by the day/night toggle. The other two palettes from earlier (Jardín, Tinta) were removed in favour of restraint.

### Dia (light)

| Token        | Value     | Used for                                       |
| ------------ | --------- | ---------------------------------------------- |
| `--bg`       | `#f6f4ef` | Page background                                |
| `--bg-2`     | `#ece9e0` | Inset surfaces, vignettes                      |
| `--paper`    | `#fbfaf6` | Card backgrounds                               |
| `--ink`      | `#1a1814` | Primary text                                   |
| `--ink-2`    | `#3e3a34` | Secondary text                                 |
| `--ink-3`    | `#736b5e` | Tertiary text, labels (5.19:1 on `--bg`, AA)   |
| `--rule`     | `#d4cfc2` | Dividers                                       |
| `--accent`   | `#b8512a` | Links, hover, dots, micro-accents (terracotta) |
| `--mate `    | `#5a6a3a` | Garden moments                                 |
| `--ink-blue` | `#2d4a7a` | Code/engineering moments                       |

### Noche (dark)

Two swaps worth knowing: `--accent` softens from `#b8512a` to `#d8a07e` because the bright terracotta loses authority on dark backgrounds (same hue, lower chroma). `--ink-3` brightens from the Día value to `#8c8678` so tertiary text passes WCAG AA against both `--bg` (5.19:1) and `--bg-2` (4.75:1) — the Día and Noche tertiary tokens are not the same value, they're independently tuned for contrast.

### Trade-offs (not rules)

These exist as trade-offs, not commandments. Break them when the trade is worth it.

- **`--accent` on large flat surfaces.** If you use it as a card background, links inside that card lose their distinguishing color. You either re-tint the links (more code) or accept that interactivity is invisible (worse UX). The trade is rarely worth it. So we don't.
- **`--mate` outside garden moments.** If you use it on a code vignette, it stops marking garden. Mate becomes meaningless. The trade is _cheaper visual variety now, less semantic legibility forever_. Usually not worth it.
- **`--ink-blue` outside code moments.** Same trade as mate.
- **Two accents on the same page.** Sometimes you need both `--accent` (a CTA) and `--mate` (a status). Fine. Three accents on one page is the tell that the page is doing too much.

## 9 · Type

- **Display:** Newsreader (variable, 300–800). Used for H1, H2, card titles, italic accents.
- **Body / mono:** JetBrains Mono (400 / 500 / 700). Used for body copy, labels, captions, specs, all tabular data.
- **Fallback:** `"Iowan Old Style", Georgia, serif` and `ui-monospace, "SF Mono", Menlo, monospace`.
- **Sizing:** Display sizes use `clamp()` between two anchor breakpoints. Body is 15 px, line-height 1.55–1.75. **See `styles.css` for the truth — don't duplicate values here.**
- **`text-wrap: pretty`** on paragraphs. Browsers that don't support it degrade silently.
- **Italics** are reserved for: titles of works, foreign words used as-is (_mate_, _huerta_), and editorial emphasis. Never for "important."

## 10 · Motion — three timings, one principle

Three speeds, used everywhere. Don't invent a fourth.

| Speed    | Duration   | Easing                     | For                                                |
| -------- | ---------- | -------------------------- | -------------------------------------------------- |
| Micro    | **240 ms** | `ease`                     | Color, hover state, focus rings                    |
| Standard | **320 ms** | `cubic-bezier(.2,.7,.2,1)` | Card hover, mode toggle, link underline draw       |
| Page     | **520 ms** | `cubic-bezier(.2,.7,.2,1)` | Cross-page View Transitions, link underline redraw |

### Principle

Animate **into existence**, then rest. Continuous loops read as nervous, not alive (see §15 anti-patterns). First-paint motion is intentionally absent — content lands at its final state on the first frame. Hover, click, theme transition, and cross-page View Transition motion all play. See [ADR 0006](./decisions/0006-no-first-paint-animation.md) for the rationale.

`@media (prefers-reduced-motion: reduce)` forces every animation to 0.01 ms. Honoured globally.

## 11 · Components (what exists, briefly)

Listed for orientation. The CSS files are the source of truth.

- **Chrome** — sticky header. Mark (left) · Nav (center) · Lang + Day/Night (right). Day/Night is a `<button role="switch" aria-checked>` with a single SVG that animates between sun (rays + disc) and moon (disc + slid-in mask) via CSS `transform` + `opacity` keyed to `[data-theme]`. Lang is a pair of links with a disabled-style state when the sibling translation is missing.
- **Bench card** — home page vignette card (terminal / guitar / seedling / 3D print).
- **Latest entry row** — kind pill, date, title, arrow. Hover slides right.
- **Note entry** — three-column grid: date + tags (left), prose (centre), aside (right).
- **Work card** — vignette + spec list + status. Hover stacks a paper card behind via `::before` translate.
- **Facts card** (About sidebar) — small-caps title, `dl` of rows, optional footer link.
- **ASCII signature** — `╭─ NB · '26 ─╮` at the foot of Colofón.
- **NotFound** — 404 illustration + map back.

## 12 · Accessibility (real, not aspirational)

Currently honoured:

- Visible `:focus-visible` outlines on every interactive element (2 px `--accent`, 3 px offset).
- Body text ≥ AA contrast at 15 px.
- All decorative SVGs `aria-hidden="true"`; functional ones have `aria-label`.
- The language toggle is a `role="group"` with `.on` reflecting active state.
- `prefers-reduced-motion` honoured globally.

Addressed in the v1 bootstrap (see `docs/architecture.md` and the ADRs in `docs/decisions/`):

- Day/night toggle is `<button role="switch" aria-checked>` (not a `title` button).
- Scroll thread is **removed** — was a loop-ish decoration with no screen-reader equivalent.
- Intro overlay is **removed** — no more focus trap to worry about.
- `<html lang="…">` is correct on every page (mirrored `/en/*` and `/es/*` static routes set it at build time).
- All dates wrapped as `<time datetime="YYYY-MM-DD">` in layouts.
- WCAG AA colour contrast enforced via axe-core in Playwright e2e (32 tests) + Lighthouse CI (a11y ≥95 budget, currently 100/100 across all 5 audited URLs). Tertiary token `--ink-3` was darkened/lightened in both palettes (§8 footnotes) after axe caught the originals at 3.41:1 / 4.36:1.

If you're publishing without one of these in place, write it down. Don't ship and call it "AA."

## 13 · Images & assets

- **Format.** SVG for icons + decorative illustration. AVIF (or WebP fallback) for photographs. PNG only when alpha is required and AVIF won't do.
- **Max dimensions.** Hero/photo images ≤ 1600 px wide, served via `<picture>` with at least two breakpoints. Inline SVGs cap at 32 KB minified.
- **Originals.** Source files (`.afdesign`, `.skp`, `.kra`, RAW photos) live in `/assets/_originals` and are git-LFS'd. Never inline an original.
- **Naming.** Lowercase, hyphen-separated, dated when relevant: `2026-05-tray-rev5.avif`, not `Final Tray Photo (3) v2.png`.
- **Alt text.** Mandatory on every photographic image. Describes the _content_, not the file. Decorative SVGs use `aria-hidden="true"` instead.
- **Galleries.** Allowed. A two-column scroll-aligned grid, one breakpoint, no lightboxes. Lightbox is over-engineering for a personal site.

## 14 · How to break the system

The principles call for per-route playfulness, which means breaking the system is _the system_. Some rules can be broken if they're worth breaking.

- **Add a route with no parallel in the IA table.** Allowed once a year. Must have its own visual metaphor (§3) and must be reachable from at least one existing page.
- **Use a new accent color.** Allowed for a single page or a single component, never as a new token. If it survives six months, promote it to the palette.
- **Skip the type system.** Allowed for ASCII art, code samples, and the colofón ornaments — anything where the monospace grid itself is the meaning.
- **Skip the principles.** Never. The principles are how you decide _which_ rule to break.

## 15 · Anti-patterns (specific to this site)

The site has known tells. Document them so they don't repeat.

1. **Performing bilingual.** Sprinkling Spanish words on every page so the site signals its identity. Reserve Spanish for words that are emphatically the right word.
2. **Over-symmetry.** Four cards, four crafts, four colors, four sections. Real life is asymmetric. If you find yourself rounding a count up to four for aesthetic reasons, leave three.
3. **Looping vignettes.** Animate on mount, then rest. Continuous loops read as nervous, not alive.
4. **Round-number self-claims.** "Twenty years of experience" reads as posture, not fact. Say _"since 2006,"_ or say nothing.
5. **Polished notes.** A note that reads like a finished essay has betrayed its category. Move it to `/essays` (when that exists) or roughen it.
6. **Decorative SVG everywhere.** Two illustrations per page max. If a third tries to enter, choose between them.
7. **Quotable closing lines.** Every section ending with a quotable summary reads as LLM-generated. Let some sections end un-resolved.
8. **Performative completeness.** Listing every keyboard, every espresso machine, every guitar by exact model in the colofón. Pick one or two. Restraint is the brand.

## 16 · Production targets (commitments)

The prototype loads dependencies from CDNs and uses Babel-in-browser; production doesn't.

**Performance.** Static HTML built at deploy time. Self-hosted, subsetted fonts under 80 KB combined. No third-party scripts. Target Lighthouse ≥ 95 / page weight ≤ 100 KB gzipped / above-the-fold CSS inlined. _Currently shipping_: 100/100 across perf/a11y/best-practices/SEO on all 5 audited URLs at ~11 KB per page.

**Security.** Cloudflare Workers Static Assets with HSTS preload, DNSSEC, **strict `script-src` CSP** (`default-src 'self'; script-src 'self'`), no cookies, no **client-side** analytics (Cloudflare's server-side aggregation off edge logs is allowed — it has no beacon, no cookie, no CSP loosening). Preferences (mode, lang) live in `localStorage` only.

`style-src` is `'self' 'unsafe-inline'` — a _deliberate_ loosening to permit Astro's `<ClientRouter />` view-transition runtime styles. The XSS attack surface (`script-src`) stays strict; CSS injection on a no-user-input static site is effectively nil (no auth to phish, `img-src 'self'` blocks the `background-image: url(evil.com)` exfil vector). Full reasoning in [`docs/decisions/0002-csp-style-src-unsafe-inline.md`](./decisions/0002-csp-style-src-unsafe-inline.md).

## 17 · Open questions

1. **Real avatar.** Pick a direction from `AVATAR-OPTIONS.md` and commission or draw.
2. **Real essays.** `/essays` is in the IA but has no content yet. Same notebook treatment as `/notes`, longer.
3. **Real copy.** Most body copy on Home, About, Notes, Now, and Colofón is currently invented. Replace with material Nicolas actually wrote.
4. **Search UI.** Pagefind index is built (`postbuild` produces `dist/_pagefind/`); UI not yet wired into the layouts. Drop in a small `.astro` component on `/notes`.
5. **Print stylesheet.** Notes and essays should print like typed letters. Dedicated `@media print` pass.
6. **`/drafts` index.** A public list of unfinished posts — the site claims "en proceso, en público"; right now nothing demonstrates that.

### Shipped (moved out of this list)

- **Search index** — Pagefind (`postbuild` script, per-language facet via `data-pagefind-filter="lang"`). UI still TODO above.
- **OG cards** — Satori + Resvg via `src/pages/og/[collection]/[slug].png.ts`, fonts in `public/fonts/og-newsreader.ttf`.

---

_Last set in type on 22 May 2026. — N. B._
