import { requireDatabaseUrl } from "../src/database/database.service";

describe("database configuration", () => {
  it("accepts a configured PostgreSQL connection string", () => {
    expect(requireDatabaseUrl({ DATABASE_URL: "postgresql://database.example.test/dceylon" })).toBe(
      "postgresql://database.example.test/dceylon",
    );
  });

  it("fails with actionable local startup guidance when DATABASE_URL is missing", () => {
    expect(() => requireDatabaseUrl({})).toThrow("npm run dev:backend");
  });
});
