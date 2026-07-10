import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const ROUTES = [
  { path: '/en/', lang: 'en', title: 'Nicolas Bracigliano' },
  { path: '/es/', lang: 'es', title: 'Nicolas Bracigliano' },
  { path: '/en/notes/', lang: 'en' },
  { path: '/es/notas/', lang: 'es' },
  { path: '/en/works/', lang: 'en' },
  { path: '/es/obras/', lang: 'es' },
  { path: '/en/about/', lang: 'en' },
  { path: '/es/sobre/', lang: 'es' },
  { path: '/en/about/now/', lang: 'en' },
  { path: '/es/sobre/ahora/', lang: 'es' },
  { path: '/en/colophon/', lang: 'en' },
  { path: '/es/colofón/', lang: 'es' },
  { path: '/en/pieces/', lang: 'en' },
  { path: '/es/ensayos/', lang: 'es' },
  // One slug per locale to exercise the editorial slug-page layout
  // (display H1, drop cap, italic H2 with §, inline pull quotes, foot
  // signature) under axe-core. Covering all 8 slug pages would be
  // over-coverage — the layout is shared, so one slug per locale is
  // enough.
  { path: '/en/pieces/rings-i-keep-redrawing/', lang: 'en' },
  { path: '/es/ensayos/anillos-que-sigo-redibujando/', lang: 'es' },
] as const;

for (const route of ROUTES) {
  test(`${route.path} renders with correct html[lang]`, async ({ page }) => {
    const res = await page.goto(route.path);
    expect(res?.ok()).toBeTruthy();
    await expect(page.locator('html')).toHaveAttribute('lang', route.lang);
  });

  test(`${route.path} has hreflang alternates`, async ({ page }) => {
    await page.goto(route.path);
    await expect(page.locator('link[rel="alternate"][hreflang="en"]')).toHaveCount(1);
    await expect(page.locator('link[rel="alternate"][hreflang="es"]')).toHaveCount(1);
    await expect(page.locator('link[rel="alternate"][hreflang="x-default"]')).toHaveCount(1);
  });

  test(`${route.path} has no serious axe violations`, async ({ page }) => {
    await page.goto(route.path);
    // Exclude `.about-intro` from the contrast scan. The about-page
    // intro overlay is `aria-hidden="true"` + `role="presentation"`
    // and animates its opacity to 0 over ~2.4 s before removing
    // itself from the DOM. axe-core checks contrast on aria-hidden
    // elements anyway (low-vision sighted users see them), and on
    // CI runners that happen to scan during mid-fade, the `hola.`
    // glyph fails the 3:1 large-text threshold by being painted at
    // ~5% opacity over `--bg`. Excluding the selector keeps the
    // rest of the page covered; the intro's own contrast at the
    // first frame (opacity 1) is fine and there's no AT-visible
    // affordance to lose.
    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa'])
      .exclude('.about-intro')
      .analyze();
    const serious = results.violations.filter(
      (v) => v.impact === 'serious' || v.impact === 'critical',
    );
    expect(serious).toEqual([]);
  });
}

test('day/night toggle is role="switch" with aria-checked', async ({ page }) => {
  await page.goto('/en/');
  const toggle = page.locator('#theme-toggle');
  await expect(toggle).toHaveAttribute('role', 'switch');
  await expect(toggle).toHaveAttribute('aria-checked', /^(true|false)$/);
});

test('install metadata advertises raster app icons', async ({ page }) => {
  await page.goto('/en/');
  await expect(page.locator('link[rel="apple-touch-icon"]')).toHaveAttribute(
    'href',
    '/apple-touch-icon.png?v=1',
  );
  await expect(page.locator('link[rel="apple-touch-icon"]')).toHaveAttribute('sizes', '180x180');
  await expect(page.locator('link[rel="manifest"]')).toHaveAttribute('href', '/site.webmanifest');
  await expect(page.locator('meta[name="apple-mobile-web-app-title"]')).toHaveAttribute(
    'content',
    'Nicolas Bracigliano',
  );
});

test('theme follows OS changes after client-side navigation when no override is stored', async ({
  page,
}) => {
  await page.emulateMedia({ colorScheme: 'light' });
  await page.addInitScript(() => localStorage.removeItem('theme'));
  await page.goto('/en/');

  const html = page.locator('html');
  await expect(html).toHaveAttribute('data-theme', 'dia');

  await page.locator('.nav a[href="/en/notes/"]').click();
  await page.waitForURL('**/en/notes/');
  await expect(html).toHaveAttribute('data-theme', 'dia');

  await page.emulateMedia({ colorScheme: 'dark' });
  await expect(html).toHaveAttribute('data-theme', 'noche');

  await page.emulateMedia({ colorScheme: 'light' });
  await expect(html).toHaveAttribute('data-theme', 'dia');
  await expect.poll(() => page.evaluate(() => localStorage.getItem('theme'))).toBeNull();
});

