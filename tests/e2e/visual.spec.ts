import { test, expect } from '@playwright/test';

// Visual regression smoke. Snapshots the chrome surface at desktop and
// mobile viewports. Catches the kinds of pixel-level regressions that
// layout assertions in smoke.spec.ts / mobile.spec.ts miss (border
// colours, shadows, gradients, border-radius, etc.).
//
// Snapshot tolerance is `maxDiffPixelRatio: 0.02` (2 %) so minor font-
// rendering jitter across OS versions doesn't fail the test, but
// structural visual changes still trip it. Baselines are committed
// alongside this file under tests/e2e/visual.spec.ts-snapshots/.
//
// If a legitimate visual change lands, regenerate baselines via:
//   pnpm test:e2e -- --update-snapshots tests/e2e/visual.spec.ts
// and commit the updated PNGs.

const DESKTOP_VIEWPORT = { width: 1280, height: 720 } as const;
const MOBILE_VIEWPORT = { width: 375, height: 667 } as const;

// Playwright suffixes snapshot files by platform (`-darwin.png`,
// `-linux.png`), so the committed baselines work on the author's host
// but not on Linux CI without separately-generated Linux PNGs. Skipping
// on CI for now — enable once a containerised snapshot-generation flow
// exists (e.g. running this file inside the official Playwright Docker
// image as a pre-commit step, or as a separate CI job that uploads new
// baselines on demand).
test.skip(
  !!process.env.CI,
  'Visual snapshots are host-platform-suffixed; CI enablement is a follow-up.',
);

test.describe('chrome visual', () => {
  test('desktop chrome', async ({ page }) => {
    await page.setViewportSize(DESKTOP_VIEWPORT);
    await page.goto('/en/');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('.chrome')).toHaveScreenshot('chrome-desktop.png', {
      maxDiffPixelRatio: 0.02,
    });
  });

  test('mobile chrome (top)', async ({ page }) => {
    await page.setViewportSize(MOBILE_VIEWPORT);
    await page.goto('/en/');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('.chrome')).toHaveScreenshot('chrome-mobile-top.png', {
      maxDiffPixelRatio: 0.02,
    });
  });

  test('mobile foot-rail', async ({ page }) => {
    await page.setViewportSize(MOBILE_VIEWPORT);
    await page.goto('/en/');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('.foot-rail')).toHaveScreenshot('foot-rail-mobile.png', {
      maxDiffPixelRatio: 0.02,
    });
  });
});
