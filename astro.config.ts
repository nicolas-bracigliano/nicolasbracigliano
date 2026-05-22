import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

const SITE = 'https://nicolasbracigliano.com';

export default defineConfig({
  site: SITE,
  output: 'static',
  trailingSlash: 'always',
  compressHTML: true,
  prefetch: false,
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
  // Astro 6 ships built-in CSP under `security.csp`. It emits per-page
  // `<meta http-equiv="content-security-policy">` with sha256 hashes for
  // every bundled inline script/style. The strict directives in
  // `public/_headers` are still served by Cloudflare at the edge.
  security: {
    csp: {
      algorithm: 'SHA-256',
      directives: [
        "default-src 'self'",
        "img-src 'self' data:",
        "font-src 'self'",
        "connect-src 'self'",
        "base-uri 'self'",
        "form-action 'self'",
        // `frame-ancestors` is intentionally omitted here — browsers ignore
        // it when delivered via <meta>; the directive lives in public/_headers
        // and is enforced at the edge.
        'upgrade-insecure-requests',
      ],
      styleDirective: { resources: ["'self'"] },
      scriptDirective: { resources: ["'self'"], strictDynamic: false },
    },
  },
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
