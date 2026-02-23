import { defineConfig, devices } from "@playwright/test";

const port = Number(process.env.E2E_PORT || 3000);
const baseURL = process.env.E2E_BASE_URL || `http://127.0.0.1:${port}`;
const apiBase = process.env.E2E_API_BASE || process.env.NEXT_PUBLIC_API_BASE || "http://127.0.0.1:8000/api/v1";
const serverCommand =
  process.env.E2E_SERVER_CMD ||
  (process.env.CI
    ? `NEXT_PUBLIC_API_BASE=${apiBase} npm run start -- --port ${port}`
    : `NEXT_PUBLIC_API_BASE=${apiBase} npm run dev -- --port ${port}`);

export default defineConfig({
  testDir: "./e2e",
  timeout: 30_000,
  expect: { timeout: 5_000 },
  fullyParallel: true,
  reporter: [["list"]],
  use: {
    baseURL,
    trace: "on-first-retry",
  },
  webServer: {
    command: serverCommand,
    url: baseURL,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
  ],
});
