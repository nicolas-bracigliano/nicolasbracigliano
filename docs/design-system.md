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
- **2026‑05‑25** — §6 Hedges tightened: at most one or two hedges per paragraph; voice is curious, humble, but assertive. New §6 Punctuation subsection: no em dash (`—`) in prose. Why: the open-ended "hedges encouraged" rule produced over-hedged drafts during PR P3 calibration; an author writes about a topic because they have knowledge of it, and stacking three "probably / I think / not sure" reads as performative uncertainty.
- **2026‑05‑26** — §9 Type committed to a two-face mapping table: notes ship in JetBrains Mono (field log), pieces ship in Newsreader 18/1.65 (slowed-down reading). Margin notes on pieces stay serif; rail position + `↳` mark carry the aside-ness. New non-goal: a third face. Cross-references added in §4 #5, §7, §15 #5. "Real pieces" moved from §17 Open questions to §17 Shipped (PR P3). Why: the face is the content signal — see PR P5.
- **2026‑05‑26** — `/pieces` pivots to an editorial-article layout: single column, display H1, drop cap, italic H2 with `§`, inline pull quotes. Full rationale + alternatives in [ADR 0012](./decisions/0012-pieces-editorial-layout.md). Why: serif body without an editorial layout reads as "long note," not essay.
- **2026‑05‑27** — §6 gains a Banned phrases catalogue + Anecdote fidelity rule. New §7a "How to write a piece (the recipe)" with the kernel-plus-six-sections shape, required components, length window, tag pattern, bilingual rules. New §7b "Reviewing a piece (the reflection pass)" — a post-draft checklist for the writer AND the LLM to consult and reflect against. §9 gains a Diagrams subsection lifting PR P4's role-class pattern. ADR 0011 documents the piece shape with the four P3 pieces as worked examples. One exception stays a test (`piece-margin-note-anchors`) — it's a silent-render bug, not a style call. Why: the four P3 pieces independently converged on the same shape; codifying it as a reflective guide (not a CI gate) lets future pieces match without re-deriving, while keeping the judgement with the writer.
- **2026‑05‑31** — added the **command palette (⌘K)** as the site's search (§11). A navigation-only index of titles/ledes/tags built from the content collections and served as a per-locale JSON endpoint (fetched on first open); opens on ⌘K or a chrome _jump to…_ trigger (a magnifier icon on mobile). Why: a site-wide search box parked inside `/notes` was the wrong affordance; ⌘K is the "jump to anything" pattern a developer audience expects, and at this scale navigation beats full-text (which can slot into the same UI later).

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

