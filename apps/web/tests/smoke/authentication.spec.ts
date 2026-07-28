import { expect, test } from "@playwright/test";

const testKey = process.env.AUTH_TEST_ENDPOINT_KEY;

test.beforeAll(() => {
  if (!testKey) {
    throw new Error("AUTH_TEST_ENDPOINT_KEY is required for authentication browser tests.");
  }
});

test("customer sign-in, forbidden portal, and logout flow", async ({ page }) => {
  await page.goto("/portal/customer");
  await expect(page).toHaveURL(/\/auth\/sign-in\?callbackUrl=/u);
  await expect(page.getByRole("heading", { name: "Sign in to your portal" })).toBeVisible();

  await page.getByLabel("Testing persona").selectOption("customer");
  await page.getByLabel("Testing access key").fill(testKey!);
  await page.getByRole("button", { name: "Sign in with test identity" }).click();

  await expect(page).toHaveURL(/\/portal\/customer$/u);
  await expect(page.getByRole("heading", { name: "Welcome, Test Customer" })).toBeVisible();

  await page.goto("/portal/agent");
  await expect(page).toHaveURL(/\/auth\/forbidden$/u);
  await expect(
    page.getByRole("heading", { name: "Your account cannot open this portal" }),
  ).toBeVisible();

  await page.goto("/portal/customer");
  await page.getByRole("button", { name: "Sign out" }).click();
  await expect(page).toHaveURL(/\/$/u);
  await page.goto("/portal/customer");
  await expect(page).toHaveURL(/\/auth\/sign-in\?callbackUrl=/u);
});

test("agent sign-in reaches only the agent organisation portal", async ({ page }) => {
  await page.goto("/auth/sign-in?callbackUrl=%2Fportal%2Fagent");
  await page.getByLabel("Testing persona").selectOption("agent");
  await page.getByLabel("Testing access key").fill(testKey!);
  await page.getByRole("button", { name: "Sign in with test identity" }).click();

  await expect(page).toHaveURL(/\/portal\/agent$/u);
  await expect(page.getByRole("heading", { name: "Welcome, Test Agent" })).toBeVisible();

  await page.goto("/portal/customer");
  await expect(page).toHaveURL(/\/auth\/forbidden$/u);
});
