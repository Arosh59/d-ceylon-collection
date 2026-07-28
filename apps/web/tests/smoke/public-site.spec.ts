import { expect, test } from "@playwright/test";

test("home renders its accessible foundation without horizontal overflow", async ({
  page,
}, testInfo) => {
  const response = await page.goto("/");

  expect(response?.status()).toBe(200);
  await expect(
    page.getByRole("heading", {
      level: 1,
      name: /Discover Ceylon\. Rediscover Yourself\./,
    }),
  ).toBeVisible();
  await expect(page.getByRole("link", { name: "Skip to main content" })).toBeAttached();

  const viewportWidth = page.viewportSize()?.width ?? 0;
  const documentWidth = await page.evaluate(() => document.documentElement.scrollWidth);
  expect(documentWidth).toBeLessThanOrEqual(viewportWidth);

  if (testInfo.project.name === "mobile") {
    await expect(page.getByText("Menu", { exact: true })).toBeVisible();
    await page.getByText("Menu", { exact: true }).click();
    await expect(page.getByRole("navigation", { name: "Mobile navigation" })).toBeVisible();
  } else {
    await expect(page.getByRole("navigation", { name: "Primary navigation" })).toBeVisible();
  }
});

test("catalogue connects to the API and preserves correlation", async ({ page }) => {
  const correlationId = "phase3-smoke-request";
  await page.setExtraHTTPHeaders({
    "X-Correlation-ID": correlationId,
  });
  const response = await page.goto("/catalogue");

  expect(response?.status()).toBe(200);
  expect(response?.headers()["x-correlation-id"]).toBe(correlationId);
  expect(response?.headers()["content-security-policy"]).toContain("default-src 'self'");
  await expect(
    page.getByRole("heading", { level: 1, name: "Find your way into Sri Lanka." }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "The first journeys are being curated." }),
  ).toBeVisible();
});

test("unknown routes use the considered not-found state", async ({ page }) => {
  const response = await page.goto("/this-route-does-not-exist");

  expect(response?.status()).toBe(404);
  await expect(
    page.getByRole("heading", { level: 1, name: "This journey does not begin here." }),
  ).toBeVisible();
});
