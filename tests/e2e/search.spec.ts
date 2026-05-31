import { test, expect } from '@playwright/test';

// Pagefind site search (Search.astro on the notes index). Needs the built
// index under /_pagefind/, which the `postbuild` step emits — so this runs
// against `pnpm preview` (the suite's webServer), never `astro dev`.
//
// The CSP "zero inline scripts" contract is covered site-wide in
// smoke.spec.ts; the search module is a hoisted (external) bundle, so it's
// already exercised there. These tests cover the functional contract: a
// known term returns results, scoped to the page's language via the
// Pagefind `lang` filter set on <main> in BaseLayout.
const CASES = [
  { notes: '/en/notes/', prefix: '/en/' },
  { notes: '/es/notas/', prefix: '/es/' },
] as const;

for (const { notes, prefix } of CASES) {
  test(`${notes} — search returns results scoped to the page language`, async ({ page }) => {
    await page.goto(notes);

    // "Astro" appears across several pages in both locales (the rewrite
    // note/work, the colophon, the now tour).
    await page.locator('[data-search-input]').fill('Astro');

    const links = page.locator('.search-result-link');
    // Allow for the lazy index fetch on first interaction.
    await expect(links.first()).toBeVisible({ timeout: 10_000 });

    const hrefs = await links.evaluateAll((els) => els.map((el) => el.getAttribute('href') ?? ''));
    expect(hrefs.length).toBeGreaterThan(0);
    // Every result is in the current locale — the lang facet holds.
    for (const href of hrefs) {
      expect(href.startsWith(prefix)).toBe(true);
    }
  });
}

test('/en/notes/ — a no-match query reports the empty state', async ({ page }) => {
  await page.goto('/en/notes/');
  await page.locator('[data-search-input]').fill('zxqwvkjqx');
  await expect(page.locator('[data-search-status]')).toHaveText('No matches.', {
    timeout: 10_000,
  });
  await expect(page.locator('.search-result-link')).toHaveCount(0);
});
