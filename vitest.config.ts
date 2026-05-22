import { defineConfig } from 'vitest/config';

export default defineConfig({
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
