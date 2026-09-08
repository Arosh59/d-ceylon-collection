export function validateEnvironment(values: Record<string, unknown>): Record<string, unknown> {
  const environment = stringValue(values.APP_ENVIRONMENT) ?? "Development";
  if (!["Development", "Testing", "Staging", "Production"].includes(environment)) {
    throw new Error("APP_ENVIRONMENT must be Development, Testing, Staging, or Production.");
  }

  if (environment !== "Testing") {
    for (const name of ["JWT_ACCESS_SECRET"]) {
      if (!stringValue(values[name])) throw new Error(`${name} is required in ${environment}.`);
    }
    if (stringValue(values.JWT_ACCESS_SECRET)!.length < 32) {
      throw new Error("JWT_ACCESS_SECRET must contain at least 32 characters.");
    }
    if (!/^\d+[smhd]$/u.test(stringValue(values.JWT_ACCESS_TTL) ?? "15m")) {
      throw new Error("JWT_ACCESS_TTL must use a value such as 15m, 1h, or 1d.");
    }
    if (!/^\d+[mhd]$/u.test(stringValue(values.JWT_REFRESH_TTL) ?? "30d")) {
      throw new Error("JWT_REFRESH_TTL must use a value such as 30m, 24h, or 30d.");
    }
  }

  if (environment === "Production" || environment === "Staging") {
    for (const name of [
      "DATABASE_URL",
      "FIREBASE_PROJECT_ID",
      "FIREBASE_CLIENT_EMAIL",
      "FIREBASE_PRIVATE_KEY",
      "SMTP_HOST",
      "SMTP_PORT",
      "SMTP_FROM",
      "PASSWORD_RESET_URL",
    ]) {
      if (!stringValue(values[name])) throw new Error(`${name} is required in ${environment}.`);
    }
    const resetUrl = secureUrl("PASSWORD_RESET_URL", stringValue(values.PASSWORD_RESET_URL)!);
    if (isPlaceholderHost(resetUrl.hostname)) {
      throw new Error(`PASSWORD_RESET_URL is still a placeholder in ${environment}.`);
    }
    const smtpPort = Number(stringValue(values.SMTP_PORT));
    if (!Number.isInteger(smtpPort) || smtpPort < 1 || smtpPort > 65_535) {
      throw new Error("SMTP_PORT must be a valid TCP port.");
    }
    for (const name of ["JWT_ACCESS_SECRET", "FIREBASE_PROJECT_ID", "FIREBASE_CLIENT_EMAIL"]) {
      if (isPlaceholder(stringValue(values[name])!)) {
        throw new Error(`${name} is still a placeholder in ${environment}.`);
      }
    }
    if (!stringValue(values.FIREBASE_PRIVATE_KEY)!.includes("BEGIN PRIVATE KEY")) {
      throw new Error("FIREBASE_PRIVATE_KEY must contain a Firebase service-account private key.");
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

  return {
    ...values,
    APP_ENVIRONMENT: environment,
    JWT_ISSUER: stringValue(values.JWT_ISSUER) ?? "dceylon-api",
    JWT_AUDIENCE: stringValue(values.JWT_AUDIENCE) ?? "dceylon-api",
    JWT_ACCESS_TTL: stringValue(values.JWT_ACCESS_TTL) ?? "15m",
    JWT_REFRESH_TTL: stringValue(values.JWT_REFRESH_TTL) ?? "30d",
  };
}

function secureUrl(name: string, value: string): URL {
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    throw new Error(`${name} must be a valid URL.`);
  }
  if (url.protocol !== "https:") throw new Error(`${name} must use HTTPS.`);
  return url;
}

function isPlaceholderHost(hostname: string): boolean {
  const normalized = hostname.toLowerCase();
  return (
    normalized === "example.com" ||
    normalized.endsWith(".example.com") ||
    normalized === "example.test" ||
    normalized.endsWith(".example.test")
  );
}

function isPlaceholder(value: string): boolean {
  return /^(replace|change|example|your)[-_ ]/iu.test(value.trim());
}

function stringValue(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}