test('language toggle persists choice to localStorage', async ({ page }) => {
  await page.goto('/en/');
  await page.locator('.lang-toggle a[data-lang="es"]').click();
  await page.waitForURL('**/es/**');
  const stored = await page.evaluate(() => localStorage.getItem('lang'));
  expect(stored).toBe('es');
});

// Wire-up integration checks. The pieces these cover are easy to silently
// disconnect in a future refactor (e.g. someone drops `ogImage` from
// BaseLayout's prop pass-through) — these tests fail loudly when that
// happens, instead of waiting on a manual visual check.
test('note entry pages emit og:image meta pointing at the generated PNG', async ({ page }) => {
  await page.goto('/en/notes/hello/');
  const ogImage = page.locator('meta[property="og:image"]');
  await expect(ogImage).toHaveAttribute('content', /\/og\/notes\/en-hello\.png$/);
});

test('work entry pages emit og:image meta pointing at the generated PNG', async ({ page }) => {
  await page.goto('/en/works/this-site/');
  const ogImage = page.locator('meta[property="og:image"]');
  await expect(ogImage).toHaveAttribute('content', /\/og\/works\/en-this-site\.png$/);
});

test('note detail page renders an auto-computed read-time in the colophon', async ({ page }) => {
  // The slug page has its own composition (NoteDetail, not NoteEntry):
  // read-time renders in the shared ArticleColophon meta line, computed
  // from the body when frontmatter `minutes:` is absent.
  await page.goto('/en/notes/hello/');
  await expect(page.locator('.ac-meta')).toContainText(/read time \d+ min/);
});

test('detail pages carry the colophon copy-link wired to their own path', async ({ page }) => {
  // The quiet copy control lives in the shared ArticleColophon on all
  // three detail routes; `data-ac-url` is what the clipboard script
  // copies (origin + path). One assertion per route guards the shared
  // wiring without re-testing the component three times.
  for (const path of ['/en/notes/hello/', '/en/pieces/rings-i-keep-redrawing/']) {
    await page.goto(path);
    await expect(page.locator('[data-ac-copy-root]')).toHaveAttribute('data-ac-url', path);
    await expect(page.locator('.ac-copy[data-ac-copy]')).toBeVisible();
  }
  await page.goto('/en/works/this-site/');
  await expect(page.locator('[data-ac-copy-root]')).toHaveAttribute(
    'data-ac-url',
    '/en/works/this-site/',
  );
});

test('colophon copy-link copies the page URL and reports success honestly', async ({
  page,
  context,
}) => {
  // Click → clipboard write resolves → "link copied" appears. The
  // is-copied state is only set after the write resolves (never a
  // silent lie), so asserting the label change also asserts the write.
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  await page.goto('/en/notes/hello/');
  await page.locator('.ac-copy[data-ac-copy]').click();
  await expect(page.locator('.ac-copy[data-ac-copy]')).toHaveClass(/is-copied/);
  const copied = await page.evaluate(() => navigator.clipboard.readText());
  expect(copied).toMatch(/\/en\/notes\/hello\/$/);
});

test('notes index renders the "→ link" permalink on each note', async ({ page }) => {
  await page.goto('/en/notes/');
  // Every published note renders a `.note-foot` containing a
  // permalink, so the total `.note-foot a` count equals the
  // visible note count.
  const links = page.locator('.note-foot a');
  await expect(links).not.toHaveCount(0);
  await expect(links.first()).toHaveAttribute('href', /^\/en\/notes\/[a-z-]+\/$/);
});

test('colophon Principles section carries the .is-accent modifier', async ({ page }) => {
  await page.goto('/en/colophon/');
  // The Principles section is the one styled with the warm-tint <dl>.
  // We assert structurally rather than by index so reordering blocks
  // doesn't break the test.
  const principles = page.locator('.colofon-block.is-accent');
  await expect(principles).toHaveCount(1);
  await expect(principles).toContainText('Principles');
});

test('colophon /es/ Principios section carries the .is-accent modifier', async ({ page }) => {
  await page.goto('/es/colofón/');
  const principios = page.locator('.colofon-block.is-accent');
  await expect(principios).toHaveCount(1);
  await expect(principios).toContainText('Principios');
});

test('ASCII signature renders with the current two-digit year', async ({ page }) => {
  await page.goto('/en/colophon/');
  const yearTwoDigit = new Date().getFullYear().toString().slice(-2);
  // The block reads `│   N  ·  B  ·  'NN │` — assert the year segment.
  await expect(page.locator('.ascii-sig')).toContainText(`'${yearTwoDigit}`);
});

