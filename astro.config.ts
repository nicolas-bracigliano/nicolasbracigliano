import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import { shield } from '@kindspells/astro-shield';

const SITE = 'https://nicolasbracigliano.com';

export default defineConfig({
  site: SITE,
  output: 'static',
  trailingSlash: 'never',
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
  integrations: [
    sitemap({
      i18n: {
        defaultLocale: 'en',
        locales: { en: 'en', es: 'es' },
      },
      filter: (page) =>
        !page.includes('/about/now') && !page.includes('/sobre/ahora') && !page.endsWith('/404'),
    }),
    // astro-shield computes SRI hashes for inline scripts/styles. Header
    // injection is intentionally NOT enabled here — we maintain public/_headers
    // ourselves (Cloudflare provider support varies across versions).
    shield({
      sri: {
        enableStatic: true,
      },
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
