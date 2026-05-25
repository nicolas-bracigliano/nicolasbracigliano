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

test.describe('piece foot — visually-hidden title in permalinks', () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  test('index page permalinks include the title in their accessible name', async ({ page }) => {
    await page.goto('/en/pieces/');
    // Each `<a>` in `.piece-foot` has a visible "link" text + a
    // visually-hidden `<span>: title</span>`. The accessible name
    // computes from inner text including hidden spans, which is
    // what Lighthouse's `link-text` audit reads — and what we
    // need to keep stable as we touch the foot markup.
    const footLinks = page.locator('.piece-foot a');
    const count = await footLinks.count();
    expect(count).toBeGreaterThanOrEqual(4);
    for (let i = 0; i < count; i++) {
      const link = footLinks.nth(i);
      // `textContent` includes visually-hidden spans (innerText skips them
      // in some engines because clip-path counts as "not rendered"). The
      // visually-hidden span is part of the link's accessible name, which
      // is what Lighthouse's link-text audit reads. The accessible name is
      // computed from the DOM text content, not the rendered text.
      const accessibleText = (await link.textContent())?.trim() ?? '';
      expect(
        accessibleText,
        `piece-foot link ${i} should include a title beyond the generic "link"`,
      ).toMatch(/link\s*:\s*\S+/);
    }
  });
});
