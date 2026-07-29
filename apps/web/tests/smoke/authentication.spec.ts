import { expect, test } from "@playwright/test";

const testKey = process.env.AUTH_TEST_ENDPOINT_KEY;

test.beforeAll(() => {
  if (!testKey) {
    throw new Error("AUTH_TEST_ENDPOINT_KEY is required for authentication browser tests.");
  }
});

test("customer, agent quote, forbidden, and logout flow", async ({ page }, testInfo) => {
  const suffix = testInfo.project.name === "mobile" ? "Mobile" : "Desktop";
  const travellerName = `Phase Six ${suffix}`;
  const itineraryTitle = `Phase Six ${suffix} foundation`;
  const travelPlanTitle = `Phase Seven ${suffix} ${Date.now()}`;
  const productSlug =
    testInfo.project.name === "mobile" ? "knuckles-dawn-hike" : "tea-country-rail-estate-walk";

  await page.goto("/portal/customer");
  await expect(page).toHaveURL(/\/auth\/sign-in\?callbackUrl=/u);
  await expect(page.getByRole("heading", { name: "Sign in to your portal" })).toBeVisible();

  await page.getByLabel("Testing persona").selectOption("customer");
  await page.getByLabel("Testing access key").fill(testKey!);
  await page.getByRole("button", { name: "Sign in with test identity" }).click();

  await expect(page).toHaveURL(/\/portal\/customer$/u);
  await expect(page.getByRole("heading", { name: "Welcome, Test Customer" })).toBeVisible();

  await page.goto("/portal/customer/profile");
  await page.getByLabel("Given name").fill("Test");
  await page.getByLabel("Family name").fill("Customer");
  await page.getByLabel("Contact email").fill("customer@example.test");
  await page.getByLabel("Preferred contact method").selectOption("email");
  await page.getByRole("button", { name: /^(Create|Update) profile$/u }).click();
  await expect(page.getByRole("status")).toContainText("profile was saved", { timeout: 15_000 });

  await page.goto("/portal/customer/travellers");
  const previousTraveller = page.locator("li", { hasText: travellerName }).first();
  if (!(await previousTraveller.isVisible())) {
    await page.getByRole("link", { name: "Add traveller" }).click();
    await page.getByRole("button", { name: "Add traveller" }).click();
    expect(
      await page
        .getByLabel("Family name")
        .evaluate((element) => (element as HTMLInputElement).validity.valueMissing),
    ).toBe(true);
    await page.getByLabel("Given name").fill("Phase Six");
    await page.getByLabel("Family name").fill(suffix);
    await page.getByLabel("Dietary needs").fill("Vegetarian meals");
    await page.getByRole("button", { name: "Add traveller" }).click();
    await expect(page).toHaveURL(/\/portal\/customer\/travellers$/u);
  }
  await expect(page.getByRole("heading", { name: travellerName }).first()).toBeVisible();

  await page.goto("/portal/customer/wishlist");
  const previousWishlistEntry = page.locator("li", { hasText: productSlug }).first();
  if (!(await previousWishlistEntry.isVisible())) {
    await page.getByLabel("Published experience slug").fill(productSlug);
    await page.getByLabel("Private note").first().fill("Phase 6 browser check");
    await page.getByRole("button", { name: "Add to wishlist" }).click();
    await expect(page.getByRole("heading", { name: productSlug })).toBeVisible();
  }
  await page.getByLabel("Published experience slug").fill(productSlug);
  await page.getByRole("button", { name: "Add to wishlist" }).click();
  await expect(page.getByRole("alert").filter({ hasText: "already exists" })).toBeVisible();

  await page.goto("/portal/customer/saved-itineraries");
  const previousItinerary = page.locator("li", { hasText: itineraryTitle }).first();
  if (!(await previousItinerary.isVisible())) {
    await page.getByRole("link", { name: "Save an itinerary" }).first().click();
    await page.getByLabel("Title").fill(itineraryTitle);
    await page.getByLabel("Travel start").fill("2027-02-10");
    await page.getByLabel("Travel end").fill("2027-02-15");
    await page.getByLabel("Primary destination slug").fill("ella");
    await page.getByRole("button", { name: "Save itinerary" }).click();
    await expect(page).toHaveURL(/\/portal\/customer\/saved-itineraries$/u);
  }
  await expect(page.getByRole("heading", { name: itineraryTitle }).first()).toBeVisible();

  await page.goto("/portal/customer/travel-plans");
  await page.getByRole("link", { name: "Plan a journey" }).first().click();
  await page.getByRole("button", { name: "Generate deterministic draft" }).click();
  expect(
    await page
      .getByLabel("Plan title")
      .evaluate((element) => (element as HTMLInputElement).validity.valueMissing),
  ).toBe(true);
  await page.getByLabel("Plan title").fill(travelPlanTitle);
  await page.getByLabel("Travel start").fill("2027-03-10");
  await page.getByLabel("Travel end").fill("2027-03-12");
  await page.getByLabel("Interests (comma separated slugs)").fill("nature, slow-travel");
  await page.getByLabel(travellerName).first().check();
  await page.getByRole("button", { name: "Generate deterministic draft" }).click();
  await expect(page).toHaveURL(/\/portal\/customer\/travel-plans\/[^/]+$/u, { timeout: 15_000 });
  await expect(page.getByRole("heading", { name: travelPlanTitle })).toBeVisible();
  await expect(page.getByRole("note")).toContainText("does not confirm live availability");
  await expect(page.getByLabel("Day 1 title")).toBeEditable();
  await expect(page.getByRole("button", { name: "Regenerate deterministic draft" })).toBeEnabled();

  await page.getByRole("button", { name: "Request quote for reviewed draft" }).click();
  await expect(page).toHaveURL(/\/portal\/customer\/quotes\/[^/]+\?requested=1$/u, {
    timeout: 15_000,
  });
  const quotePath = new URL(page.url()).pathname;
  await expect(page.getByRole("status")).toContainText("quote request was recorded");
  await expect(page.getByRole("note")).toContainText("does not confirm supplier availability");

  await page.goto("/portal/customer");
  await page.getByRole("button", { name: "Sign out" }).click();
  await expect(page).toHaveURL(/\/$/u);

  await page.goto("/auth/sign-in?callbackUrl=%2Fportal%2Fagent%2Fquotes");
  await page.getByLabel("Testing persona").selectOption("agent");
  await page.getByLabel("Testing access key").fill(testKey!);
  await page.getByRole("button", { name: "Sign in with test identity" }).click();
  await expect(page).toHaveURL(/\/portal\/agent\/quotes$/u);
  const quoteCard = page.locator("li", { hasText: travelPlanTitle });
  await expect(quoteCard).toBeVisible();
  await quoteCard.getByRole("button", { name: "Claim and prepare quote" }).click();
  await expect(page).toHaveURL(/\/portal\/agent\/quotes\/[^/]+\?prepared=1$/u, {
    timeout: 15_000,
  });
  await page.getByLabel("Line 1 title").fill("Private Sri Lanka journey");
  await page.getByLabel("Quantity").first().fill("1");
  await page.getByLabel("Unit amount").first().fill("1250");
  await page
    .getByLabel("Customer terms")
    .fill("This immutable quote is an estimate and not a booking or payment confirmation.");
  await page.getByRole("button", { name: "Save itemized quote draft" }).click();
  await expect(
    page.getByRole("status").filter({ hasText: "Quote draft and deterministic totals updated" }),
  ).toBeVisible({ timeout: 15_000 });
  await page.getByRole("button", { name: "Send immutable quote version" }).click();
  await expect(page).toHaveURL(/\?sent=1$/u, { timeout: 15_000 });
  await expect(page.getByRole("status")).toContainText("Quote workflow updated successfully");

  await page.goto("/portal/customer");
  await expect(page).toHaveURL(/\/auth\/forbidden$/u);
  await expect(
    page.getByRole("heading", { name: "Your account cannot open this portal" }),
  ).toBeVisible();

  await page.goto("/portal/agent");
  await page.getByRole("button", { name: "Sign out" }).click();
  await expect(page).toHaveURL(/\/$/u);
  await page.goto(`/auth/sign-in?callbackUrl=${encodeURIComponent(quotePath)}`);
  await page.getByLabel("Testing persona").selectOption("customer");
  await page.getByLabel("Testing access key").fill(testKey!);
  await page.getByRole("button", { name: "Sign in with test identity" }).click();
  await expect(page).toHaveURL(new RegExp(`${quotePath.replaceAll("/", "\\/")}$`, "u"));
  await expect(page.getByText("Immutable quote versions")).toBeVisible();
  await page.getByRole("button", { name: "Accept sent quote" }).click();
  await expect(page).toHaveURL(/\?updated=accept$/u, { timeout: 15_000 });
  await expect(page.getByRole("status")).toContainText("Quote status updated to accepted");

  await page.goto("/portal/customer/travel-plans/00000000-0000-0000-0000-000000000099");
  await expect(
    page.getByRole("heading", { name: "This journey does not begin here." }),
  ).toBeVisible();

  await page.goto("/portal/customer/travellers/00000000-0000-0000-0000-000000000099");
  await expect(
    page.getByRole("heading", { name: "This journey does not begin here." }),
  ).toBeVisible();

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
