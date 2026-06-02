// Unit coverage for the per-kind vignette art (ADR 0013 + its 2026-06
// amendment). Two things worth guarding without a full render:
//
//   1. The shared Gridfinity geometry is well-formed and deterministic —
//      it's hand-tuned coordinate math consumed by the print vignette.
//   2. The bench and the works registry render the SAME per-kind component
//      (the amendment's "can't drift" guarantee). If someone re-inlines a
//      vignette into BenchCard, this trips.
//
// Visual correctness is out of scope here (vignettes are aria-hidden
// decoration; the e2e visual suite is host-suffixed and skipped on CI).

import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { bins, plane, gridLines, plateRight, plateLeft } from '../../src/lib/gridfinity-vignette';

const read = (p: string) => readFileSync(new URL(`../../${p}`, import.meta.url), 'utf8');

// Every number in an SVG `points` / path `d` string must be finite —
// guards against an `undefined`/NaN leaking from the projection helpers.
const coords = (s: string) => s.match(/-?\d+(?:\.\d+)?/g) ?? [];
const allFinite = (s: string) => coords(s).every((n) => Number.isFinite(Number(n)));

describe('gridfinity vignette geometry', () => {
  it('exposes four bins, each with four drawable faces', () => {
    expect(bins).toHaveLength(4);
    for (const b of bins) {
      for (const face of [b.top, b.right, b.left, b.lip]) {
        expect(face.length).toBeGreaterThan(0);
        expect(allFinite(face)).toBe(true);
        // a quad — four "x,y" pairs
        expect(face.trim().split(/\s+/)).toHaveLength(4);
      }
    }
  });

  it('exposes a baseplate plane, grid lines and two side faces', () => {
    expect(plane.trim().split(/\s+/)).toHaveLength(4);
    expect(gridLines.length).toBe(6); // (N-1) interior lines × 2 axes, N=4
    for (const s of [plane, plateRight, plateLeft, ...gridLines]) {
      expect(allFinite(s)).toBe(true);
    }
  });

  it('is deterministic (no Math.random in the seed)', () => {
    const src = read('src/lib/gridfinity-vignette.ts');
    // Call forms, not prose — the file's own comment mentions `Math.random`.
    expect(src).not.toMatch(/Math\.random\(|Date\.now\(|new Date\(/);
  });
});

describe('bench + works share one vignette component per kind (no drift)', () => {
  const bench = read('src/components/BenchCard.astro');
  const contentArt = read('src/components/ContentArt.astro');

  // `garden` is the documented exception (plot for works, inline seedling
  // for the bench); everything else is shared.
  const shared = ['Code', 'Guitar', 'Print', 'Home'] as const;

  for (const kind of shared) {
    it(`${kind}: bench imports and renders the shared vignette, registry uses the same file`, () => {
      expect(bench).toContain(`./art/vignettes/${kind}.astro`);
      expect(bench).toMatch(new RegExp(`<${kind}Vignette[\\s/>]`));
      expect(contentArt).toContain(`./art/vignettes/${kind}.astro`);
    });
  }

  it('does not reinline the media wall or code editor in BenchCard', () => {
    // Markers that only exist in the shared figures — their presence in
    // BenchCard would mean a copy crept back in.
    expect(bench).not.toContain('linearGradient');
    expect(bench).not.toContain('class="caret"');
  });
});
