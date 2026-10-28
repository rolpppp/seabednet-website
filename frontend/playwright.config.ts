import { defineConfig, devices } from "@playwright/test";

const PROD_URL = "http://localhost:3000";
const DEV_URL = "http://localhost:3100";

// The build folder comes from NEXT_DIST_DIR (default .next); next.config.ts reads the same variable,
// and the child processes below inherit it.
export default defineConfig({
  testDir: "./tests/e2e",
  outputDir: "./test-results",
  reporter: process.env.CI ? [["list"], ["html", { open: "never" }]] : "list",
  forbidOnly: !!process.env.CI,
  projects: [
    {
      name: "prod",
      use: { ...devices["Desktop Chrome"], baseURL: PROD_URL },
    },
    {
      name: "dev",
      testMatch: "design.spec.ts",
      use: { ...devices["Desktop Chrome"], baseURL: DEV_URL },
    },
  ],
  webServer: [
    {
      command: "pnpm exec next start --port 3000",
      url: PROD_URL,
      reuseExistingServer: !process.env.CI,
      timeout: 120_000,
    },
    {
      command: "pnpm exec next dev --port 3100",
      url: DEV_URL,
      reuseExistingServer: !process.env.CI,
      timeout: 120_000,
    },
  ],
});
