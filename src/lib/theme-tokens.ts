// Theme identity + the browser-chrome tint for each theme.
//
// Lives in `src/lib/` (the framework-free inner layer) rather than in
// `src/scripts/theme.ts` because it has two consumers on opposite sides of
// the layer map: `BaseLayout.astro` renders the SSR `<meta name="theme-color">`
// at build time, and `src/scripts/chrome.ts` rewrites it at runtime. Per
// `docs/architecture.md`, layouts may import from `@lib/*` but `src/scripts/`
// is not an inner layer, so the constant has to sit here for both to reach it
// without an inward-pointing arrow.
//
// Values mirror `--bg` in `src/styles/tokens.css`, which stays the visual
// source of truth. `tests/unit/theme.test.ts` parses that file and fails if
// these drift from it — and also pins the one copy that genuinely cannot
// import anything: the ES5 literals in `public/theme-init.js`, which run in
// <head> before any bundled code exists.

export type Theme = 'dia' | 'noche';

export const THEME_COLOR: Readonly<Record<Theme, string>> = {
  dia: '#f6f4ef',
  noche: '#14130f',
};