// Notes-structural assertions. PR 1.2 shipped without these; a future
// refactor could silently break the marginalia visual rules without any
// of the existing axe/lang/hreflang/wire-up tests noticing.
test('notes index — first note margin-mark is ✸, subsequent rows are ↳', async ({ page }) => {
  await page.goto('/en/notes/');
  const marks = page.locator('.note .margin-mark');
  // The assertion needs at least two notes with `aside:` frontmatter
  // (it checks the first AND second marks) — the not-toHaveCount(0)
  // guard below fails loudly if the published set ever drops under that.
  await expect(marks).not.toHaveCount(0);
  await expect(marks.first()).toHaveText('✸');
  await expect(marks.nth(1)).toHaveText('↳');
});

test('note ornament <hr> renders inside .note-prose when markdown has ---', async ({ page }) => {
  await page.goto('/en/notes/hello/');
  // The hello note's body has a `---` between paragraphs that markdown
  // renders as <hr>, which CSS dresses as a dotted-radial ornament.
  await expect(page.locator('.note-prose hr')).toHaveCount(1);
});

test('note glyphs render an SVG keyed to each kind', async ({ page }) => {
  await page.goto('/en/notes/');
  // The published notes cover code, guitar, and coffee; garden
  // remains covered by the schema and ContentArt's glyph map but
  // isn't exercised by a published note today.
  await expect(page.locator('.note-glyph.g-code svg')).not.toHaveCount(0);
  await expect(page.locator('.note-glyph.g-guitar svg')).toHaveCount(1);
});

test('work-card stretched-link covers the whole card', async ({ page }) => {
  await page.goto('/en/works/');
  // At the centre of the card-foot bounding box, `elementFromPoint`
  // should resolve to the title's `<a class="work-card-link">` — its
  // `::before { inset: 0 }` extends the hit area over the whole card.
  // We assert via DOM rather than a click because Playwright's pointer-
  // stability check (correctly) refuses to click `.work-card-foot` when
  // the pseudo intercepts pointer events — which is the behaviour we're
  // testing in the first place.
  const foot = page.locator('.work-card').first().locator('.work-card-foot');
  await foot.scrollIntoViewIfNeeded();
  const hit = await foot.evaluate((el) => {
    const r = el.getBoundingClientRect();
    const target = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
    return target ? { tag: target.tagName, cls: target.className } : null;
  });
  expect(hit?.tag).toBe('A');
  expect(hit?.cls).toContain('work-card-link');
});

// `/about/` smoke tests. Naming convention: prefix with `/en/about/` or
// `/es/sobre/` for single-locale tests; prefix with `/about/` when the
// test exercises both locales inline.

test('/en/about/ — sidebar carries 4 cards (3 FactsCard + 1 AboutCta with mailto)', async ({
  page,
}) => {
  await page.goto('/en/about/');
  await expect(page.locator('.about-aside .facts-card')).toHaveCount(4);
  await expect(page.locator('.about-cta-link[href^="mailto:"]')).toHaveCount(1);
});

test('/es/sobre/ — sidebar carries 4 cards (mirror)', async ({ page }) => {
  await page.goto('/es/sobre/');
  await expect(page.locator('.about-aside .facts-card')).toHaveCount(4);
  await expect(page.locator('.about-cta-link[href^="mailto:"]')).toHaveCount(1);
});

test('/about/ — "full bench tour" footer link points at the right /now route per locale', async ({
  page,
}) => {
  await page.goto('/en/about/');
  await expect(page.locator('.facts-foot-link')).toHaveAttribute('href', '/en/about/now/');
  await page.goto('/es/sobre/');
  await expect(page.locator('.facts-foot-link')).toHaveAttribute('href', '/es/sobre/ahora/');
});

test('/en/about/ — byline contains the current month name', async ({ page }) => {
  await page.goto('/en/about/');
  // `en-AU` month: long → "may", "june", etc. Lowercased in template.
  // The byline is rendered with `timeZone: 'Australia/Melbourne'` (see
  // src/pages/en/about/index.astro), so compute the expected month in the
  // SAME zone. Without it, the formatter uses the runner's local zone — and
  // on a UTC CI runner that disagrees with the page for the ~10 h each
  // month boundary when Melbourne has rolled over but UTC hasn't (this is
  // exactly what failed the May→June 2026 rollover).
  const currentMonth = new Intl.DateTimeFormat('en-AU', {
    month: 'long',
    timeZone: 'Australia/Melbourne',
  })
    .format(new Date())
    .toLowerCase();
  await expect(page.locator('.about-out')).toContainText(currentMonth);
});

