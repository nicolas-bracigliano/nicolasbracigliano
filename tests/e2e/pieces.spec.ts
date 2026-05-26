import { test, expect } from '@playwright/test';

// Piece slug-page smoke tests. The C4 piece is the heaviest in the
// collection — five diagrams (one top, four bottom) plus ~2300 words
// of prose — so any layout regression in the diagram rail or the
// long-form prose first shows up there. These tests run at the
// design system's narrow mobile target (360 × 740) so the
// foot-stack mobile fallback for the right rail is also exercised.

test.describe('C4 piece — mobile layout', () => {
  test.use({ viewport: { width: 360, height: 740 } });

  test('renders both diagram rails (5 diagrams total)', async ({ page }) => {
    await page.goto('/en/pieces/c4-four-times-in-a-row/');
    // Two `<DiagramRail>` instances: one between lede and prose
    // (the C4 wheel), one between prose and foot (four C4 levels).
    const rails = page.locator('.diagram-rail');
    await expect(rails).toHaveCount(2);
    const diagrams = page.locator('.diagram-rail .diagram');
    await expect(diagrams).toHaveCount(5);
  });

  test('all 5 diagram SVGs are visible (none collapsed by the mobile rail rule)', async ({
    page,
  }) => {
    await page.goto('/en/pieces/c4-four-times-in-a-row/');
    // `.piece-right` is the margin-note rail; it moves below the prose
    // at ≤880 px but the `.diagram-rail` (the diagram container) is
    // independent and must stay visible at every breakpoint. Catches
    // an accidental `.diagram-rail { display: none }` under a media
    // query — the kind of regression a future CSS sweep could ship.
    const svgs = page.locator('.diagram-rail svg');
    await expect(svgs).toHaveCount(5);
    for (let i = 0; i < 5; i++) {
      await expect(svgs.nth(i)).toBeVisible();
    }
  });

  test('the piece title is an H1 on the slug page (heading hierarchy)', async ({ page }) => {
    await page.goto('/en/pieces/c4-four-times-in-a-row/');
    const h1 = page.locator('h1.piece-title');
    await expect(h1).toHaveCount(1);
    await expect(h1).toContainText('C4');
  });

  test('Spanish sibling renders too', async ({ page }) => {
    await page.goto('/es/ensayos/c4-cuatro-veces-seguidas/');
    const diagrams = page.locator('.diagram-rail .diagram');
    await expect(diagrams).toHaveCount(5);
    const h1 = page.locator('h1.piece-title');
    await expect(h1).toContainText('C4');
  });
});

test.describe('piece entry — index click targets', () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  test('the title is a link on the index (navigates to the slug)', async ({ page }) => {
    await page.goto('/en/pieces/');
    const titleLinks = page.locator('.piece-title a');
    const count = await titleLinks.count();
    expect(count, 'every piece title on the index has a link').toBeGreaterThanOrEqual(4);
    for (let i = 0; i < count; i++) {
      const href = await titleLinks.nth(i).getAttribute('href');
      expect(href, `title ${i}: href should point at the piece slug`).toMatch(/\/en\/pieces\/\S+/);
    }
  });

  test('the foot has a continue-reading link with the title in its accessible name', async ({
    page,
  }) => {
    await page.goto('/en/pieces/');
    // Each `.piece-continue` is a foot link; its accessible name combines
    // "continue reading →" with a visually-hidden `: <title>` span so
    // Lighthouse's link-text audit sees descriptive text, not the same
    // generic string on every entry.
    const continueLinks = page.locator('.piece-foot .piece-continue');
    const count = await continueLinks.count();
    expect(count, 'every piece on the index has a foot link').toBeGreaterThanOrEqual(4);
    for (let i = 0; i < count; i++) {
      const link = continueLinks.nth(i);
      const accessibleText = (await link.textContent())?.trim() ?? '';
      expect(
        accessibleText,
        `foot link ${i} should include a title beyond the generic continue-reading text`,
      ).toMatch(/(continue reading|seguir leyendo)\s*→?\s*:\s*\S+/i);
    }
  });

  test('the slug-page title is NOT a link to itself', async ({ page }) => {
    await page.goto('/en/pieces/rings-i-keep-redrawing/');
    // On the slug page the title is the page's <h1>; making it link to
    // itself would be a self-referential noop. Plain text only.
    await expect(page.locator('.piece-title a')).toHaveCount(0);
    await expect(page.locator('h1.piece-title')).toHaveCount(1);
  });
});
