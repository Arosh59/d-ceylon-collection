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
      let url: URL;
      try {
        url = new URL(value);
      } catch {
        throw new Error(`${name} must be a valid URL in ${environment}.`);
      }
      if (url.protocol !== "https:") {
        throw new Error(`${name} must use HTTPS in ${environment}.`);
      }
      if (isPlaceholderIdentityHost(url.hostname)) {
        throw new Error(
          `${name} is still a placeholder. Configure the managed OIDC provider in ${environment}.`,
        );
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

function isPlaceholderIdentityHost(hostname: string): boolean {
  const normalized = hostname.toLowerCase();
  return (
    normalized === "your-identity-provider.com" ||
    normalized === "example.com" ||
    normalized.endsWith(".example.com") ||
    normalized === "example.test" ||
    normalized.endsWith(".example.test")
  );
}

function stringValue(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}
