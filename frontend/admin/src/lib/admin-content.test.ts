import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import { managedResource, publicWebUrl } from "./admin-content";

describe("admin content routing", () => {
  afterEach(() => {
    delete process.env.PUBLIC_WEB_URL;
  });

  it("maps public website sections to their managed records", () => {
    expect(managedResource("collections")).toEqual({ resource: "collections" });
    expect(managedResource("destinations")).toEqual({ resource: "destinations" });
    expect(managedResource("experiences")).toEqual({
      resource: "products",
      productType: "experience",
    });
    expect(managedResource("accommodation")).toEqual({
      resource: "products",
      productType: "accommodation",
    });
    expect(managedResource("journal")).toEqual({ resource: "journal" });
    expect(managedResource("categories")).toEqual({ resource: "categories" });
    expect(managedResource("tags")).toEqual({ resource: "tags" });
  });

  it("uses the configured public site for preview links", () => {
    process.env.PUBLIC_WEB_URL = "https://www.example.test";
    expect(publicWebUrl("/destinations/sigiriya")).toBe(
      "https://www.example.test/destinations/sigiriya",
    );
  });
});
