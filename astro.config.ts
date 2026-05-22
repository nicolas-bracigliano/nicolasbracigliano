import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

const SITE = 'https://nicolasbracigliano.com';

export default defineConfig({
  site: SITE,
  output: 'static',
  trailingSlash: 'always',
  compressHTML: true,
  // Opt-in prefetching: only the links explicitly marked with
  // `data-astro-prefetch` (nav, entry-list, cards) prefetch on hover.
  // Cheap perceived-speed win once `<ClientRouter />` is already on the page.
  prefetch: {
    prefetchAll: false,
    defaultStrategy: 'hover',
  },
  build: {
    inlineStylesheets: 'auto',
    format: 'directory',
  },
  i18n: {
    defaultLocale: 'en',
    locales: ['en', 'es'],
    routing: {
      prefixDefaultLocale: true,
      redirectToDefaultLocale: false,
    },
  },
  // CSP is delivered exclusively via `public/_headers` (Cloudflare serves
  // it at the edge). We do not emit `<meta http-equiv>` CSP because:
  //
  //   1. `<ClientRouter />` injects per-build view-transition styles at
  //      runtime — Astro's `security.csp` cannot hash them, documented in
  //      Astro's CSP docs as an incompatibility.
  //   2. CSP spec rule: when hashes are present in `style-src`,
  //      `'unsafe-inline'` is ignored. So mixing them (the only fallback
  //      for runtime styles) doesn't actually permit the runtime styles.
  //
  // `_headers` is the single source of truth; the directive table in
  // `docs/security.md` documents every header so future-you can translate
  // to another host's syntax if needed.
  integrations: [
    sitemap({
      i18n: {
        defaultLocale: 'en',
        locales: { en: 'en', es: 'es' },
      },
      filter: (page) =>
        !page.includes('/about/now') && !page.includes('/sobre/ahora') && !page.endsWith('/404'),
    }),
  ],
  vite: {
    css: {
      transformer: 'lightningcss',
    },
    build: {
      cssMinify: 'lightningcss',
    },
  },
});
