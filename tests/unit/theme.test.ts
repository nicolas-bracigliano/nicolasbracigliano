import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import {
  decideOnOsChange,
  parseStoredTheme,
  pickTheme,
  THEME_COLOR,
  type Theme,
} from '../../src/scripts/theme';

describe('parseStoredTheme', () => {
  it('accepts the two valid theme keys', () => {
    expect(parseStoredTheme('dia')).toBe('dia');
    expect(parseStoredTheme('noche')).toBe('noche');
  });

  it('rejects null, empty string, and unknown values', () => {
    expect(parseStoredTheme(null)).toBeNull();
    expect(parseStoredTheme('')).toBeNull();
    expect(parseStoredTheme('light')).toBeNull();
    expect(parseStoredTheme('NOCHE')).toBeNull(); // case-sensitive
    expect(parseStoredTheme('dia ')).toBeNull(); // whitespace-sensitive
  });
});

describe('pickTheme', () => {
  it('returns the stored override when present, regardless of OS', () => {
    expect(pickTheme('dia', false)).toBe('dia');
    expect(pickTheme('dia', true)).toBe('dia');
    expect(pickTheme('noche', false)).toBe('noche');
    expect(pickTheme('noche', true)).toBe('noche');
  });

  it('falls back to the OS preference when no override', () => {
    expect(pickTheme(null, false)).toBe('dia');
    expect(pickTheme(null, true)).toBe('noche');
  });
});

describe('decideOnOsChange', () => {
  // Auto mode: no override, just follow the OS.
  it('applies the new OS theme with no retire when no override is set', () => {
    expect(decideOnOsChange(null, 'dia')).toEqual({ apply: 'dia', retire: false });
    expect(decideOnOsChange(null, 'noche')).toEqual({ apply: 'noche', retire: false });
  });

  // Retire-on-match: the user overrode to X while the OS was on Y; now
  // the OS catches up to X — drop the override so future OS toggles
  // are followed automatically.
  it('applies + retires when the OS catches up to the stored override', () => {
    expect(decideOnOsChange('dia', 'dia')).toEqual({ apply: 'dia', retire: true });
    expect(decideOnOsChange('noche', 'noche')).toEqual({ apply: 'noche', retire: true });
  });

  // The user has been explicit; keep the override until they retire it themselves.
  it('keeps the override (no apply, no retire) when it disagrees with the OS', () => {
    expect(decideOnOsChange('dia', 'noche')).toEqual({ apply: null, retire: false });
    expect(decideOnOsChange('noche', 'dia')).toEqual({ apply: null, retire: false });
  });

  // Concrete end-to-end scenario from the design system comment:
  // override "noche" while OS is "dia" → OS toggles to "noche" → retire →
  // OS toggles back to "dia" → follow.
  it('integrates the retire flow over a sequence of OS toggles', () => {
    let stored: Theme | null = 'noche';

    // OS changes to noche: should retire because stored matches OS.
    const first = decideOnOsChange(stored, 'noche');
    expect(first).toEqual({ apply: 'noche', retire: true });
    if (first.retire) stored = null; // simulate localStorage.removeItem

    // OS changes back to dia: now in auto mode, just follow.
    const second = decideOnOsChange(stored, 'dia');
    expect(second).toEqual({ apply: 'dia', retire: false });
    expect(stored).toBeNull();
  });
});

// The theme-color hexes exist in three places that cannot import each
// other: `tokens.css` (the visual source of truth, consumed as CSS),
// `THEME_COLOR` in `theme.ts` (used by the bundled `chrome.ts`), and
// `public/theme-init.js` (plain ES5, runs in <head> before any bundled
// code, so it must inline its own literals). A mismatch is invisible —
// the page renders correctly while the mobile URL bar is tinted wrong.
// These tests make the CSS the authority and fail the other two against it.
describe('THEME_COLOR stays in sync with tokens.css and theme-init.js', () => {
  const read = (rel: string) => readFileSync(new URL(rel, import.meta.url), 'utf-8');
  const tokens = read('../../src/styles/tokens.css');
  const themeInit = read('../../public/theme-init.js');

  /** First `--bg: <hex>;` inside the block opened by `opener`.
   *
   *  `opener` must match the selector *and its opening brace* — matching the
   *  bare selector text is not enough, because `:root`'s comment header
   *  mentions "[data-theme='noche']" in prose, and an `indexOf` on that
   *  string lands inside the Día block and happily returns Día's `--bg`.
   *  (That is not hypothetical: it is what the first draft of this test
   *  did, and it passed for Día while silently comparing Noche to the
   *  wrong value.) The `@media print` override at the end of the file
   *  writes `:root,` with a comma, so it can't match `/:root\s*\{/`, and
   *  its `[data-theme='noche']` appears after the real block, so
   *  first-match ordering keeps us on the right one. */
  function bgFor(opener: RegExp): string {
    const at = opener.exec(tokens);
    expect(at, `${opener} not found in tokens.css`).not.toBeNull();
    const start = at!.index;
    const block = tokens.slice(start, tokens.indexOf('}', start));
    const match = /--bg:\s*(#[0-9a-f]{3,8})\s*;/i.exec(block);
    expect(match, `no --bg declaration in the ${opener} block`).not.toBeNull();
    return match![1]!.toLowerCase();
  }

  it('matches the --bg value of each theme in tokens.css', () => {
    expect(THEME_COLOR.dia).toBe(bgFor(/:root\s*\{/));
    expect(THEME_COLOR.noche).toBe(bgFor(/\[data-theme='noche'\]\s*\{/));
  });

  it('matches the literals inlined in public/theme-init.js, per branch', () => {
    // theme-init.js can't import THEME_COLOR, so assert its copies directly.
    //
    // Deliberately NOT two `toContain` calls: the file contains both hexes
    // whichever way round the ternary is written, so a presence check passes
    // on `theme === 'noche' ? <dia> : <noche>` — a one-token slip that
    // inverts the URL-bar tint on every load. Tie each hex to its branch.
    const ternary = /theme === 'noche'\s*\?\s*'(#[0-9a-f]{3,8})'\s*:\s*'(#[0-9a-f]{3,8})'/i.exec(
      themeInit,
    );
    expect(ternary, 'no theme-color ternary found in public/theme-init.js').not.toBeNull();
    expect(ternary![1]!.toLowerCase()).toBe(THEME_COLOR.noche);
    expect(ternary![2]!.toLowerCase()).toBe(THEME_COLOR.dia);
  });

  it('uses distinct colours per theme', () => {
    // Guards the copy-paste failure where both branches get the same hex.
    expect(THEME_COLOR.dia).not.toBe(THEME_COLOR.noche);
  });
});
