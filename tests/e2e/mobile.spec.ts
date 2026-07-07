import { test, expect } from '@playwright/test';

// Mobile-viewport smoke — smoke.spec.ts runs at desktop and doesn't
// exercise the chrome's @media (max-width: 720px) behaviour.

const MOBILE_VIEWPORT = { width: 375, height: 667 } as const;

test.use({ viewport: MOBILE_VIEWPORT });

test.describe('mobile foot-rail', () => {
  test('renders at the viewport bottom', async ({ page }) => {
    await page.goto('/en/');
    const rail = page.locator('.foot-rail');
    await expect(rail).toBeVisible();

    const box = await rail.boundingBox();
    expect(box, 'foot-rail must have a bounding box').not.toBeNull();
    if (!box) return;

    const bottom = box.y + box.height;
    expect(bottom).toBeGreaterThanOrEqual(MOBILE_VIEWPORT.height - 1);
  });

  test('top chrome nav is hidden on mobile', async ({ page }) => {
    await page.goto('/en/');
    await expect(page.locator('.chrome .nav')).toBeHidden();
    await expect(page.locator('.foot-rail')).toBeVisible();
  });

  test('chrome wordmark + lang + theme stay visible on mobile', async ({ page }) => {
    await page.goto('/en/');
    await expect(page.locator('.mark-cube')).toBeVisible();
    await expect(page.locator('.mark-word')).toBeVisible();
    await expect(page.locator('.lang-toggle')).toBeVisible();
    await expect(page.locator('#theme-toggle')).toBeVisible();
  });

  test('lang chips meet 44 px tap-target floor', async ({ page }) => {
    await page.goto('/en/');
    const enChip = page.locator('.lang-toggle a[data-lang="en"]');
    const box = await enChip.boundingBox();
    expect(box, 'lang chip must have a bounding box').not.toBeNull();
    if (!box) return;
    expect(box.height).toBeGreaterThanOrEqual(44);
  });

  test('foot-rail links stay comfortably above the 44 px floor', async ({ page }) => {
    await page.goto('/en/');
    const links = page.locator('.foot-rail a');
    const count = await links.count();
    expect(count).toBe(6);
    for (let i = 0; i < count; i++) {
      const box = await links.nth(i).boundingBox();
      expect(box, `foot-rail link ${i} must have a bounding box`).not.toBeNull();
      if (!box) continue;
      expect(box.height).toBeGreaterThanOrEqual(48);
    }
  });

  test('foot-rail active route is still marked semantically', async ({ page }) => {
    await page.goto('/en/');
    const home = page.locator('.foot-rail a[aria-current="page"]');
    await expect(home).toHaveCount(1);
    await expect(home).toContainText('home');
  });

  test('foot-rail shows all 6 nav items (PR P1 / ADR 0010)', async ({ page }) => {
    await page.goto('/en/');
    const items = page.locator('.foot-rail li');
    await expect(items).toHaveCount(6);
    const labels = await items.allInnerTexts();
    expect(labels).toEqual(['home', 'notes', 'works', 'pieces', 'about', 'colophon']);
  });

  test('foot-rail labels localize on /es', async ({ page }) => {
    await page.goto('/es/');
    const items = page.locator('.foot-rail li');
    await expect(items).toHaveCount(6);
    const labels = await items.allInnerTexts();
    expect(labels).toEqual(['inicio', 'notas', 'obras', 'ensayos', 'sobre', 'colofón']);
  });

  test('foot-rail labels fit without truncation on a 360 px viewport', async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 740 });
    await page.goto('/es/');
    // The longest ES label is "colofón" (7 chars + diacritic). At 360 px
    // with 6 items, each gets ~60 px. The 380 px-and-below media query
    // shrinks the font and tightens padding so labels still fit. Verify
    // none of the anchor boxes are wider than its <li> parent (i.e. no
    // overflow forcing horizontal scroll).
    const items = page.locator('.foot-rail li');
    const count = await items.count();
    expect(count).toBe(6);
    for (let i = 0; i < count; i++) {
      const li = items.nth(i);
      const liBox = await li.boundingBox();
      const a = li.locator('a');
      const aBox = await a.boundingBox();
      expect(liBox, 'li box').not.toBeNull();
      expect(aBox, 'a box').not.toBeNull();
      if (!liBox || !aBox) continue;
      expect(aBox.height, `label ${i} should keep the taller tap target`).toBeGreaterThanOrEqual(
        48,
      );
      expect(aBox.width, `label ${i} should fit in its <li>`).toBeLessThanOrEqual(
        liBox.width + 0.5,
      );
    }
  });
});
