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

  test('foot-rail active route has the accent tick', async ({ page }) => {
    await page.goto('/en/');
    const home = page.locator('.foot-rail a[aria-current="page"]');
    await expect(home).toHaveCount(1);
    await expect(home).toContainText('home');
  });
});
