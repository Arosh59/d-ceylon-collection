export type AdminApplicationEnvironment = "Development" | "Production";
export type AdminAuthenticationMode = "local" | "oidc";

export interface AdminAuthenticationEnvironment {
  applicationEnvironment: AdminApplicationEnvironment;
  authenticationMode: AdminAuthenticationMode;
  clientId: string;
  clientSecret: string;
  issuer: string;
  localAdminEmail: string;
  localAdminPassword: string;
  sessionSecret: string;
}

interface EnvironmentInput {
  readonly APP_ENVIRONMENT?: string;
  readonly AUTH_MODE?: string;
  readonly AUTH_CLIENT_ID?: string;
  readonly AUTH_CLIENT_SECRET?: string;
  readonly AUTH_ISSUER?: string;
  readonly AUTH_SECRET?: string;
  readonly LOCAL_ADMIN_EMAIL?: string;
  readonly LOCAL_ADMIN_PASSWORD?: string;
}

export function readAdminAuthenticationEnvironment(
  environment: EnvironmentInput,
): AdminAuthenticationEnvironment {
  const applicationEnvironment = readApplicationEnvironment(environment.APP_ENVIRONMENT);
  const authenticationMode = readAuthenticationMode(environment.AUTH_MODE, applicationEnvironment);

  if (authenticationMode === "local" && applicationEnvironment !== "Development") {
    throw new Error("AUTH_MODE=local is only available in Development.");
  }

  const sessionSecret = required("AUTH_SECRET", environment.AUTH_SECRET);
  if (sessionSecret.length < 32) {
    throw new Error("AUTH_SECRET must be at least 32 characters.");
  }

  if (authenticationMode === "local") {
    return {
      applicationEnvironment,
      authenticationMode,
      clientId: "",
      clientSecret: "",
      issuer: "",
      localAdminEmail: required("LOCAL_ADMIN_EMAIL", environment.LOCAL_ADMIN_EMAIL),
      localAdminPassword: required("LOCAL_ADMIN_PASSWORD", environment.LOCAL_ADMIN_PASSWORD),
      sessionSecret,
    };
  }

  return {
    applicationEnvironment,
    authenticationMode,
    clientId: required("AUTH_CLIENT_ID", environment.AUTH_CLIENT_ID),
    clientSecret: required("AUTH_CLIENT_SECRET", environment.AUTH_CLIENT_SECRET),
    issuer: readIssuer(environment.AUTH_ISSUER, applicationEnvironment),
    localAdminEmail: "",
    localAdminPassword: "",
    sessionSecret,
  };
}

function readApplicationEnvironment(value: string | undefined): AdminApplicationEnvironment {
  const normalized = value?.trim().toLowerCase();
  if (!normalized || normalized === "development") return "Development";
  if (normalized === "production") return "Production";
  throw new Error("APP_ENVIRONMENT must be Development or Production.");
}

function readAuthenticationMode(
  value: string | undefined,
  applicationEnvironment: AdminApplicationEnvironment,
): AdminAuthenticationMode {
  const normalized = value?.trim().toLowerCase();
  if (!normalized) return applicationEnvironment === "Development" ? "local" : "oidc";
  if (normalized === "local" || normalized === "oidc") return normalized;
  throw new Error("AUTH_MODE must be oidc or local.");
}

function readIssuer(
  value: string | undefined,
  applicationEnvironment: AdminApplicationEnvironment,
): string {
  const candidate = required("AUTH_ISSUER", value);
  let url: URL;
  try {
    url = new URL(candidate);
  } catch {
    throw new Error("AUTH_ISSUER must be a valid URL.");
  }

  const loopbackHttp =
    applicationEnvironment === "Development" &&
    url.protocol === "http:" &&
    ["localhost", "127.0.0.1", "[::1]"].includes(url.hostname);
  if (
    (url.protocol !== "https:" && !loopbackHttp) ||
    url.username ||
    url.password ||
    url.search ||
    url.hash
  ) {
    throw new Error(
      "AUTH_ISSUER must be an HTTPS URL without credentials, query, or fragment (loopback HTTP is allowed in Development).",
    );
  }

  return url.toString().replace(/\/$/u, "");
}

function required(name: string, value: string | undefined): string {
  const result = value?.trim();
  if (!result) throw new Error(`${name} is required.`);
  return result;
}
