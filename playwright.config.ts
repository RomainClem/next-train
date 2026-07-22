import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright E2E config for the Expo **web** build.
 *
 * The suite builds a static web export (`expo export -p web`) and serves it
 * with a tiny static server (`e2e/serve-web.mjs`), then drives it in a real
 * browser. This is used instead of the Metro dev server because the dev server
 * re-bundles on every navigation and stays silent for a long time on cold
 * start — which looks like the run has hung.
 *
 * Every Rejseplanen API call is mocked at the network layer (see
 * `e2e/helpers.ts`), so the tests are deterministic and need no live key — we
 * still inject a dummy `REJSEPLANEN_ACCESS_ID` because the client throws before
 * fetching when the key is empty (it's baked into the export).
 */

const PORT = Number(process.env.E2E_PORT ?? 8099);
const HOST = `http://localhost:${PORT}`;

export default defineConfig({
  testDir: './e2e',
  // One shared dev server → keep the run serial to avoid Metro contention.
  fullyParallel: false,
  workers: 1,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  timeout: 60_000,
  expect: { timeout: 15_000 },
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: HOST,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    // Rebuild the static export every run so tests never hit a stale bundle,
    // then serve it. The export reuses Metro's cache, so repeat runs are quick.
    command: `npx expo export -p web --output-dir dist && node e2e/serve-web.mjs`,
    url: HOST,
    // Never reuse: a leftover server could be a stale build.
    reuseExistingServer: false,
    // A cold export (first run / cleared cache) can take a couple of minutes.
    timeout: 240_000,
    stdout: 'pipe',
    stderr: 'pipe',
    env: {
      PORT: String(PORT),
      // Force a non-empty key so `client.ts` reaches fetch (then it's mocked).
      REJSEPLANEN_ACCESS_ID: 'e2e-test-key',
      EXPO_NO_TELEMETRY: '1',
    },
  },
});
