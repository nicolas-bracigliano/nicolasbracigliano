// Diagram registry — keys and type guard live here (pure TS) so
// `tests/unit/diagram-registry.test.ts` can import them without needing
// an Astro vite plugin in the vitest config. The actual component
// resolution + rendering lives in `src/components/DiagramRail.astro`.
//
// Adding a new diagram:
//   1. Append the key to REGISTRY_KEYS below (TS literal type
//      narrowing keeps the registry honest).
//   2. Add the component import + case in DiagramRail.astro.
//   3. The forward-direction drift test confirms any piece's
//      `diagrams: [...]` value resolves; the reverse test (PR P3+)
//      confirms every key is referenced by some piece.

export const REGISTRY_KEYS = [
  'clean-arch-rings',
  'c4-wheel',
  'c4-context',
  'c4-containers',
  'c4-components',
  'c4-code',
  'cpr-framework',
  'agile-road-knot',
] as const;

export type DiagramKey = (typeof REGISTRY_KEYS)[number];

export function isDiagramKey(key: string): key is DiagramKey {
  return (REGISTRY_KEYS as readonly string[]).includes(key);
}