test('/en/about/ — masthead carries the accent-coloured `.about-h1-dot`', async ({ page }) => {
  await page.goto('/en/about/');
  // The accent dot on the masthead `<h1>` (`Hola.`) visually rhymes
  // with the intro overlay's `.about-intro-dot`. CSS rules in
  // `base.css` colour both via the same selector list. If a future
  // markup refactor drops the `<span class="about-h1-dot">`, the
  // rhyme silently dies — this test catches that.
  await expect(page.locator('.about-h1 .about-h1-dot')).toHaveCount(1);
});

test('/about/ — intro overlay markup is in the SSR response', async ({ page }) => {
  // The overlay markup must ship in the static HTML so the CSS
  // auto-dismiss can play even if the JS layer never reaches the page.
  // (Not a "renders without JS" assertion — that would need a fresh
  // context with `javaScriptEnabled: false`; this just guarantees the
  // markup isn't client-side-only-injected by a future refactor.)
  const response = await page.request.get('/en/about/');
  const html = await response.text();
  expect(html).toContain('data-about-intro');
  expect(html).toContain('about-intro-hola');
});

// Intro animation timing constants — keep these in sync with
// `@keyframes about-intro-out` (2400 ms duration + 200 ms delay) and
// `@keyframes about-intro-hola-in` (700 ms duration + 200 ms delay) in
// `src/styles/animations.css` + the animation declarations in
// `src/styles/base.css`. The lifecycle assertion below picks waits
// that sit in the gaps between known animation events.
const INTRO_INNER_FADE_END_MS = 900; // hola-in ends here; the original
//                                       bug removed the overlay at this point
const INTRO_TOTAL_MS = 2600; // overlay-out finishes here (200 ms delay
//                              + 2400 ms duration)
const INTRO_WAIT_BUFFER_MS = 250; // padding either side of timing edges

test("/about/ — intro overlay survives child animation-end events, removes itself only on the overlay's own out-animation", async ({
  context,
  page,
}) => {
  // Clear sessionStorage via init script — runs before the page's own
  // scripts, so wireIntro sees an empty `about-intro-seen` flag and
  // plays the animation. Cleaner than the previous goto + evaluate +
  // reload dance because we don't need a throwaway navigation just to
  // get access to sessionStorage.
  await context.addInitScript(() => {
    try {
      sessionStorage.removeItem('about-intro-seen');
    } catch {
      /* sessionStorage unavailable — fall through */
    }
  });
  await page.goto('/en/about/');

  // Sync on `wireIntro` having added `.is-active`. Before this
  // class is set the overlay is `display: none` and no animation
  // ticks; timing everything from goto (the previous form) raced
  // the JS load on slow runners — by the time we'd "waited past
  // overlay-out", the animation hadn't actually started yet.
  // Anchoring to `.is-active` makes the rest of the test
  // self-consistent with the animation's wall-clock.
  await page.locator('.about-intro.is-active').waitFor({ timeout: 5_000 });

  // Past the inner hola-in but before overlay-out: the overlay must
  // still be attached. Catches the original bug where a
  // `{ once: true }` animationend listener picked up the bubbled
  // child animation here and tore the intro down too early.
  await page.waitForTimeout(INTRO_INNER_FADE_END_MS + INTRO_WAIT_BUFFER_MS);
  await expect(page.locator('[data-about-intro]')).toBeAttached();

  // After overlay-out completes + buffer for animationend + DOM
  // removal, the overlay must be gone. Generous `toHaveCount`
  // timeout so a slow runner with dropped animation frames
  // (animation stretches past INTRO_TOTAL_MS wall-clock) still
  // converges before failing.
  await expect(page.locator('[data-about-intro]')).toHaveCount(0, {
    timeout: INTRO_TOTAL_MS - INTRO_INNER_FADE_END_MS + INTRO_WAIT_BUFFER_MS + 5_000,
  });
});

// `/now/` smoke tests. Same naming convention as `/about/` tests
// above: `/en/about/now/` or `/es/sobre/ahora/` for single-locale,
// `/now/` for both-locale assertions.

test('/about/now/ — numbered items run a contiguous № sequence, mirrored across locales', async ({
  page,
}) => {
  // The full sequence is asserted (not just first + last) so a bug that
  // pins every item to the same number — e.g. dropping the map-index from
  // the `position` prop — fails loudly. The item count is content-driven
  // (a range, per now-items.ts NOW_ITEM_MIN/MAX), so derive it instead of
  // hardcoding, and assert the two locales mirror each other.
  const counts: number[] = [];
  for (const path of ['/en/about/now/', '/es/sobre/ahora/']) {
    await page.goto(path);
    const nums = page.locator('.now-num');
    const count = await nums.count();
    expect(count).toBeGreaterThanOrEqual(4);
    for (let i = 0; i < count; i++) {
      await expect(nums.nth(i)).toContainText(`№ ${String(i + 1).padStart(2, '0')}`);
    }
    counts.push(count);
  }
  expect(counts[0]).toBe(counts[1]);
});

