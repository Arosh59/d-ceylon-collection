import { defineConfig, devices } from "@playwright/test";

const baseURL = process.env.WEB_BASE_URL ?? "http://127.0.0.1:3000";

export default defineConfig({
  testDir: "./tests/smoke",
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  reporter: "list",
  use: {
    baseURL,
    channel: process.env.CI ? undefined : "chrome",
    trace: "retain-on-failure",
  },
  projects: [
    {
      name: "desktop",
      use: {
        ...devices["Desktop Chrome"],
      },
    },
    {
      name: "mobile",
      use: {
        ...devices["Pixel 7"],
      },
    },
  ],
});
