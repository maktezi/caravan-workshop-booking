import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/e2e",
  testMatch: "**/*.spec.ts",
  fullyParallel: false,
  workers: 1,
  timeout: 30_000,
  forbidOnly: Boolean(process.env.CI),
  retries: 0,
  reporter: "list",
  use: {
    baseURL: "http://127.0.0.1:13000",
    trace: "retain-on-failure",
    launchOptions: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH
      ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH }
      : {},
  },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"] } },
    {
      name: "mobile",
      use: { ...devices["iPhone 13"], defaultBrowserType: "chromium" },
    },
  ],
  webServer: [
    {
      command: "bun tests/e2e/start-api.ts",
      url: "http://127.0.0.1:18000/api/health",
      reuseExistingServer: false,
      timeout: 20_000,
    },
    {
      command: "bun run dev --hostname 127.0.0.1 --port 13000",
      url: "http://127.0.0.1:13000",
      reuseExistingServer: false,
      timeout: 60_000,
      env: {
        API_BASE_URL: "http://127.0.0.1:18000/api",
        NEXT_DIST_DIR: ".next-e2e",
      },
    },
  ],
});
