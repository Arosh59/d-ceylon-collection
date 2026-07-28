import { writeFile } from "node:fs/promises";

const apiBaseUrl = process.env.API_BASE_URL;
if (!apiBaseUrl) {
  throw new Error("API_BASE_URL is required to refresh the OpenAPI contract.");
}

const response = await fetch(new URL("/openapi/v1.json", apiBaseUrl), {
  headers: {
    Accept: "application/json",
    "X-Correlation-ID": "openapi-contract-refresh",
  },
  signal: AbortSignal.timeout(5_000),
});
if (!response.ok) {
  throw new Error(`OpenAPI request failed with status ${response.status}.`);
}

const contract = await response.json();
await writeFile(
  new URL("../packages/sdk/openapi/v1.json", import.meta.url),
  `${JSON.stringify(contract, null, 2)}\n`,
  "utf8",
);
console.log("Refreshed packages/sdk/openapi/v1.json from the live API.");
