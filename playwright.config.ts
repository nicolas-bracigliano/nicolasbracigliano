import { defineConfig, devices } from '@playwright/test';

/* Deliberately not Astro's default 4321. `reuseExistingServer` below
   attaches to whatever already listens on this port, so a dev server
   from any other Astro project on the machine silently became the
   target of the whole suite (145 of 162 failed against the wrong app). */
const PORT = 4817;

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
    /* Runs `astro preview` directly, not through `pnpm preview`. Playwright
       stops the webServer by SIGKILLing its process group. From pnpm 11.27
       the script's child runs in a group of its own, so that signal took
       pnpm down and left `astro preview` orphaned and holding the port, and
       the run never finished (#258). With no wrapper there's no second
       group. The explicit path works however Playwright is launched,
       including editor integrations that don't put `.bin` on PATH. */
    command: `node_modules/.bin/astro preview --port ${PORT}`,
    // Astro 7.2 backgrounds preview automatically when it detects an AI agent.
    // Playwright must own the foreground process so readiness and teardown work.
    env: { ASTRO_PREVIEW_BACKGROUND: '0' },
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
