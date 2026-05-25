// Diagram registry — keys and type guard live here (pure TS) so
// `tests/unit/diagram-registry.test.ts` can import them without needing
// an Astro vite plugin in the vitest config. The actual component
// resolution + rendering lives in `src/components/DiagramRail.astro`.
//
// EXECUTION MODEL — important: `DiagramRail.astro`'s frontmatter (and
// therefore the throw-on-unknown-key check that consumes this registry)
// runs at BUILD TIME during Astro's static-site generation. Errors
// surface in `pnpm build` output and CI, not in the browser console.
//
// ─── To add a new diagram, update three places ────────────────────
//   1. REGISTRY_KEYS below — add the new key string. The tuple type
//      narrows automatically and the rest of the system picks it up.
//   2. `src/components/diagrams/<NewDiagram>.astro` — the component
//      itself. Mirror an existing one (pure SVG, `currentColor`,
//      optional `caption` + `label` props, `<title>` when labelled).
//   3. `src/components/DiagramRail.astro` — import the component +
//      add a matching `if (key === '...') return <NewDiagram />`
//      case. The `satisfies never` line at the bottom of the switch
//      fails TS-check if you forget this step.
// ─── Optional ────────────────────────────────────────────────────
//   4. Per-kind tint in `src/styles/routes/pieces.css` if the default
//      `--ink-2` colour doesn't fit. Use `--ink-blue` / `--accent-aa`
//      / `--mate` for the existing palette vocabulary.
//
// ─── Placement modes (frontmatter) ───────────────────────────────
//   - `place: 'top'`    — between lede and prose (default).
//   - `place: 'bottom'` — between prose and foot.
//   - `after: '<slug>'` — inline, after the heading whose anchor
//     matches the slug. Reserved for the eventual rehype plugin
//     (not yet wired). An `after`-marked diagram falls back to the
//     top rail with a build-time warning until the plugin lands —
//     see `PieceEntry.astro` for the fallback path.

// `readonly [string, ...string[]]` constraint keeps TS aware that the
// tuple is non-empty — `REGISTRY_KEYS[0]` is `string`, not `string |
// undefined`. Catches an accidental empty-array edit at type-check
// time instead of leaving it for runtime.
export const REGISTRY_KEYS = [
  'clean-arch-rings',
  'c4-wheel',
  'c4-context',
  'c4-containers',
  'c4-components',
  'c4-code',
  'cpr-framework',
  'agile-road-knot',
] as const satisfies readonly [string, ...string[]];

export type DiagramKey = (typeof REGISTRY_KEYS)[number];

export function isDiagramKey(key: string): key is DiagramKey {
  return (REGISTRY_KEYS as readonly string[]).includes(key);
}
