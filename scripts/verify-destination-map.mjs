import { chromium } from "@playwright/test";
import assert from "node:assert/strict";
import { mkdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";

const baseUrl = process.env.WEB_BASE_URL ?? "http://127.0.0.1:3000";
const destinationNames = ["Colombo", "Ella", "Galle", "Kandy", "Sigiriya", "Tangalle"];
const viewports = [
  { height: 812, name: "mobile", width: 375 },
  { height: 1024, name: "tablet", width: 768 },
  { height: 1000, name: "desktop", width: 1440 },
  { height: 1080, name: "large-desktop", width: 1920 },
];

const artifactsDirectory = fileURLToPath(new URL("../artifacts/", import.meta.url));
await mkdir(artifactsDirectory, { recursive: true });
const browser = await chromium.launch({ channel: "chrome", headless: true });
const failures = [];

try {
  for (const viewport of viewports) {
    console.log(`Verifying ${viewport.name} (${viewport.width}px)...`);
    const context = await browser.newContext({ viewport });
    const page = await context.newPage();
    const consoleErrors = [];
    const mapRequestFailures = [];
    const mapResponses = [];
    page.on("console", (message) => {
      if (message.type() === "error") consoleErrors.push(message.text());
    });
    page.on("pageerror", (error) => consoleErrors.push(error.message));
    page.on("requestfailed", (request) => {
      if (request.url().includes("googleapis.com") || request.url().includes("gstatic.com")) {
        const errorText = request.failure()?.errorText ?? "failed";
        if (errorText !== "net::ERR_ABORTED") {
          const requestUrl = new URL(request.url());
          mapRequestFailures.push(`${requestUrl.hostname}${requestUrl.pathname}: ${errorText}`);
        }
      }
    });
    page.on("response", (response) => {
      if (response.url().includes("googleapis.com") || response.url().includes("gstatic.com")) {
        mapResponses.push(`${response.status()} ${new URL(response.url()).hostname}`);
      }
    });

    await page.goto(`${baseUrl}/destinations/map`, {
      timeout: 60_000,
      waitUntil: "domcontentloaded",
    });
    await page.locator("[data-map-status]").waitFor({ timeout: 30_000 });
    await page.waitForTimeout(8_000);
    const mapStatus = await page.locator("[data-map-status]").getAttribute("data-map-status");
    if (mapStatus !== "ready") {
      const mapMarkup = await page
        .locator("[data-map-status]")
        .evaluate((element) => element.outerHTML);
      const mapError = await page.locator("[data-map-status]").getAttribute("data-map-error");
      const errorMessage = await page
        .locator('[role="alert"]')
        .textContent()
        .catch(() => "No alert text");
      const hasGoogleMaps = await page.evaluate(() => Boolean(window.google?.maps));
      throw new Error(
        `${viewport.name} map status was ${mapStatus}: ${mapError}; ${errorMessage}; google maps global: ${hasGoogleMaps}; console: ${consoleErrors.join(" | ")}; network: ${mapRequestFailures.join(" | ")}; responses: ${mapResponses.join(" | ")}; markup: ${mapMarkup}`,
      );
    }
    await page.getByRole("heading", { level: 1, name: "Explore Sri Lanka" }).waitFor();
    assert.equal(await page.getByText("6 destinations").first().textContent(), "6 destinations");
    assert.equal(await page.locator('svg[aria-label*="Abstract Sri Lanka"]').count(), 0);
    const overflow = await page.evaluate(() => ({
      offenders: [...document.querySelectorAll("body *")]
        .map((element) => {
          const rectangle = element.getBoundingClientRect();
          return {
            className: element.getAttribute("class") ?? "",
            right: Math.round(rectangle.right),
            tagName: element.tagName,
            width: Math.round(rectangle.width),
          };
        })
        .filter((element) => element.width > 0 && element.right > window.innerWidth + 1)
        .slice(0, 8),
      scrollWidth: document.documentElement.scrollWidth,
      viewportWidth: window.innerWidth,
    }));
    assert.equal(
      overflow.scrollWidth <= overflow.viewportWidth,
      true,
      `${viewport.name} has horizontal overflow: ${JSON.stringify(overflow)}`,
    );

    if (viewport.name === "desktop") {
      for (const destinationName of destinationNames) {
        await page
          .getByRole("complementary", { name: "Map destination results" })
          .getByRole("button", { name: new RegExp(`^${destinationName}\\b`) })
          .click();
        await page
          .locator(".destination-map-info__title")
          .filter({ hasText: destinationName })
          .waitFor();
      }

      await page.getByRole("searchbox", { name: "Search destinations" }).fill("Sigiriya");
      await page.getByText("1 destination").waitFor();
      await page.getByRole("button", { name: "Clear filters" }).click();
      await page.getByText("6 destinations").first().waitFor();
      await page.getByRole("combobox", { name: "Province" }).selectOption("Central");
      await page.getByText("2 destinations").waitFor();
      await page.getByRole("button", { name: "Clear filters" }).click();

      await page
        .getByRole("complementary", { name: "Map destination results" })
        .getByRole("button", { name: /^Ella\b/ })
        .click();
      await page.getByRole("button", { name: "Explore destination →" }).click();
      await page.waitForURL(/\/catalogue\?destination=ella$/);
      assert.equal(await page.getByRole("combobox", { name: "Destination" }).inputValue(), "ella");
      await page.goBack({ waitUntil: "domcontentloaded" });
      await page.locator('[data-map-status="ready"]').waitFor({ timeout: 30_000 });
    }

    if (viewport.name === "desktop" || viewport.name === "mobile") {
      await page.getByRole("button", { name: "View all Sri Lanka" }).click();
      await page.evaluate(() => {
        if (document.activeElement instanceof HTMLElement) document.activeElement.blur();
        window.scrollTo({ left: 0, top: 0 });
      });
      await page.waitForTimeout(2_500);
      await page.screenshot({
        fullPage: true,
        path: fileURLToPath(
          new URL(`../artifacts/destination-map-${viewport.name}.png`, import.meta.url),
        ),
      });
    }

    if (consoleErrors.length > 0)
      failures.push(`${viewport.name} console: ${consoleErrors.join(" | ")}`);
    if (mapRequestFailures.length > 0)
      failures.push(`${viewport.name} network: ${mapRequestFailures.join(" | ")}`);
    await context.close();
  }
} finally {
  await browser.close();
}

assert.deepEqual(failures, [], failures.join("\n"));
console.log("Destination map verified at 375px, 768px, 1440px, and 1920px.");
