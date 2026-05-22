import { defineConfig, devices } from '@playwright/test';

const PORT = 4321;

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? 'github' : 'list',
  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: 'on-first-retry',
    /* Pin colour scheme so axe-core's contrast checker always evaluates
       the Día palette deterministically. Without this Playwright would
       inherit the host's `prefers-color-scheme`, and a CI runner that
       reports `dark` would have our `theme-init.js` apply Noche tokens
       before axe runs — different colours, possibly different results. */
    colorScheme: 'light',
  },
  webServer: {
    command: 'pnpm preview --port 4321',
    port: PORT,
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
