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

test.describe('piece-card link — every index card is a navigable target', () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  test('every piece card has an `<a>` with the title as its accessible name', async ({ page }) => {
    await page.goto('/en/pieces/');
    // The whole piece body is wrapped in `<a class="piece-card piece-card--link">`
    // — the click target on the index. The title text inside is plain,
    // NOT its own link (item 6 of the post-marginalia review). The
    // wrapper carries `aria-label="<title>"` so screen readers announce
    // a meaningful name without reading the full card content.
    const cardLinks = page.locator('.piece-card--link');
    const count = await cardLinks.count();
    expect(count, 'index should render at least 4 piece cards').toBeGreaterThanOrEqual(4);
    for (let i = 0; i < count; i++) {
      const link = cardLinks.nth(i);
      const ariaLabel = await link.getAttribute('aria-label');
      const href = await link.getAttribute('href');
      expect(
        ariaLabel,
        `card ${i}: aria-label should be the piece title (non-empty, non-generic)`,
      ).toBeTruthy();
      expect(ariaLabel?.length ?? 0).toBeGreaterThan(3);
      expect(href, `card ${i}: href should point at the piece slug`).toMatch(/\/en\/pieces\/\S+/);
    }
  });

  test('the title inside the card is NOT its own link', async ({ page }) => {
    await page.goto('/en/pieces/');
    // Item 6 of the review: title text shouldn't be a separate <a>.
    // `.piece-title a` would be a nested link inside the card wrapper —
    // invalid HTML and the wrong UX.
    await expect(page.locator('.piece-title a')).toHaveCount(0);
  });
});
