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

test("catalogue renders populated filtering and preserves correlation", async ({ page }) => {
  const correlationId = "phase4-smoke-request";
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
  await expect(page.getByRole("heading", { name: "10 places to begin" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Ella Canopy Hideaway" })).toBeVisible();
  await page.getByRole("link", { name: "Next page" }).click();
  await expect(page).toHaveURL(/page=2/);
  await expect(page.getByRole("link", { name: "Tea Country Rail & Estate Walk" })).toBeVisible();

  await page.goto("/catalogue");
  await page.getByRole("searchbox", { name: "Search" }).fill("railway");
  await page.getByRole("combobox", { name: "Collection" }).selectOption("flow");
  await page.getByRole("button", { name: "Apply filters" }).click();
  await expect(page).toHaveURL(/query=railway/);
  await expect(page.getByRole("heading", { name: "1 place to begin" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Tea Country Rail & Estate Walk" })).toBeVisible();

  await page.getByRole("combobox", { name: "Destination" }).selectOption("tangalle");
  await page.getByRole("button", { name: "Apply filters" }).click();
  await expect(
    page.getByRole("heading", { name: "No journeys match these filters." }),
  ).toBeVisible();
});

test("collection and destination discovery pages render API content", async ({ page }) => {
  await page.goto("/collections");
  await expect(page.getByRole("link", { name: "Root" })).toBeVisible();
  await page.getByRole("link", { name: "Breathe" }).click();
  await expect(page.getByRole("heading", { level: 1, name: "Breathe" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Ella Canopy Hideaway" })).toBeVisible();

  await page.goto("/destinations/ella");
  await expect(page.getByRole("heading", { level: 1, name: "Ella" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Tea Country Rail & Estate Walk" })).toBeVisible();
});

test("product type routes and detail foundations are populated", async ({ page }) => {
  await page.goto("/experiences");
  await expect(page.getByRole("link", { name: "Knuckles Dawn Hike" })).toBeVisible();

  await page.goto("/accommodation");
  await page.getByRole("link", { name: "Ella Canopy Hideaway" }).click();
  await expect(page.getByRole("heading", { level: 1, name: "Ella Canopy Hideaway" })).toBeVisible();
  await expect(page.getByText("A small locally run hideaway", { exact: false })).toBeVisible();
});

test("unknown routes use the considered not-found state", async ({ page }) => {
  const response = await page.goto("/this-route-does-not-exist");

  expect(response?.status()).toBe(404);
  await expect(
    page.getByRole("heading", { level: 1, name: "This journey does not begin here." }),
  ).toBeVisible();

  await page.goto("/collections/not-a-real-collection");
  await expect(
    page.getByRole("heading", { level: 1, name: "This journey does not begin here." }),
  ).toBeVisible();
});