test('/en/about/now/ — masthead carries the current weekday name', async ({ page }) => {
  await page.goto('/en/about/now/');
  // The masthead date is `en-AU` long-form: "friday, 23 may 2026",
  // lowercased in the template. Asserting the weekday — a less-flaky
  // anchor than the day-number (which we'd have to time-freeze) and
  // a stronger signal than "any date string" (the eyebrow lives
  // next to it). Known flake window: < 1 s/day at Australia/Melbourne
  // midnight, when render and assert can straddle the boundary.
  const weekday = new Intl.DateTimeFormat('en-AU', {
    weekday: 'long',
    timeZone: 'Australia/Melbourne',
  })
    .format(new Date())
    .toLowerCase();
  await expect(page.locator('.now-date')).toContainText(weekday);
});

test('/en/about/now/ — each item has a detail <dl> with at least one dt/dd pair', async ({
  page,
}) => {
  await page.goto('/en/about/now/');
  // We don't assert the exact dt count because the seed content can
  // grow per item; just guarantee the structural contract that every
  // item has a <dl> with content. Catches a regression where
  // NowItem's slot stops rendering the detail array.
  const itemCount = await page.locator('.now-item').count();
  const details = page.locator('.now-item .now-detail');
  await expect(details).toHaveCount(itemCount);
  for (let i = 0; i < itemCount; i++) {
    await expect(details.nth(i).locator('dt').first()).not.toBeEmpty();
    await expect(details.nth(i).locator('dd').first()).not.toBeEmpty();
  }
});

test('/about/now/ — the code item "see also" links to the matching work, localized per locale', async ({
  page,
}) => {
  // Wire-up check: the `work:` ref on a now item resolves to the work's
  // localized /works route (EN slug `this-site` / ES `este-sitio`) from
  // the single shared translationId. Easy to silently disconnect — drop
  // the prop pass-through in the now index page and the link vanishes
  // with no other test noticing. The visible path mirrors the href minus
  // the locale prefix (see `workLinkLabel`); the aria-label folds the
  // localized eyebrow back into the link's accessible name (the eyebrow
  // span is aria-hidden, so the label is the only place it reaches AT).
  for (const { path, href, label, eyebrow } of [
    {
      path: '/en/about/now/',
      href: '/en/works/this-site/',
      label: '/works/this-site',
      eyebrow: 'see also',
    },
    {
      path: '/es/sobre/ahora/',
      href: '/es/obras/este-sitio/',
      label: '/obras/este-sitio',
      eyebrow: 'ver también',
    },
  ]) {
    await page.goto(path);
    const row = page.locator('.now-code .now-see-also');
    const pathLink = row.locator('.now-see-path-link');
    const arrowLink = row.locator('.now-see-arrow-link');
    const spacer = row.locator('.now-see-spacer');

    await expect(pathLink).toHaveAttribute('href', href);
    await expect(pathLink.locator('.now-see-path')).toHaveText(label);
    await expect(pathLink).toHaveAttribute('aria-label', `${eyebrow} ${label}`);
    await expect(arrowLink).toHaveAttribute('href', href);
    await expect(arrowLink.locator('.now-see-arrow')).toHaveText('→');

    await pathLink.hover();
    await expect(pathLink.locator('.now-see-path')).toHaveCSS('text-decoration-line', 'underline');
    await expect(arrowLink.locator('.now-see-arrow')).toHaveCSS('text-decoration-line', 'none');
    await expect(pathLink).toHaveCSS('cursor', 'pointer');

    await spacer.hover();
    await expect(spacer).toHaveCSS('cursor', 'auto');

    await arrowLink.hover();
    await expect(arrowLink).toHaveCSS('cursor', 'pointer');

    await arrowLink.click();
    await expect(page).toHaveURL(new RegExp(`${href.replaceAll('/', '\\/')}$`));

    await page.goto(path);
    // Negative: an item without a `work:` ref renders no see-also at all.
    await expect(page.locator('.now-guitar .now-see-also')).toHaveCount(0);
  }
});

test('/about/now/ — each present kind renders a unique per-kind class', async ({ page }) => {
  await page.goto('/en/about/now/');
  // The CSS keys the № tint off `.now-<kind>`; if a refactor drops a kind
  // from the page the visual rhythm breaks silently, so assert it
  // structurally. List the kinds CURRENTLY in now.md — `garden` and `read`
  // are commented out there for now; re-add them here when they return.
  // (Earlier this assertion was deleted wholesale to unblock CI when
  // garden was removed; scoping to present kinds keeps the guard instead.)
  const kinds = ['code', 'guitar', 'print', 'home', 'coffee'] as const;
  for (const kind of kinds) {
    await expect(page.locator(`.now-item.now-${kind}`)).toHaveCount(1);
  }
});