| Route       | Treatment                   | Visual metaphor                                                     |
| ----------- | --------------------------- | ------------------------------------------------------------------- |
| `/`         | Workshop bench              | Vignette grid of what's on the bench right now                      |
| `/now`      | Numbered bench tour         | Calm column, one detailed update per craft                          |
| `/notes`    | Marginalia notebook         | Dated entries, left-margin tags, right-margin asides                |
| `/pieces`   | Editorial article           | Centered single column, display title, drop cap, inline pull quotes |
| `/works`    | Index-card catalog          | Stackable cards with status dots and spec lists                     |
| `/about`    | Editorial article + sidebar | Body copy with §-section marks + facts cards                        |
| `/colophon` | Typewriter credits roll     | Monospace key-value blocks + ASCII signature                        |
| `/404`      | Misplaced letter            | Single illustration, calm copy, ways back                           |

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
   _Typographic expression:_ notes (claims in process) ship in mono; pieces (argued positions) ship in serif. See [§9 · Type](#9--type).

6. **Performance, accessibility, security as aesthetics.**
   _Test:_ Lighthouse > 95 on every static page. Tab-key reaches every interactive element in a sensible order. No third-party requests. If any is false, fix it before publishing the next entry.

## 5 · Information architecture

Bilingual URL pattern: `/es/...` and `/en/...` mirror each other. The language toggle persists choice in `localStorage`. Missing translations show the available language with a small note linking to it. Do **not** auto-translate or hide the toggle.

| Route (ES / EN)               | Purpose                                         | Status           |
| ----------------------------- | ----------------------------------------------- | ---------------- |
| `/`                           | Identity-first home: bio, bench, latest entries | shipping         |
| `/notas` · `/notes`           | Short notes, TILs, micro-posts                  | shipping         |
| `/obras` · `/works`           | Projects — digital and physical                 | shipping         |
| `/sobre` · `/about`           | Fuller bio, contact                             | shipping         |
| `/sobre/ahora` · `/about/now` | Current focus ("now" page)                      | shipping         |
| `/colofón` · `/colophon`      | Stack, fonts, hosting, workflow, principles     | shipping         |
| `/404`                        | Page not found                                  | shipping         |
| `/ensayos` · `/pieces`        | Long-form pieces (per ADR 0010)                 | shipping (empty) |
| `/rss.xml`                    | RSS feed (per-language variant)                 | **[planned]**    |

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

The voice is **curious, humble, but assertive**. Hedges signal that you've thought about the topic and know where you're still unsure; they don't mean you're unsure about everything. Use them where uncertainty is genuine and load-bearing, not as a sentence-end tic.

✓ _"I think,"_ _"I'm not sure,"_ _"I was wrong about this last time."_
✗ _"Best practices,"_ _"Industry-standard,"_ _"Cutting-edge."_

**Cap: at most one or two hedges per paragraph.** If every sentence ends with "probably" or "I think," you've stopped writing and started apologising; the reader stops trusting the parts where you _do_ know what you're talking about. Lead with what you actually think; acknowledge complexity _after_ the assertion, not instead of it.

✓ _"The Dependency Rule itself is right; code dependencies should flow toward the stable core. What's hard, every time, is the boundary between use cases and interface adapters."_
✗ _"The Dependency Rule is probably right. I think code dependencies might flow toward the stable core. I might be wrong about this, but the boundary between use cases and adapters seems hard."_

### Punctuation

**No em dash (`—`) in prose.** The em dash signals editorial flourish; the site's voice is craft-bench, not editorial. Use a period (new sentence), comma, colon, semicolon, or parentheses depending on what the dash was doing.

✓ _"The Dependency Rule itself is right; code dependencies should flow toward the stable core."_
✗ _"The Dependency Rule itself is right — code dependencies should flow toward the stable core."_

✓ _"The pattern isn't that agile doesn't work. It's that the parts that take patience get cut first."_
✗ _"The pattern isn't that agile doesn't work — it's that the parts that take patience get cut first."_

Em dashes stay in design surfaces (mastheads, eyebrow separators, the `Bitacora —` lead-in). Those are typographic, not prose.

### Banned phrases

The voice has a no-go list. These read as posture, not voice, and a piece containing any of them is probably leaning on the wrong register:

`beacon of`, `unlock`, `transformative`, `robust`, `best practice`, `industry-standard`, `cutting-edge`, `leverage`, `synergy`, `18+ years`, `decades of experience`, round-number self-claims of any kind.

Why these specifically: each carries a register the site rejects — keynote-speaker self-presentation, polished-LinkedIn evergreen, conference-bio inflation. The list isn't exhaustive (good prose rewards specificity over rule-following); it's a tripwire.

This is a reflection list, not a lint gate (see §7b). After a draft exists, scan it against this catalogue. A hit isn't an automatic fail — sometimes you're quoting the phrase or arguing against it — but it's a prompt to stop and ask: am I leaning on the wrong register here?

### Anecdote fidelity (for migrated or rewritten work)

When rewriting something from a source — a legacy post, an old draft, an outline — **keep the anecdotes you actually had**. Don't invent specifics to make a story land harder.

This rule comes from a real failure during PR P3: the CPR piece shipped with a "deadline that clicked" anecdote that read well in the §6 voice but wasn't from the original source. The author's actual experience was a tense meeting where newer team members were visibly confused by the intensity; the rewrite substituted a 1:1 about missed deadlines because that scanned cleaner. Both are plausible. Only one is true. The reader can't tell — but YOU stop being able to use the piece honestly the moment the anecdote diverges from the source.

If the source has no anecdote and the piece needs one, ask the author. Don't compose a substitute.

✓ _Restore the real meeting story; trim it to the §6 voice without changing what happened._
✗ _Compose a plausible-sounding anecdote because the original was hard to source down._

### Bilingual

Reserve Spanish for words that are emphatically the right word. Use sparingly.

✓ _colofón, mate, huerta, hecho a mano_
✗ _casa, sobre, obras_ (using Spanish for things that read perfectly in English is performative)

### The five-word test

If a line is longer than five words and contains no specifics (no number, no name, no time, no place), suspect it. Either add a specific or cut the line.

## 7 · How to write a note (the recipe)

This is the bridge between _system_ and _daily use_. Notes ship in mono — see [§9 · Type](#9--type) for the two-face mapping. The mono is the field-log signal.

1. **Open** `content/notes/YYYY-MM-DD-short-slug.md` in your editor.
2. **Frontmatter:**

   ```yaml
   date: 2026-05-21
   tags: [garden] # 1–3 lowercase
   kind: garden # or code | guitar | coffee — omit for no glyph
   lede: 'One line of italic context.'
   minutes: 2 # estimate read time honestly
   lang: en
   aside: '(optional) one line for the right margin'
   hero: ./art.svg # optional per-entry SVG; replaces the kind-default glyph
   ```

   `kind` selects a default glyph from the art registry (see [ADR 0013](./decisions/0013-per-entry-art.md)). To ship bespoke art, move the note into its own directory (`<slug>/index.md` + `<slug>/art.svg`) and set `hero: ./art.svg`.

3. **Body.** Write in markdown. The first paragraph is the most important. Use the `rule` keyword on its own line to insert the dotted ornament when a real section break is earned. Avoid the temptation to add subheadings — notes are short enough to live without them.
4. **Status check.** Before publishing, read aloud. If you can't say it conversationally, it's still an essay. Wait, or move it to `/pieces` · `/ensayos`.
5. **No previewing in production.** Notes get pushed when they are _almost_ right. Polish happens after they exist in public.
6. **Don't backfill.** Don't date a note earlier than today. The dated stream is a story, not a portfolio.

The same recipe shape applies to `/works` (add status + specs), `/now` (replace, don't append), and `/about` (rare; rewrite, don't patch).

## 7a · How to write a piece (the recipe)

The mirror of §7, for long-form. Pieces are arguments — slower, polished, structured. The body face is serif (per §9); the layout is editorial (per [ADR 0012](./decisions/0012-pieces-editorial-layout.md)); the shape is the kernel-plus-six-sections from [ADR 0011](./decisions/0011-long-form-piece-shape.md).

1. **Open** `content/pieces/{en,es}/YYYY-MM-DD-short-slug.md`.

2. **Frontmatter:**

   ```yaml
   title: 'Piece title with optional _italic_ on the second clause'
   slug: 'short-slug'
   lang: en
   translationId: your-piece-slug
   date: 2026-05-01
   written: 'Melbourne, AU'
   status: draft
   tags: [framework-name, domain, optional-third]
   lede: 'Italic large lede, one sentence, max ~120 chars.'
   marginNotes:
     - section: 'h2-slug-here'
       text: 'Pull-quote text — extracted from the section it anchors.'
   diagrams: ['key-from-registry']
   hero: ./art.svg # optional per-entry SVG; co-located with the piece
   ```

   Pieces accept the same `hero:` per-entry override that notes and works do — see [ADR 0013](./decisions/0013-per-entry-art.md). Pieces don't render a default vignette today, so `hero:` is the only path to ship piece art.

3. **Structure** (per ADR 0011): kernel paragraph + 6–7 H2 sections + closing wrap. For framework pieces the section sequence is roughly:
   - personal-story (kernel + first H2)
   - framework-explanation-with-attribution
   - what-it-gets-right + what-it-doesn't-fix
   - common-mistakes-I-keep-making
   - when-this-isn't-the-right-tool
   - closing wrap

4. **Required components** for framework pieces:
   - **Attribution paragraph** naming the originator + canonical reference (book or website with edition or date). Pattern:

     > "[Framework] comes from _[Book/site]_ ([authors, edition, year]), a [book/site] about [one-line topic]. The [decomposition] is a [piece/whole] of a larger toolkit, but [why this piece matters]."

   - **Common mistakes I keep making** section — patterns the author has fallen into more than once. Specific, hedged, owned.
   - **When this isn't the right tool** section — three to four concrete cases where the framework is overkill or wrong.
   - **Terminology disambiguation** where names collide with adjacent industry terms (e.g., C4 Container ≠ Docker; Scrum ≠ agile).

5. **Length:** body 1200–1500 words. Below = too thin for the format; above = wrong format (push to a series, not a single piece).

6. **Bilingual:** ES = **parallel composition, not translation**. Rioplatense markers required: `vos`/`sos`, `escribís`/`mencioná`/`tomá`-style conjugations, `pileta`/`huerta`/`tipo`. Applies to body, captions, ledes, margin-note text, all frontmatter strings — a reviewer reading only the frontmatter shouldn't be able to spot which language was "the original."

7. **Code-name capitalisation across languages.** Framework labels stay in English even inside Spanish prose: Content / Pattern / Relationship (CPR), Container / Component (C4), Use Cases / Interface Adapters (Rings). Treated as proper nouns, capitalised, preserved verbatim across siblings.

8. **Tags:** 2–3, framework-first. EN keeps the framework as an English noun phrase; ES keeps the English loanword + translates the domain term. Worked examples:
   - `[clean-architecture, software-design]` / `[clean-architecture, diseño-de-software]`
   - `[c4-model, software-architecture, diagrams]` / `[c4-model, arquitectura-de-software, diagramas]`
   - `[crucial-conversations, communication, feedback]` / `[crucial-conversations, comunicación, feedback]`

9. **Margin notes → pull quotes.** 3 per piece. Each anchored to a real H2 by its slug — the remark plugin silently skips an anchor that matches no heading, so a typo or a removed section leaves a pull quote that just doesn't render. Each ≤180 chars (schema-enforced). Distributed structurally, not stacked at the closing. Voice = self-aware aside, often hedging or self-deprecating, never editorial. **Orphan policy:** when removing a section, drop the matching `marginNotes` entry, or restore the section. This is the one piece rule backed by a test (`tests/unit/piece-margin-note-anchors.test.ts`) — it's a silent-render bug, not a style call, so it gets a hard check rather than the §7b reflection pass.

10. **Anecdote fidelity** when migrating from a source: see §6. Real anecdotes only — never invent specifics to fit the voice.

11. **Voice rules.** Every sentence in the body passes the §6 five-word test. No em dashes in prose. No banned phrases. Hedges capped at 1–2 per paragraph.

12. **Title with optional inline italic.** The slug-page H1 renders `_word_` in the title as `<em>word</em>` via a narrow markdown-inline replacer in `PieceLayout.astro`. Use sparingly — split-italic titles work when there's a natural break in the headline (e.g., "The case for the _small static site_").

The four pieces in `src/content/pieces/{en,es}/` are the worked examples. ADR 0011 captures the structural decisions that derive this recipe.

## 7b · Reviewing a piece (the reflection pass)

After a draft exists — and before it ships — read it once against this list. These are **prompts to reflect, not gates to pass.** A "no" isn't an automatic failure; it's a question worth sitting with. The point is to catch the things that are easy to miss in the writing and obvious in the reading.

This pass is also what the LLM runs when it writes or reviews a piece: walk the list, flag what it notices, and explain its reasoning rather than silently "fixing" things. The writer decides; the list informs.

**Voice (§6)**

- Read it aloud. Does it sound like a colleague at the bench, or a keynote? If keynote, which sentences?
- Any em dashes in the prose? (Body only — captions and ledes are exempt.) Substitute period / comma / colon / semicolon / parens.
- Scan the §6 banned-phrases catalogue. Any hits? If so, is the phrase load-bearing (quoting, arguing against) or lazy? Reword the lazy ones.
- More than one or two hedges in any paragraph? Cut down to the load-bearing ones.
- Five-word test: any line over five words with no number / name / time / place? Add a specific or cut it.

**Shape (ADR 0011)**

- 6–7 H2 sections? If fewer, is it really a piece (vs. a note)? If more, should it be a series?
- Body roughly 1200–1500 words? Under = too thin; over = wrong format.
- Required components present: attribution paragraph, "common mistakes", "when this isn't the right tool", terminology disambiguation where names collide?

**Structure + frontmatter**

- 2–3 tags, framework-first?
- **Does every `marginNotes[].section` match a real H2 slug in the body?** A removed or renamed section leaves a pull quote that silently doesn't render. This one's backed by a test (`piece-margin-note-anchors.test.ts`) since it's a correctness bug, not a style call — but eyeball it here too.
- Diagrams reference real registry keys?

**Bilingual**

- Is the ES sibling a parallel composition, not a translation? Rioplatense markers throughout (`vos`/`sos`, `escribís`, `pileta`)?
- Code-name labels (Content / Pattern / Relationship, Container, etc.) preserved in English across both?
- Read the ES aloud, on its own — does it sound like the same person writing in the language they grew up in?

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

Two faces, no third. The face is part of the message.

| Content type                       | Face                   | Why                                    |
| ---------------------------------- | ---------------------- | -------------------------------------- |
| Notes, TILs, micro-posts           | JetBrains Mono 15/1.75 | Field log — fast, dated, in-process    |
| Pieces, long-form                  | Newsreader 18/1.65     | Slowed-down reading — argued, polished |
| All chrome / metadata / specs      | JetBrains Mono         | Tools are part of the work             |
| All display H1 / italics / accents | Newsreader             | Editorial voice                        |

The shift from mono to serif when moving from a note to a piece is the system saying: _what you're about to read takes more time. The author has slowed down. You should too._ It's the typographic expression of [§4 principle 5 ("Curiosity over conclusion")](#4--core-principles-with-tests-not-slogans).

- **Display:** Newsreader (variable, 300–800). Used for H1, H2, card titles, italic accents, **and piece body prose at 18 px / 1.65**.
- **Body / mono:** JetBrains Mono (400 / 500 / 700). Used for notes body, all chrome (eyebrow, date, tags, foot signature), labels, captions, specs, all tabular data. Always used for `<code>` and `<pre>`, regardless of route.
- **Fallback:** `"Iowan Old Style", Georgia, serif` and `ui-monospace, "SF Mono", Menlo, monospace`.
- **Sizing:** Display sizes use `clamp()` between two anchor breakpoints. Notes body is 15 px, line-height 1.55–1.75. Pieces body is 18 px (1.125 rem), line-height 1.65. **See `styles.css` for the truth — don't duplicate values here.**
- **`text-wrap: pretty`** on paragraphs. Browsers that don't support it degrade silently.
- **Italics** are reserved for: titles of works, foreign words used as-is (_mate_, _huerta_), and editorial emphasis. Never for "important."
- **Piece body weight is intentionally fractional** (`font-weight: 360`). Newsreader's named grades are 300/400/500/600/700; 360 sits between Light and Regular and reads as airy/editorial without going anemic against the heavier display H1. Set via the local `--prose-text-weight` custom property on `.piece-prose`; if a future style sweep tries to consolidate prose rules into a single 400-weight default, this is the regression risk to watch.
- **Pull quotes** (`<p class="pull">`) — italic serif at `clamp(22 px, 2.4vw, 28 px)`, line-height 1.35, accent left-border, indented 1.5 rem from the prose column. Injected by `remark-inject-margin-notes` at the end of each section (before the next H2), per ADR 0012. Replaces the old marginalia-rail aside. Markup is `<p>` not `<aside>` — `<aside>` is a landmark element and N>1 siblings need unique aria-labels (html-validate's `unique-landmark` rule); pieces have 3 pull quotes by design, so the landmark semantic doesn't fit. Pull quotes are typographic emphasis inside prose, not page-level asides.
- **Drop cap** — first paragraph of a piece's body only, identified by the `.lead-p` class injected by the remark plugin. `::first-letter` at 4.5 em, accent-coloured. Reduced-motion users keep the shape and lose the accent colour (drops to `var(--ink)`).
- **`§` H2 marker** — italic H2 headings on pieces get a `::before { content: "§" }` floated left of the heading in accent, upright. Mobile (≤ 720 px) collapses the marker to above the heading.

**Non-goal: a third face.** Newsreader does double duty — at 18 px it reads, at 80 px it shouts. One family, two grades. Future additions need an ADR (and need to refute ADR 0012's non-goal explicitly).

### Diagrams

Per ADR 0012, each diagram component is a `<figure class="diagram diagram--<kind>">`, pure SVG, no JS, CSP-safe. Per-role colour palette lives in `src/styles/diagrams.css` (a component-scoped stylesheet, imported from `base.css` alongside the per-route files).

**Pattern discipline** (documented inline in `diagrams.css`):

- **Shape-only roles** set `stroke` only. The SVG's inline `fill="none"` on the shape group stays in effect (CSS doesn't touch fill).
- **Text-only roles** set `fill` (text uses fill for colour).
- **Mixed roles** (paths + text in one role, e.g. `.d-arrow`) wrap the paths in an inner `<g fill="none">` inside the SVG so the role's fill cascades only to text.
- **Filled-shape roles** (e.g. `.d-hub`) explicitly opt in to `fill`.

Without this discipline, CSS `fill` on a role group overrides the SVG's inline `fill="none"` (CSS class rules outrank SVG presentation attributes) and otherwise-outlined shapes render as filled blobs.

**Canonical naming** for role classes:

- `.d-label` for text-bearing roles across all diagrams.
- `.d-sublabel` for italic secondary text.
- Diagram-specific roles for shapes (`.d-rings`, `.d-knot`, `.d-shape`, `.d-boundary`, etc.).
- Don't introduce diagram-specific synonyms for the canonical names.

Drift coverage in `tests/unit/diagram-roles.test.ts` enforces the schema in three directions: forward (every SVG `.d-<role>` has a CSS binding), reverse (every `var(--c-*)` reference is declared), and orphan (every CSS binding rule has a matching SVG class). Visual snapshots in `tests/e2e/visual.spec.ts` lock the palette across themes.

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

- **Chrome** — sticky header. Mark (left) · Nav (center) · Jump-to + Lang + Day/Night (right). Day/Night is a `<button role="switch" aria-checked>` with a single SVG that animates between sun (rays + disc) and moon (disc + slid-in mask) via CSS `transform` + `opacity` keyed to `[data-theme]`. Lang is a pair of links with a disabled-style state when the sibling translation is missing. The _"jump to…"_ (⌘K) trigger opens the command palette; on mobile it collapses to a magnifier icon (the foot-rail is already full with the six nav items).
- **Bench card** — home page vignette card (terminal / guitar / seedling / 3D print).
- **Latest entry row** — kind pill, date, title, arrow. Hover slides right.
- **Note entry** — three-column grid: date + tags (left), prose (centre), aside (right).
- **Work card** — vignette + spec list + status. Hover stacks a paper card behind via `::before` translate.
- **Facts card** (About sidebar) — small-caps title, `dl` of rows, optional footer link.
- **ASCII signature** — `╭─ NB · '26 ─╮` at the foot of Colofón.
- **NotFound** — 404 illustration + map back.
- **Command palette (⌘K)** — the site's search. Full contract below.

### Command palette (⌘K)

The site's search. Opens on ⌘K / Ctrl+K, or the _"jump to…"_ trigger in the chrome — which collapses to a magnifier icon on mobile.

- **It is navigation, not full-text search — yet.** At current scale (under ~30 items) a reader scans faster than they search, so the palette indexes _titles, ledes/decks, and tags_ of every route, note, piece, and work, plus the `/now` bench items (each carries its craft `kind` as a tag, so a topical search like "coffee" or "borges" jumps to `/now`). It's a fast "jump to", which is what a developer audience expects from ⌘K. It does _not_ read body prose — full-text (Pagefind) is a future "search everything" mode that can slot into this same UI.
- **Single source of truth.** `buildCmdkIndex(locale)` (`src/lib/cmdk-index.ts`) reads the same `notes` / `works` / `pieces` content collections the routes render, plus the static route list. There is no separate index to maintain — it's a prerendered per-locale endpoint (`/cmdk/<locale>.json`, from `src/pages/cmdk/[lang].json.ts`) that `src/scripts/cmdk.ts` fetches once on first open and caches; matching is client-side. Keeping the index out of the page HTML holds every page under the ~50 KB weight budget, and there's no wasm. It works under `astro dev` too — `trailingSlash: 'always'` serves the endpoint at `/x.json/` in dev but `/x.json` in the build, so the client tries the env-correct form first (via `import.meta.env.DEV`) and falls back to the other, rather than breaking silently if that config changes.
- **Matching** is substring-first, then a forgiving in-order subsequence fuzzy fallback. Results are capped (8 default / 12 on query) and grouped page → now → work → piece → note.
- **In-site by default.** Every result routes in-site via the View Transitions `navigate()`. An external destination (a `↗`, new tab) is reserved for when a work carries an explicit external link — there is no such field on the works schema today, so the palette never invents a destination a card wouldn't already have.
- **Keyboard-first + accessible.** `role="dialog"` + `aria-modal`; focus moves to the input on open and returns to the trigger on close; results are a `role="listbox"` with `aria-activedescendant`; ↑↓ move, ⏎ opens, esc closes, Tab is trapped.

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
- **Portrait exception.** The linocut self-portrait (`Portrait.astro`, on Home + About) is a deliberate inline SVG (~52 KB minified, ~16 KB gzipped) that exceeds the 32 KB cap. It stays inline rather than a raster so the ink follows the theme via `currentColor`/`--portrait-ink` (Día↔Noche) while the mate-gourd accent keeps its native terracotta (`--portrait-accent`). The cost is paid knowingly: the `document:size` Lighthouse budget for the generic page set is raised from 20 KB to 27 KB to fit it (Home lands ~21 KB, About ~20 KB; `total:size` stays ≤ 50 KB). If a future portrait is photographic, rasterise to AVIF instead.
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
5. **Polished notes.** A note that reads like a finished essay has betrayed its category. Move it to `/pieces` · `/ensayos` or roughen it. The face change is the rule: notes are mono, pieces are serif. See [§9 · Type](#9--type).
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
2. **Real copy.** Most body copy on Home, About, Notes, Now, and Colofón is currently invented. Replace with material Nicolas actually wrote.
3. **Search UI.** Pagefind index is built (`postbuild` produces `dist/_pagefind/`); UI not yet wired into the layouts. Drop in a small `.astro` component on `/notes`.
4. **Print stylesheet.** Notes and essays should print like typed letters. Dedicated `@media print` pass.
5. **`/drafts` index.** A public list of unfinished posts — the site claims "en proceso, en público"; right now nothing demonstrates that.

### Shipped (moved out of this list)

- **Search index** — Pagefind (`postbuild` script, per-language facet via `data-pagefind-filter="lang"`). UI still TODO above.
- **OG cards** — Satori + Resvg via `src/pages/og/[collection]/[slug].png.ts`, fonts in `public/fonts/og-newsreader.ttf`.
- **Real pieces.** `/pieces` · `/ensayos` shipped in PR P3 with four bilingual long-form pieces migrated from the legacy WordPress site. PR P5 pivoted the visual treatment from "marginalia notebook, longer" to **editorial article** — centered single column at `max-width: 760px`, display H1, italic large lede, drop cap on the first paragraph, italic H2 with floated `§` marker, inline pull quotes replacing the right-rail margin notes, redesigned row-list index with hover-slide. See [§9 · Type](#9--type) for the two-face rule and [ADR 0012](./decisions/0012-pieces-editorial-layout.md) for the pivot rationale.

---

_Last set in type on 22 May 2026. — N. B._
