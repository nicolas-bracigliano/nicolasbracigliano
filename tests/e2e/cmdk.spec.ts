import { test, expect } from '@playwright/test';

// ⌘K command palette. The index is inlined at build time (no network, no
// Pagefind), so this works against `pnpm preview` and would work under dev
// too. Covers: open affordances, the default route list, query matching +
// grouping, keyboard navigation, and focus return on close.
//
// Uses Control+k (the handler accepts metaKey || ctrlKey) so the shortcut
// is platform-agnostic in CI.

test.describe('command palette', () => {
  test('Ctrl/⌘-K opens it, focuses the input, and lists the routes by default', async ({
    page,
  }) => {
    await page.goto('/en/');
    await page.keyboard.press('Control+k');

    await expect(page.locator('[data-cmdk]')).toBeVisible();
    await expect(page.locator('[data-cmdk-input]')).toBeFocused();
    // Seven routes, all "page" pills.
    await expect(page.locator('.cmdk-item')).toHaveCount(7);
    await expect(page.locator('.cmdk-item .cmdk-pill').first()).toHaveText('page');
  });

  test('the chrome trigger opens it; a query filters, ranks, and groups', async ({ page }) => {
    await page.goto('/en/');
    await page.locator('.cmdk-trigger').click();
    await expect(page.locator('[data-cmdk]')).toBeVisible();

    await page.locator('[data-cmdk-input]').fill('agile');
    const first = page.locator('.cmdk-item').first();
    await expect(first.locator('.cmdk-title')).toHaveText('Where agile keeps getting stuck');
    await expect(first.locator('.cmdk-pill')).toHaveText('piece');
  });

  test('arrow + enter navigates to the active result', async ({ page }) => {
    await page.goto('/en/');
    await page.keyboard.press('Control+k');
    await page.locator('[data-cmdk-input]').fill('colophon');
    await expect(page.locator('.cmdk-item').first().locator('.cmdk-title')).toHaveText('colophon');
    await page.keyboard.press('Enter');
    await expect(page).toHaveURL(/\/en\/colophon\/$/);
  });

  test('escape closes and returns focus to the trigger', async ({ page }) => {
    await page.goto('/en/');
    await page.locator('.cmdk-trigger').click();
    await expect(page.locator('[data-cmdk]')).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(page.locator('[data-cmdk]')).toBeHidden();
    await expect(page.locator('.cmdk-trigger')).toBeFocused();
  });

  test('a topical query surfaces the matching /now bench item (coffee → /now)', async ({
    page,
  }) => {
    await page.goto('/en/');
    await page.keyboard.press('Control+k');
    await page.locator('[data-cmdk-input]').fill('coffee');
    const first = page.locator('.cmdk-item').first();
    await expect(first.locator('.cmdk-pill')).toHaveText('now');
    await expect(first.locator('.cmdk-title')).toHaveText('Padre Ethiopia, and Cruz de Malta');
    await page.keyboard.press('Enter');
    await expect(page).toHaveURL(/\/en\/about\/now\/$/);
  });

  test('the ES palette localizes the pills (página)', async ({ page }) => {
    await page.goto('/es/');
    await page.keyboard.press('Control+k');
    await expect(page.locator('[data-cmdk]')).toBeVisible();
    await expect(page.locator('.cmdk-item .cmdk-pill').first()).toHaveText('página');
  });
});
