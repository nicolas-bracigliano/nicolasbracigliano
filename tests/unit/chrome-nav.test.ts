import { describe, expect, it } from 'vitest';
import { getNavItems, type NavKey } from '../../src/lib/chrome-nav';
import { ROUTES } from '../../src/lib/routes';

// Until PR P1 (the /pieces rename + chrome integration), the desktop nav
// and the mobile foot-rail iterated a hardcoded array in BaseLayout.astro
// that no test exercised. Adding /pieces meant adding a 6th item across
// both surfaces and revealed how fragile the unmonitored coupling was.
//
// This test locks the invariants down:
//   1. Every nav key resolves to a real ROUTES key (TS guarantees it at
//      compile time via `NavKey = keyof typeof ROUTES`, but the runtime
//      assertion catches stale literals if the type ever widens).
//   2. EN and ES have the same set of keys, in the same order. The mobile
//      foot-rail iterates the same array, so order drift would mean the
//      two locales' foot-rails render items in different positions.
//   3. `pieces` is present in both locales — guards against an accidental
//      revert of the PR-P1 chrome integration.
//   4. `home` is the first item — the foot-rail keeps it as an explicit
//      tap target despite the mark being the home link, for SR parity.

describe('chrome navItems', () => {
  const en = getNavItems('en');
  const es = getNavItems('es');

  it('every nav key resolves to a ROUTES key', () => {
    for (const item of [...en, ...es]) {
      expect(item.key in ROUTES, `${item.key} is not in ROUTES`).toBe(true);
    }
  });

  it('EN and ES have the same key set in the same order', () => {
    expect(en.map((i) => i.key)).toEqual(es.map((i) => i.key));
  });

  it("includes 'pieces' (PR P1 / ADR 0010)", () => {
    const keys: NavKey[] = en.map((i) => i.key);
    expect(keys).toContain('pieces');
  });

  it("starts with 'home'", () => {
    expect(en[0]?.key).toBe('home');
    expect(es[0]?.key).toBe('home');
  });

  it('uses localized labels', () => {
    const enPieces = en.find((i) => i.key === 'pieces');
    const esPieces = es.find((i) => i.key === 'pieces');
    expect(enPieces?.label).toBe('pieces');
    expect(esPieces?.label).toBe('ensayos');
  });

  it('matches the current 6-item shape', () => {
    expect(en).toHaveLength(6);
    expect(es).toHaveLength(6);
  });

  it('every ROUTES key appears in navItems (or is in the hidden allowlist)', () => {
    // Forward-coverage: adding a new ROUTES key without also adding it to
    // navItems (or the hidden allowlist below) should fail this test.
    // Without this, a contributor adds a route, ships it, and finds it's
    // unreachable from the chrome.
    //
    // Hidden routes are reachable by direct link but absent from the nav
    // by design (design-system §5: "hidden routes make the nav shorter
    // and reward the curious"). `now` is the canonical example — it's a
    // child of /about and chrome navigation goes through /about.
    const HIDDEN: ReadonlySet<NavKey> = new Set(['now']);

    const navKeys = new Set(en.map((i) => i.key));
    for (const key of Object.keys(ROUTES) as NavKey[]) {
      if (HIDDEN.has(key)) continue;
      expect(navKeys.has(key), `${key} is in ROUTES but not in navItems`).toBe(true);
    }
  });
});
