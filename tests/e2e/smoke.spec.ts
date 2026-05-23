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
