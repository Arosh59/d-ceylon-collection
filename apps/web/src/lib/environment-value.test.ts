import { describe, expect, it } from "vitest";

import { readWebEnvironment } from "./environment-value";

describe("readWebEnvironment", () => {
  it("accepts explicit HTTP origins", () => {
    expect(
      readWebEnvironment(
        {
          API_BASE_URL: "https://api.example.test/",
          SITE_URL: "https://www.example.test",
        },
        "production",
      ),
    ).toEqual({
      apiBaseUrl: "https://api.example.test",
      siteUrl: "https://www.example.test",
    });
  });

  it("requires both origins in production", () => {
    expect(() => readWebEnvironment({}, "production")).toThrow("API_BASE_URL is required.");
  });

  it("rejects credentials and unsupported protocols", () => {
    expect(() =>
      readWebEnvironment(
        {
          API_BASE_URL: "postgres://database.internal/catalogue",
          SITE_URL: "https://example.test",
        },
        "production",
      ),
    ).toThrow("API_BASE_URL must use HTTP or HTTPS.");

    expect(() =>
      readWebEnvironment(
        {
          API_BASE_URL: "https://user:password@example.test",
          SITE_URL: "https://example.test",
        },
        "production",
      ),
    ).toThrow("API_BASE_URL must be an origin");
  });
});