// Per-kind vignette art — structural coverage (ADR 0013 amendment).
// Pixel snapshots stay local-only (visual.spec.ts is host-suffixed and
// skipped on CI by design); these instead guard the thing a refactor
// actually breaks: that each shared vignette renders on its surface with
// the elements its scroll-in animation keys off. The companion
// tests/unit/vignette-art.test.ts guards the same at the source level
// (bench + registry render the same file).

test('home bench — each vignette renders with its animation hooks', async ({ page }) => {
  await page.goto('/en/');
  // code editor: pane + blinking cursor
  await expect(page.locator('.bench-card--code .code-vig .caret')).toHaveCount(1);
  // guitar: six strings + the baked caption
  await expect(page.locator('.bench-card--guitar .guitar-vig .string')).toHaveCount(6);
  await expect(page.locator('.bench-card--guitar .guitar-vig text')).not.toBeEmpty();
  // gridfinity: four bins drop in
  await expect(page.locator('.bench-card--print .print-vig .bin')).toHaveCount(4);
  // media wall: the fire has tongues to flicker
  await expect(page.locator('.bench-card--home .home-vig .flame')).not.toHaveCount(0);
});

// Home "Latest entries" — the feed shows the latest two of each kind,
// grouped work → piece → note (matching ⌘K's KIND_ORDER). These assert the
// behaviour types can't: the per-kind count, the grouping order, and the
// a11y/markup contracts (link name = kind + title; <time> only wraps a real
// date, never the "ongoing" status word).
test('home latest entries — two of each kind, grouped work → piece → note', async ({ page }) => {
  await page.goto('/en/');
  // 3 notes / 3 works / 4 pieces are published, so the feed caps at 2+2+2.
  await expect(page.locator('.latest-row')).toHaveCount(6);
  // Order asserted by pill class, robust to label localization.
  const kinds = await page
    .locator('.latest-row .kind-pill')
    .evaluateAll((els) =>
      els.map((el) => Array.from(el.classList).find((c) => c.startsWith('k-'))),
    );
  expect(kinds).toEqual(['k-work', 'k-work', 'k-piece', 'k-piece', 'k-note', 'k-note']);
  // Teasers render for entries that have a lede (lede is schema-optional,
  // and the component guards on it). Assert the feature works — at least
  // one renders and none are empty — rather than pinning an exact count to
  // the current fixtures, which a future lede-less entry would break.
  const teasers = page.locator('.latest-row .latest-teaser');
  expect(await teasers.count()).toBeGreaterThan(0);
  for (const text of await teasers.allInnerTexts()) {
    expect(text.trim()).not.toBe('');
  }
});

test('home latest entries — descriptor and foot links derive from the feed order', async ({
  page,
}) => {
  await page.goto('/en/');
  // Descriptor kind sequence mirrors the grouped rows (work · piece · note).
  await expect(page.locator('.latest-meta')).toHaveText('two of each · work · piece · note');
  // One foot link per kind, in the same order, pointing at each index.
  const links = page.locator('.latest-foot a.latest-all');
  await expect(links).toHaveCount(3);
  await expect(links.nth(0)).toHaveAttribute('href', '/en/works/');
  await expect(links.nth(1)).toHaveAttribute('href', '/en/pieces/');
  await expect(links.nth(2)).toHaveAttribute('href', '/en/notes/');
});

test('home latest entries — link name is kind + title; <time> only wraps real dates', async ({
  page,
}) => {
  await page.goto('/en/');
  // Accessible name is concise (kind + title), not the verbose
  // pill+date+teaser concatenation.
  await expect(page.locator('.latest-link').first()).toHaveAttribute('aria-label', /^work: .+/);
  // Pieces and notes are always dated, so at least four rows use <time>;
  // every emitted <time> must carry a valid ISO date (ongoing works render
  // a <span> instead, never a <time> around the word "ongoing").
  const times = page.locator('.latest-row time.latest-date');
  expect(await times.count()).toBeGreaterThanOrEqual(4);
  for (const dt of await times.evaluateAll((els) => els.map((el) => el.getAttribute('datetime')))) {
    expect(dt).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  }
});

test('works — each kind renders its default vignette via the registry', async ({ page }) => {
  await page.goto('/en/works/this-site/');
  await expect(page.locator('.work-art--code svg .caret')).toHaveCount(1);
  await page.goto('/en/works/gridfinity-bins/');
  await expect(page.locator('.work-art--print svg .bin')).toHaveCount(4);
  await page.goto('/en/works/stone-wood/');
  await expect(page.locator('.work-art--home svg .flame')).not.toHaveCount(0);
});

