import { test, expect } from '@playwright/test';

// Desktop chrome-nav behaviour. The mobile-viewport counterpart (foot-rail
// renders, 6-item count, /es localization, 360 px overflow) lives in
// `mobile.spec.ts` because it exercises the chrome's @media (max-width:
// 720px) behaviour. This file covers desktop-only assertions: top-nav
// item count, foot-rail-is-hidden, active-state highlighting for /pieces.
// Split out from `mobile.spec.ts` so the file name doesn't lie.

test.describe('desktop chrome nav', () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  test('top nav shows all 6 items on desktop (PR P1 / ADR 0010)', async ({ page }) => {
    await page.goto('/en/');
    const items = page.locator('.chrome .nav ul > li');
    await expect(items).toHaveCount(6);
    // `allInnerTexts()` includes the `::before { content: '/' }` decoration
    // as whitespace. Trim before comparing — the test is about the labels,
    // not the slash prefix (which has its own CSS rule + media-query test).
    const labels = (await items.allInnerTexts()).map((t) => t.trim());
    expect(labels).toEqual(['home', 'notes', 'works', 'pieces', 'about', 'build']);
  });

  test('foot-rail is hidden on desktop', async ({ page }) => {
    await page.goto('/en/');
    await expect(page.locator('.foot-rail')).toBeHidden();
  });

  test('visiting /en/pieces/ highlights pieces in the chrome', async ({ page }) => {
    await page.goto('/en/pieces/');
    const active = page.locator('.chrome .nav a[aria-current="page"]');
    await expect(active).toHaveCount(1);
    await expect(active).toContainText('pieces');
  });
});
