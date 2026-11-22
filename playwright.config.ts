import { defineConfig, devices } from "@playwright/test";

/**
 * A3 smoke suite (Hadi's Claude, 2026-11-22). Signed-out flows with browser autosave; every
 * CourseDog-backed route is stubbed in `e2e/fixtures.ts`, and requests to other hosts are aborted.
 *
 * Runs against a production build (`next build && next start`). When an agent runs it, `next build`
 * may stop once with Next.js's `SecurityFatalError` (docs/agent/launch-plan.md, "Known blocker");
 * running the build again continues. CI is unaffected.
 *
 * Env:
 * - `E2E_SKIP_BUILD=1`: serve the existing `.next` build with `next start` (CI builds in its own step).
 * - `E2E_SERVER=dev`: run against `next dev` instead (quicker while writing tests).
 * - `E2E_PORT` (default 3101): port for the app server.
 * - `E2E_BASE_URL`: test an already-running server instead of starting one.
 * - `PW_CHROMIUM_PATH`: a local Chromium to use instead of Playwright's download
 *   (e.g. /opt/pw-browsers/chromium). CI installs Chromium with `npx playwright install`.
 */
const port = Number(process.env.E2E_PORT ?? 3101);
const baseURL = process.env.E2E_BASE_URL ?? `http://localhost:${port}`;
const executablePath = process.env.PW_CHROMIUM_PATH || undefined;
const command =
  process.env.E2E_SERVER === "dev"
    ? `npx next dev -p ${port}`
    : process.env.E2E_SKIP_BUILD
      ? `npx next start -p ${port}`
      : `npx next build && npx next start -p ${port}`;

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: 0,
  // A few workers: other builds share this machine, and `next dev` compiles each route on first use.
  workers: process.env.CI ? 2 : 3,
  timeout: 60_000,
  expect: { timeout: 15_000 },
  reporter: process.env.CI ? [["list"], ["html", { open: "never" }]] : "list",
  use: {
    baseURL,
    trace: "off",
    launchOptions: executablePath ? { executablePath } : {},
  },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"], viewport: { width: 1440, height: 900 } }, testIgnore: /mobile\.spec\.ts/ },
    { name: "mobile", use: { ...devices["Pixel 7"], browserName: "chromium" }, testMatch: /mobile\.spec\.ts/ },
  ],
  webServer: process.env.E2E_BASE_URL
    ? undefined
    : {
        command,
        url: `${baseURL}/api/departments`,
        reuseExistingServer: !process.env.CI,
        timeout: 180_000,
        env: {
          NEXT_TELEMETRY_DISABLED: "1",
          // Signed out: no Supabase project, so the app uses browser autosave.
          NEXT_PUBLIC_SUPABASE_URL: "",
          NEXT_PUBLIC_SUPABASE_ANON_KEY: "",
        },
      },
});