// `/404` smoke tests. The page catches any unmatched URL.
//
// All four tests navigate via unmatched paths that end in `/`.
// Reason: `astro preview` (the server backing this suite) only
// serves the custom `dist/404.html` when an unmatched URL has a
// trailing slash — `curl /foo/` returns our page, `curl /foo`
// returns Astro's built-in "404: Not Found" page. The preview
// server reads `trailingSlash: 'always'` as "only canonical-slash
// URLs are mine to handle." Cloudflare Workers Static Assets in
// production doesn't read Astro's config and serves `404.html`
// (via `not_found_handling = "404-page"`) for any unmatched URL
// regardless of slash, so the suffix-`/` constraint applies only
// to this test environment, not to real visitors.

test('/404 — broken-N illustration + masthead are in the SSR response', async ({ page }) => {
  await page.goto('/this-route-is-not-real/');
  // The illustration is a single inline SVG with the broken-N
  // class; the masthead h1 reads "I couldn't find / what you were
  // looking for." Bilingual identity is asserted separately by
  // the next test via the caption + ES route names.
  await expect(page.locator('svg.broken-n')).toHaveCount(1);
  await expect(page.locator('.notfound-h1')).toContainText("I couldn't find");
  await expect(page.locator('.notfound-h1')).toContainText('what you were looking');
  // The caption ("a misplaced letter · una letra fuera de lugar")
  // is where the page first signals it's bilingual — assert the
  // ES half exists so a refactor that drops it fails loudly.
  await expect(page.locator('.notfound-caption [lang="es"]')).toContainText(
    'una letra fuera de lugar',
  );
});

test('/404 — offers paths back in both locales', async ({ page }) => {
  await page.goto('/some-other-broken-path/');
  // Four EN routes (→ home / notes / works / about) + four ES
  // mirrors (inicio / notas / obras / sobre). Asserting via the
  // `[lang="es"]` markers — they're how screen readers know to
  // switch pronunciation, and the smoke test reuses them as a
  // structural marker.
  const enLinks = page.locator('.notfound-links li > a[href^="/en/"]');
  const esLinks = page.locator('.notfound-links li [lang="es"]');
  await expect(enLinks).toHaveCount(4);
  await expect(esLinks).toHaveCount(4);
  await expect(page.locator('.notfound-foot a[href^="mailto:"]')).toHaveCount(1);
});

test('/404 — emits noindex and drops canonical / hreflang / og:url', async ({ page }) => {
  // The HTTP 404 status is the primary signal, but the meta-level
  // belt-and-suspenders matters too: a crawler that lands on a
  // bogus URL shouldn't index it as the canonical version of
  // anything. BaseLayout's `noindex` prop gates the indexing
  // signals together — noindex on, canonical/hreflang/og:url off.
  await page.goto('/yet-another-broken-path/');
  await expect(page.locator('meta[name="robots"][content="noindex"]')).toHaveCount(1);
  await expect(page.locator('link[rel="canonical"]')).toHaveCount(0);
  await expect(page.locator('link[rel="alternate"][hreflang]')).toHaveCount(0);
  await expect(page.locator('meta[property="og:url"]')).toHaveCount(0);
});

test('/404 has no serious axe violations', async ({ page }) => {
  // Mirrors the main `ROUTES` loop's a11y check but for the 404
  // fallback, which can't be added to that loop because Astro's
  // `trailingSlash: always` redirect intercepts a direct `/404`
  // visit before the 404 handler runs.
  await page.goto('/another-broken-path/');
  const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze();
  const serious = results.violations.filter(
    (v) => v.impact === 'serious' || v.impact === 'critical',
  );
  expect(serious).toEqual([]);
});

test('/404 — fallback returns HTTP 404 and the inline script fills the requested path', async ({
  page,
}) => {
  // A path that resolves to nothing: Astro's preview server (and
  // Workers Static Assets in production) serves `404.html` with
  // status 404. The page's script reads `window.location.pathname`
  // and writes it into `#notfound-url`.
  const bogus = '/this-path-does-not-exist-xyz/';
  const response = await page.goto(bogus);
  expect(response?.status()).toBe(404);
  await expect(page.locator('#notfound-url')).toHaveText(bogus);
});

