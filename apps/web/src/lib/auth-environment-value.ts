export type ApplicationEnvironment = "Development" | "Production" | "Testing";

export interface AuthenticationEnvironment {
  applicationEnvironment: ApplicationEnvironment;
  clientId: string;
  clientSecret: string;
  issuer: string;
  scope: string;
  sessionSecret: string;
  testEndpointKey?: string | undefined;
}

interface EnvironmentInput {
  readonly APP_ENVIRONMENT?: string;
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
  const issuer = readIssuer(environment.AUTH_ISSUER, applicationEnvironment);
  const scope = required("AUTH_SCOPE", environment.AUTH_SCOPE);
  if (!scope.split(/\s+/u).includes("openid")) {
    throw new Error("AUTH_SCOPE must include openid.");
  }

  const sessionSecret = required("AUTH_SECRET", environment.AUTH_SECRET);
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
    clientId: required("AUTH_CLIENT_ID", environment.AUTH_CLIENT_ID),
    clientSecret: required("AUTH_CLIENT_SECRET", environment.AUTH_CLIENT_SECRET),
    issuer,
    scope,
    sessionSecret,
    testEndpointKey,
  };
}

function readApplicationEnvironment(value: string | undefined): ApplicationEnvironment {
  if (value === "Development" || value === "Production" || value === "Testing") {
    return value;
  }

  throw new Error("APP_ENVIRONMENT must be Development, Production, or Testing.");
}

function readIssuer(value: string | undefined, environment: ApplicationEnvironment): string {
  const candidate = required("AUTH_ISSUER", value);
  const url = new URL(candidate);
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

  return url.origin;
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
