import { describe, expect, it } from 'vitest';
import { decideOnOsChange, parseStoredTheme, pickTheme, type Theme } from '../../src/scripts/theme';

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