test('works filter toggles cards via data-kind matching', async ({ page }) => {
  // Generous test budget. `astro:page-load` fires post-load and
  // wireFilters runs synchronously inside that listener, but the
  // ClientRouter bootstrap that emits `astro:page-load` can take
  // a beat on cold preview-server hits where the script bundle
  // hasn't been parsed yet — was flaking the default 30 s budget.
  test.setTimeout(45_000);

  await page.goto('/en/works/');
  // Wait for the inline script to have wired the toolbar — without this,
  // a fast `goto`/`click` can race the `astro:page-load` listener that
  // attaches the click handler, and the click silently no-ops.
  await page.locator('.works-filters[data-wired="true"]').waitFor({ timeout: 15_000 });
  // Initial state: all cards visible.
  const all = page.locator('.work-card');
  await expect(all).toHaveCount(3);
  for (let i = 0; i < 3; i++) {
    await expect(all.nth(i)).toBeVisible();
  }
  // Click "code" filter → only the one `data-kind="code"` card stays.
  await page.locator('.filter[data-filter="code"]').click();
  await expect(page.locator('.filter.on')).toHaveAttribute('data-filter', 'code');
  await expect(page.locator('.filter[data-filter="code"]')).toHaveAttribute('aria-pressed', 'true');
  const visibleAfter = page.locator('.work-card:not([hidden])');
  await expect(visibleAfter).toHaveCount(1);
  await expect(visibleAfter).toHaveAttribute('data-kind', 'code');
  // Click "all" → everything returns.
  await page.locator('.filter[data-filter="all"]').click();
  await expect(page.locator('.work-card:not([hidden])')).toHaveCount(3);
});

// CSP-compatibility contract. `public/_headers` ships
// `script-src 'self'` — every emitted script must therefore be a
// same-origin file, never an inline `<script>` block. Astro's
// default behaviour inlines hoisted chunks under
// `vite.build.assetsInlineLimit` (default 4096 B); ADR 0008
// pins it to 0 to force externalisation. If a future config
// change re-enables inlining (or a new page introduces an inline
// `<script>` block that slips through `is:inline`), the
// following user-visible features all silently break on the
// deployed Worker while continuing to work in dev (which doesn't
// enforce CSP):
//
//   - Home masthead wall-clock stops advancing past "—:—"
//   - Bench-card scroll-driven vignettes never play
//   - /about/ intro overlay never renders
//   - Theme handover on `astro:page-load` stops; OS dark-mode
//     pickup requires a refresh
//   - /works/ filter buttons no-op
//   - /404 page never fills the requested path
//
// Asserts on the script body, not just `[src]` absence — a tag
// like `<script src="…">body</script>` would slip past
// `:not([src])` but still trip CSP for its inline content.
// Sweep every published route plus the 404 fallback so a new
// route added without an inline-script audit fails the check.
test.describe('CSP `script-src self` contract — zero inline scripts', () => {
  const ROUTES = [
    '/en/',
    '/es/',
    '/en/notes/',
    '/es/notas/',
    '/en/works/',
    '/es/obras/',
    '/en/about/',
    '/es/sobre/',
    '/en/about/now/',
    '/es/sobre/ahora/',
    '/en/colophon/',
    '/es/colofón/',
    '/404.html',
  ] as const;

  for (const path of ROUTES) {
    test(`${path} ships zero inline <script> bodies`, async ({ page }) => {
      await page.goto(path);
      const inlineScripts = await page.evaluate(() =>
        Array.from(document.querySelectorAll('script'))
          .filter((s) => (s.textContent ?? '').trim().length > 0)
          .map((s) => (s.textContent ?? '').trim().slice(0, 80)),
      );
      expect(inlineScripts).toEqual([]);
    });
  }
});

// Visual contract for the route-masthead hairline rule
// (`.eyebrow--rule::before`). Without this assertion, removing
// the modifier from a masthead, or accidentally setting
// `letter-spacing: 0` on the global `.eyebrow` (which would
// re-tempt someone to bring back the "———" text content), would
// silently regress the prototype reading on four routes. The
// rule must paint a non-empty box; we don't pin geometry beyond
// that so harmless tweaks (width, colour) don't fail the test.
test.describe('route-masthead eyebrow renders a hairline rule', () => {
  const ROUTES = [
    '/en/about/',
    '/en/notes/',
    '/en/works/',
    '/en/colophon/',
    '/es/sobre/',
    '/es/notas/',
    '/es/obras/',
    '/es/colofón/',
  ] as const;

  for (const path of ROUTES) {
    test(`${path} eyebrow ::before paints a non-empty box`, async ({ page }) => {
      await page.goto(path);
      const before = await page.evaluate(() => {
        const el = document.querySelector('.eyebrow--rule');
        if (!el) return null;
        const cs = window.getComputedStyle(el, '::before');
        return {
          content: cs.content,
          width: parseFloat(cs.width),
          height: parseFloat(cs.height),
        };
      });
      expect(before).not.toBeNull();
      expect(before!.content).not.toBe('none');
      expect(before!.width).toBeGreaterThan(0);
      expect(before!.height).toBeGreaterThan(0);
    });
  }
});
