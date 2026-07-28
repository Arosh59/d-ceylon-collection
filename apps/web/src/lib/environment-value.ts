export interface WebEnvironment {
  apiBaseUrl: string;
  siteUrl: string;
}

interface EnvironmentInput {
  readonly API_BASE_URL?: string;
  readonly NODE_ENV?: string;
  readonly SITE_URL?: string;
}

export function readWebEnvironment(
  environment: EnvironmentInput,
  mode = environment.NODE_ENV,
): WebEnvironment {
  return {
    apiBaseUrl: readHttpUrl(
      "API_BASE_URL",
      environment.API_BASE_URL,
      mode === "production" ? undefined : "http://127.0.0.1:8080",
    ),
    siteUrl: readHttpUrl(
      "SITE_URL",
      environment.SITE_URL,
      mode === "production" ? undefined : "http://127.0.0.1:3000",
    ),
  };
}

function readHttpUrl(name: string, value: string | undefined, fallback?: string): string {
  const candidate = value?.trim() || fallback;

  if (!candidate) {
    throw new Error(`${name} is required.`);
  }

  const url = new URL(candidate);

  if (!["http:", "https:"].includes(url.protocol)) {
    throw new Error(`${name} must use HTTP or HTTPS.`);
  }

  if (url.username || url.password || url.search || url.hash) {
    throw new Error(`${name} must be an origin without credentials, query, or fragment.`);
  }

  return url.origin;
}
