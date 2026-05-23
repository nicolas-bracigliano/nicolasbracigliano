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
  { path: '/en/colophon/', lang: 'en' },
  { path: '/es/colofón/', lang: 'es' },
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
    const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze();
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

test('note entries render an auto-computed read-time in the footer', async ({ page }) => {
  await page.goto('/en/notes/hello/');
  await expect(page.locator('.note-foot')).toContainText(/read time · \d+ min/);
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
  // At least two notes need asides for this to mean anything; the seed
  // content guarantees three (hello, text-wrap-pretty, right-hand).
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
  // The seed content covers code + guitar; garden + coffee remain
  // covered by the schema and the NoteGlyph component but aren't
  // exercised by demo notes today.
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
  // Known low-likelihood flake: if the test runs exactly at the
  // Australia/Melbourne month boundary, the page may have been
  // rendered under one month and this assertion computed under the
  // next. Re-run; the window is < 1 s of wall-clock per month.
  const currentMonth = new Intl.DateTimeFormat('en-AU', { month: 'long' })
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
  // Past the inner hola-in but before overlay-out: the overlay must
  // still be attached. Catches the original bug where a
  // `{ once: true }` animationend listener picked up the bubbled
  // child animation here and tore the intro down too early.
  await page.waitForTimeout(INTRO_INNER_FADE_END_MS + INTRO_WAIT_BUFFER_MS);
  await expect(page.locator('[data-about-intro]')).toBeAttached();
  // After overlay-out completes + buffer for animationend + DOM
  // removal, the overlay must be gone.
  await page.waitForTimeout(INTRO_TOTAL_MS - INTRO_INNER_FADE_END_MS + INTRO_WAIT_BUFFER_MS);
  await expect(page.locator('[data-about-intro]')).toHaveCount(0);
});

test('works filter toggles cards via data-kind matching', async ({ page }) => {
  await page.goto('/en/works/');
  // Wait for the inline script to have wired the toolbar — without this,
  // a fast `goto`/`click` can race the `astro:page-load` listener that
  // attaches the click handler, and the click silently no-ops.
  await page.locator('.works-filters[data-wired="true"]').waitFor();
  // Initial state: all cards visible.
  const all = page.locator('.work-card');
  await expect(all).toHaveCount(4);
  for (let i = 0; i < 4; i++) {
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
  await expect(page.locator('.work-card:not([hidden])')).toHaveCount(4);
});
