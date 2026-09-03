export function validateEnvironment(values: Record<string, unknown>): Record<string, unknown> {
  const environment = stringValue(values.APP_ENVIRONMENT) ?? "Development";
  if (!["Development", "Testing", "Staging", "Production"].includes(environment)) {
    throw new Error("APP_ENVIRONMENT must be Development, Testing, Staging, or Production.");
  }

  if (environment === "Production" || environment === "Staging") {
    for (const name of ["DATABASE_URL", "AUTH_AUTHORITY", "AUTH_ISSUER", "AUTH_AUDIENCE"]) {
      if (!stringValue(values[name])) throw new Error(`${name} is required in ${environment}.`);
    }
    for (const name of ["AUTH_AUTHORITY", "AUTH_ISSUER"]) {
      const value = stringValue(values[name])!;
      if (new URL(value).protocol !== "https:") {
        throw new Error(`${name} must use HTTPS in ${environment}.`);
      }
    }
  }

  if (environment === "Testing") {
    for (const name of [
      "AUTH_TEST_ISSUER",
      "AUTH_TEST_AUDIENCE",
      "AUTH_TEST_SIGNING_KEY",
      "AUTH_TEST_ENDPOINT_KEY",
    ]) {
      if (!stringValue(values[name])) throw new Error(`${name} is required in Testing.`);
    }
    if (stringValue(values.AUTH_TEST_SIGNING_KEY)!.length < 32) {
      throw new Error("AUTH_TEST_SIGNING_KEY must contain at least 32 characters.");
    }
    if (stringValue(values.AUTH_TEST_ENDPOINT_KEY)!.length < 16) {
      throw new Error("AUTH_TEST_ENDPOINT_KEY must contain at least 16 characters.");
    }
  }

  return values;
}

function stringValue(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}
