import { readFile } from "node:fs/promises";

const repositoryRoot = new URL("../", import.meta.url);
const snapshotUrl = new URL("packages/sdk/openapi/v1.json", repositoryRoot);
const apiBaseUrl = process.env.API_BASE_URL;

if (!apiBaseUrl) {
  throw new Error("API_BASE_URL is required to verify the OpenAPI contract.");
}

const liveContractResponse = await fetch(new URL("/openapi/v1.json", apiBaseUrl), {
  headers: {
    Accept: "application/json",
    "X-Correlation-ID": "phase3-contract-verification",
  },
  signal: AbortSignal.timeout(5_000),
});

if (!liveContractResponse.ok) {
  throw new Error(`OpenAPI request failed with status ${liveContractResponse.status}.`);
}

const [liveContract, snapshotContract] = await Promise.all([
  liveContractResponse.json(),
  readFile(snapshotUrl, "utf8").then(JSON.parse),
]);

if (canonicalJson(liveContract) !== canonicalJson(snapshotContract)) {
  throw new Error(
    "The committed OpenAPI snapshot does not match the live API. Refresh it and regenerate the SDK.",
  );
}

console.log("The committed OpenAPI snapshot matches the live API.");

function canonicalJson(value) {
  if (Array.isArray(value)) {
    return `[${value.map(canonicalJson).join(",")}]`;
  }

  if (value !== null && typeof value === "object") {
    return `{${Object.keys(value)
      .sort()
      .map((key) => `${JSON.stringify(key)}:${canonicalJson(value[key])}`)
      .join(",")}}`;
  }

  return JSON.stringify(value);
}
