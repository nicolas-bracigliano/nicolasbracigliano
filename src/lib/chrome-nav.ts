// Chrome navigation items per locale. Extracted from `BaseLayout.astro` so
// vitest can import it (Astro components aren't directly importable in unit
// tests). The desktop top-nav and the mobile foot-rail both iterate this
// same array — adding a new item shows up in both surfaces at once.
//
// Source-of-truth invariants enforced by `tests/unit/chrome-nav.test.ts`:
//   - Every nav key resolves to a real ROUTES key.
//   - EN and ES have the same set of keys (same length, same keys).
//   - `pieces` is present (post-PR-P1 / ADR 0010).
//   - `home` comes first (the mark is the home target on mobile, but the
//     foot-rail still keeps home as an explicit item for screen-reader
//     parity).
import { ROUTES, type Locale } from './routes';

export type NavKey = keyof typeof ROUTES;

export interface NavItem {
  key: NavKey;
  label: string;
}

const EN: ReadonlyArray<NavItem> = [
  { key: 'home', label: 'home' },
  { key: 'notes', label: 'notes' },
  { key: 'works', label: 'works' },
  { key: 'pieces', label: 'pieces' },
  { key: 'about', label: 'about' },
  { key: 'build', label: 'build' },
];

const ES: ReadonlyArray<NavItem> = [
  { key: 'home', label: 'inicio' },
  { key: 'notes', label: 'notas' },
  { key: 'works', label: 'obras' },
  { key: 'pieces', label: 'ensayos' },
  { key: 'about', label: 'sobre' },
  { key: 'build', label: 'sitio' },
];

export function getNavItems(locale: Locale): ReadonlyArray<NavItem> {
  return locale === 'en' ? EN : ES;
}
