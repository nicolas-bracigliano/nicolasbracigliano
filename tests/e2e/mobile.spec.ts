import { test, expect } from '@playwright/test';

// Mobile-viewport smoke. Playwright defaults to a desktop viewport, so
// none of the @media (max-width: 720px) chrome work is exercised by
// smoke.spec.ts. Three bugs in PR #4 (foot-rail at top of page,
// trapped by backdrop-filter, chrome-end in middle column) would have
// been caught by these assertions; pinning them here so future
// changes can't regress silently.

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

    // Bottom edge of the rail should be within 1 px of the viewport
    // bottom (rounding/sub-pixel). If the chrome's backdrop-filter
    // ever traps the rail again the box.bottom will land somewhere
    // near 50 px and this fails immediately.
    const bottom = box.y + box.height;
    expect(bottom).toBeGreaterThanOrEqual(MOBILE_VIEWPORT.height - 1);
  });

  test('top chrome nav is hidden on mobile', async ({ page }) => {
    await page.goto('/en/');
    // The top .chrome .nav is `display: none` under 720 px; the
    // foot-rail nav takes over below.
    await expect(page.locator('.chrome .nav')).toBeHidden();
    await expect(page.locator('.foot-rail')).toBeVisible();
  });

  test('chrome wordmark + lang + theme stay visible on mobile', async ({ page }) => {
    await page.goto('/en/');
    // Top chrome on mobile is wordmark + lang + theme; spec'd
    // explicitly so a future "hide everything on mobile" refactor
    // doesn't quietly drop the wordmark or lang switcher.
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
    // Home is current; the ::before tick on the active link should be
    // visible. We can't query ::before directly, but we can check that
    // `aria-current="page"` is set on the right link and that the link
    // is in the rail.
    const home = page.locator('.foot-rail a[aria-current="page"]');
    await expect(home).toHaveCount(1);
    await expect(home).toContainText('home');
  });
});
