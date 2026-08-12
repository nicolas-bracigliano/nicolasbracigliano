import { test, expect } from '@playwright/test';

// Piece slug-page + index smoke tests. Updated for PR P5 / ADR 0012:
//   - Slug page is the editorial layout (single column, 760 px wrapper,
//     display H1, italic lede, drop cap, italic H2 with `§` marker,
//     inline pull quotes, dashed-border foot).
//   - Index is the row-list (`.piece-row` siblings, each a single link).
//
// The C4 piece is the heaviest in the collection — five diagrams, ~2300
// words of prose — so layout regressions show up there first. Mobile
// suite runs at the design system's narrow target (360 × 740).

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

  test('all 5 diagram SVGs are visible at narrow viewport', async ({ page }) => {
    await page.goto('/en/pieces/c4-four-times-in-a-row/');
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

test.describe('piece index — row-list click targets', () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  test('every row is a single link to the piece slug', async ({ page }) => {
    await page.goto('/en/pieces/');
    const rows = page.locator('.piece-row .piece-row-link');
    const count = await rows.count();
    expect(count, 'every piece on the index renders as a row').toBeGreaterThanOrEqual(4);
    for (let i = 0; i < count; i++) {
      const href = await rows.nth(i).getAttribute('href');
      expect(href, `row ${i}: href should point at the piece slug`).toMatch(/\/en\/pieces\/\S+/);
    }
  });

  test('the slug-page title is NOT a link to itself', async ({ page }) => {
    await page.goto('/en/pieces/rings-i-keep-redrawing/');
    // The slug-page title is plain text (PieceLayout renders the H1
    // directly via `set:html`); the index-row title still wraps the
    // whole row in a link, but that link is at the row level, not on
    // the title element itself.
    await expect(page.locator('.piece-title a')).toHaveCount(0);
    await expect(page.locator('h1.piece-title')).toHaveCount(1);
  });
});

test.describe('piece editorial layout — ADR 0012', () => {
  // Locks the structural contracts of the editorial layout. A future
  // refactor that accidentally reintroduces the marginalia rail, the
  // floated-right margin-note, or loses the `§` heading marker would
  // silently revert ADR 0012; these assertions catch each case.
  test.use({ viewport: { width: 1280, height: 800 } });

  test('no `.piece-left` rail exists on the slug page', async ({ page }) => {
    // The 3-column grid is gone per ADR 0012. The date + tags rail
    // moved to the meta line above the title (date) and the index
    // (tags). If this comes back, the layout has regressed.
    await page.goto('/en/pieces/rings-i-keep-redrawing/');
    await expect(page.locator('.piece-left')).toHaveCount(0);
  });

  test('pull quotes render as `<p class="pull">` inside the prose', async ({ page }) => {
    // Each P3 piece has 3 margin notes that the remark plugin injects
    // as pull quotes at end-of-section. The Rings piece exercises this
    // with 3 inserts; assert at least one renders on the slug page.
    await page.goto('/en/pieces/rings-i-keep-redrawing/');
    const pulls = page.locator('.piece-prose p.pull');
    await expect(pulls.first()).toBeVisible();
    expect(await pulls.count(), 'Rings has 3 margin notes -> 3 pull quotes').toBeGreaterThanOrEqual(
      1,
    );
  });

  test('piece H2 has a `§` marker via the `::before` pseudo-element', async ({ page }) => {
    await page.goto('/en/pieces/rings-i-keep-redrawing/');
    const markerContent = await page
      .locator('.piece-prose h2')
      .first()
      .evaluate((el) => {
        // `getComputedStyle(el, '::before').content` returns the quoted
        // string from the rule (e.g. `"§"`). Strip surrounding quotes
        // and assert the character.
        const raw = getComputedStyle(el, '::before').content;
        return raw.replace(/^["']|["']$/g, '');
      });
    expect(markerContent, 'piece H2 must carry a `§` accent marker').toBe('§');
  });

  test('the eyebrow back-link points at the pieces index (per locale)', async ({ page }) => {
    await page.goto('/en/pieces/rings-i-keep-redrawing/');
    const enBack = page.locator('.piece-eyebrow-back');
    await expect(enBack).toHaveAttribute('href', '/en/pieces/');

    await page.goto('/es/ensayos/anillos-que-sigo-redibujando/');
    const esBack = page.locator('.piece-eyebrow-back');
    await expect(esBack).toHaveAttribute('href', '/es/ensayos/');
  });

  test('the Spanish dependency label stays inside the rings diagram', async ({ page }) => {
    await page.goto('/es/ensayos/anillos-que-sigo-redibujando/');
    await page.evaluate(() => document.fonts.ready);

    const label = page.locator('.diagram--rings .d-arrow text');
    await expect(label.locator('tspan')).toHaveCount(2);
    await expect(label).toContainText('Dependencias del código fuente');

    const bounds = await label.evaluate((element) => {
      const labelBox = element.getBoundingClientRect();
      const svgBox = element.ownerSVGElement?.getBoundingClientRect();
      if (!svgBox) throw new Error('Dependency label must be inside an SVG');
      return {
        labelLeft: labelBox.left,
        labelRight: labelBox.right,
        svgLeft: svgBox.left,
        svgRight: svgBox.right,
      };
    });

    expect(bounds.labelLeft).toBeGreaterThanOrEqual(bounds.svgLeft);
    expect(bounds.labelRight).toBeLessThanOrEqual(bounds.svgRight);
  });

  test('the Spanish Level 2 labels stay inside their container boxes', async ({ page }) => {
    await page.goto('/es/ensayos/c4-cuatro-veces-seguidas/');
    await page.evaluate(() => document.fonts.ready);

    const diagram = page.locator('.diagram--c4-level-2');
    const labels = [
      { text: diagram.locator('.c4-label-web-app'), box: diagram.locator('.d-shape rect').nth(0) },
      { text: diagram.locator('.c4-label-database'), box: diagram.locator('.d-shape rect').nth(2) },
    ];

    for (const { text, box } of labels) {
      await expect(text.locator('tspan')).toHaveCount(2);
      const [textBounds, boxBounds] = await Promise.all([text.boundingBox(), box.boundingBox()]);
      expect(textBounds).not.toBeNull();
      expect(boxBounds).not.toBeNull();
      if (!textBounds || !boxBounds) throw new Error('C4 labels and boxes must be rendered');

      expect(textBounds.x).toBeGreaterThanOrEqual(boxBounds.x);
      expect(textBounds.x + textBounds.width).toBeLessThanOrEqual(boxBounds.x + boxBounds.width);
      expect(textBounds.y).toBeGreaterThanOrEqual(boxBounds.y);
      expect(textBounds.y + textBounds.height).toBeLessThanOrEqual(boxBounds.y + boxBounds.height);
    }
  });

  test('the lead paragraph carries `.lead-p` for the drop-cap rule', async ({ page }) => {
    // The remark plugin marks the first body paragraph with `class="lead-p"`
    // so `.piece-prose > .lead-p::first-letter` can target it. A future
    // plugin that sneaks a sibling ahead of the first `<p>` would
    // silently move the class; this test pins the contract.
    await page.goto('/en/pieces/rings-i-keep-redrawing/');
    await expect(page.locator('.piece-prose > p.lead-p')).toHaveCount(1);
  });
});

test.describe('piece typography — §9 two-face rule', () => {
  // Locks the design-system §9 commitment that piece body prose renders
  // in Newsreader (serif) while chrome stays in JetBrains Mono. A future
  // refactor that consolidates `.piece-prose p` and `.note-prose p` into
  // a shared `.prose p` would silently revert the rule without breaking
  // any other test; this assertion catches that.
  test('piece prose body renders in Newsreader (serif)', async ({ page }) => {
    await page.goto('/en/pieces/rings-i-keep-redrawing/');
    const family = await page
      .locator('.piece-prose p')
      .first()
      .evaluate((el) => getComputedStyle(el).fontFamily);
    expect(family, 'piece prose body must use --font-display (Newsreader)').toMatch(/Newsreader/);
  });

  test('piece chrome (eyebrow + meta) stays in JetBrains Mono', async ({ page }) => {
    await page.goto('/en/pieces/rings-i-keep-redrawing/');
    // The chrome surfaces (eyebrow, meta, foot signature meta) carry the
    // field-log voice. They stay mono regardless of route per §9.
    const eyebrowFamily = await page
      .locator('.piece-eyebrow')
      .first()
      .evaluate((el) => getComputedStyle(el).fontFamily);
    expect(eyebrowFamily, 'piece eyebrow must use --font-body (JetBrains Mono)').toMatch(
      /JetBrains Mono/,
    );
    const metaFamily = await page
      .locator('.piece-meta')
      .first()
      .evaluate((el) => getComputedStyle(el).fontFamily);
    expect(metaFamily, 'piece meta line must use --font-body (JetBrains Mono)').toMatch(
      /JetBrains Mono/,
    );
  });
});
