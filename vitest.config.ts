import { readFileSync } from 'node:fs';
import type { Plugin } from 'vitest/config';
import { defineConfig } from 'vitest/config';

// Load `.txt` imports as their string content, mirroring the wrangler
// `Text` module rule that bundles them into the Worker in production.
// Without this, `src/worker.ts`'s `import … from '…/security.txt'` would
// resolve to an asset URL under vitest and `worker.test.ts` couldn't
// exercise the served content.
const rawText: Plugin = {
  name: 'raw-text',
  enforce: 'pre',
  load(id) {
    const path = id.split('?')[0];
    if (path?.endsWith('.txt')) {
      return `export default ${JSON.stringify(readFileSync(path, 'utf-8'))};`;
    }
    return null;
  },
};

export default defineConfig({
  plugins: [rawText],
  test: {
    include: ['tests/unit/**/*.test.ts'],
    environment: 'node',
    globals: false,
  },
  resolve: {
    alias: {
      '@lib': new URL('./src/lib', import.meta.url).pathname,
      '@layouts': new URL('./src/layouts', import.meta.url).pathname,
      '@styles': new URL('./src/styles', import.meta.url).pathname,
    },
  },
});
