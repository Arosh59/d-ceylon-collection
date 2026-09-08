export type ApplicationEnvironment = "Development" | "Production" | "Testing";
export type AuthenticationMode = "local" | "oidc";

export interface AuthenticationEnvironment {
  applicationEnvironment: ApplicationEnvironment;
  audience?: string | undefined;
  authenticationMode: AuthenticationMode;
  clientId: string;
  clientSecret: string;
  issuer: string;
  scope: string;
  sessionSecret: string;
  testEndpointKey?: string | undefined;
}

interface EnvironmentInput {
  readonly APP_ENVIRONMENT?: string;
  readonly AUTH_AUDIENCE?: string;
  readonly AUTH_MODE?: string;
  readonly AUTH_CLIENT_ID?: string;
  readonly AUTH_CLIENT_SECRET?: string;
  readonly AUTH_ISSUER?: string;
  readonly AUTH_SCOPE?: string;
  readonly AUTH_SECRET?: string;
  readonly AUTH_TEST_ENDPOINT_KEY?: string;
}

export function readAuthenticationEnvironment(
  environment: EnvironmentInput,
): AuthenticationEnvironment {
  const applicationEnvironment = readApplicationEnvironment(environment.APP_ENVIRONMENT);
  const authenticationMode = readAuthenticationMode(environment.AUTH_MODE);
  if (authenticationMode === "local" && applicationEnvironment !== "Development") {
    throw new Error("AUTH_MODE=local is only available in Development.");
  }

  const issuer =
    authenticationMode === "oidc"
      ? readIssuer(environment.AUTH_ISSUER, applicationEnvironment)
      : "http://127.0.0.1";
  const scope =
    authenticationMode === "oidc"
      ? required("AUTH_SCOPE", environment.AUTH_SCOPE)
      : "openid profile email";
  if (!scope.split(/\s+/u).includes("openid")) {
    throw new Error("AUTH_SCOPE must include openid.");
  }

  const sessionSecret = requiredSecret("AUTH_SECRET", environment.AUTH_SECRET);
  if (sessionSecret.length < 32) {
    throw new Error("AUTH_SECRET must be at least 32 characters.");
  }

  const testEndpointKey = environment.AUTH_TEST_ENDPOINT_KEY?.trim() || undefined;
  if (testEndpointKey && applicationEnvironment !== "Testing") {
    throw new Error("AUTH_TEST_ENDPOINT_KEY can only be used when APP_ENVIRONMENT is Testing.");
  }
  if (applicationEnvironment === "Testing" && (!testEndpointKey || testEndpointKey.length < 32)) {
    throw new Error("Testing requires AUTH_TEST_ENDPOINT_KEY with at least 32 characters.");
  }

  return {
    applicationEnvironment,
    audience:
      authenticationMode === "oidc" ? environment.AUTH_AUDIENCE?.trim() || undefined : undefined,
    authenticationMode,
    clientId:
      authenticationMode === "oidc" ? required("AUTH_CLIENT_ID", environment.AUTH_CLIENT_ID) : "",
    clientSecret:
      authenticationMode === "oidc"
        ? requiredSecret("AUTH_CLIENT_SECRET", environment.AUTH_CLIENT_SECRET)
        : "",
    issuer,
    scope,
    sessionSecret,
    testEndpointKey,
  };
}

function readAuthenticationMode(value: string | undefined): AuthenticationMode {
  const normalized = value?.trim().toLowerCase();
  if (!normalized || normalized === "oidc") return "oidc";
  if (normalized === "local") return "local";
  throw new Error("AUTH_MODE must be oidc or local.");
}

function readApplicationEnvironment(value: string | undefined): ApplicationEnvironment {
  const normalized = value?.trim().toLowerCase();
  if (!normalized) {
    return "Development";
  }

  switch (normalized) {
    case "development":
      return "Development";
    case "production":
      return "Production";
    case "testing":
      return "Testing";
    default:
      throw new Error("APP_ENVIRONMENT must be Development, Production, or Testing.");
  }
}

function readIssuer(value: string | undefined, environment: ApplicationEnvironment): string {
  const candidate = required("AUTH_ISSUER", value);
  let url: URL;
  try {
    url = new URL(candidate);
  } catch {
    throw new Error("AUTH_ISSUER must be a valid URL.");
  }
  const permitsLoopbackHttp =
    environment !== "Production" && url.protocol === "http:" && isLoopback(url.hostname);
  if (
    (url.protocol !== "https:" && !permitsLoopbackHttp) ||
    url.username ||
    url.password ||
    url.search ||
    url.hash
  ) {
    throw new Error(
      "AUTH_ISSUER must be an HTTPS origin (loopback HTTP is allowed outside Production).",
    );
  }

  if (isPlaceholderIssuer(url.hostname)) {
    throw new Error(
      "AUTH_ISSUER is still a placeholder. Set it to the issuer URL from your managed OIDC provider.",
    );
  }

  return url.origin;
}

function isPlaceholderIssuer(hostname: string): boolean {
  const normalized = hostname.toLowerCase();
  return (
    normalized === "your-identity-provider.com" ||
    normalized === "example.com" ||
    normalized.endsWith(".example.com") ||
    normalized === "example.test" ||
    normalized.endsWith(".example.test")
  );
}

function isLoopback(hostname: string): boolean {
  return hostname === "localhost" || hostname === "127.0.0.1" || hostname === "[::1]";
}

function required(name: string, value: string | undefined): string {
  const result = value?.trim();
  if (!result) {
    throw new Error(`${name} is required.`);
  }

  return result;
}

function requiredSecret(name: string, value: string | undefined): string {
  const result = required(name, value);
  const normalized = result.toLowerCase();
  if (
    normalized.startsWith("replace-") ||
    normalized.startsWith("replace_") ||
    normalized.startsWith("your-") ||
    normalized === "change-me"
  ) {
    throw new Error(`${name} is still a placeholder. Load a real value from the secret store.`);
  }
  return result;
}
