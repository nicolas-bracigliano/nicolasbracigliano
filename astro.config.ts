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
  // Disable Astro's dev toolbar globally. The toolbar's audits (perf,
  // a11y) duplicate what Lighthouse CI + `@axe-core/playwright` already
  // cover, and as of Astro 6.3 the toolbar's bootstrap script is
  // injected inline by `astro preview` too — which breaks the
  // CSP-contract e2e test (ADR 0008) by making the preview server
  // less production-faithful than the static dist it claims to serve.
  // Switching this off is the surgical fix.
  devToolbar: { enabled: false },
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
      // Force every hoisted `<script>` bundle to be emitted as an external
      // `/_astro/*.js` file. Default `4096` lets Astro's plugin-scripts
      // inline small chunks straight into the HTML; `public/_headers`
      // CSP `script-src 'self'` then blocks every inline module on the
      // deployed Worker. Dropping the threshold to 0 makes
      // `shouldInlineAsset` always return false so chunks emit as
      // same-origin files that `'self'` allows. Full rationale +
      // alternatives in `docs/decisions/0008-externalize-hoisted-scripts-for-csp.md`.
      assetsInlineLimit: 0,
    },
  },
});
