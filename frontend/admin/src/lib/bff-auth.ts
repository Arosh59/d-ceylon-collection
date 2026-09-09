import { NextResponse, type NextRequest } from "next/server";

export interface AdminIdentity {
  subject: string;
  displayName: string;
  email: string | null;
  roles: string[];
  permissions: string[];
  mustChangePassword: boolean;
  customerId: string | null;
  organisationId: string | null;
}

interface TokenExchange {
  accessToken: string;
  accessTokenExpiresAtUtc: string;
  refreshToken: string;
  refreshTokenExpiresAtUtc: string;
  identity: AdminIdentity;
}

const actions = new Set([
  "login",
  "google",
  "refresh",
  "logout",
  "forgot-password",
  "reset-password",
  "change-password",
]);

export async function handleAuthenticationPost(
  request: NextRequest,
  action: string,
): Promise<NextResponse> {
  if (!actions.has(action)) return problem(404, "Authentication route not found.");
  if (!isSameSite(request)) return problem(403, "The request origin is not allowed.");

  const refreshToken = request.cookies.get(cookieNames().refresh)?.value;
  const accessToken = request.cookies.get(cookieNames().access)?.value;
  if (action === "change-password" && !accessToken) {
    return problem(401, "Your administrator session has expired. Please sign in again.");
  }
  let body: unknown;
  try {
    body =
      action === "refresh" || action === "logout"
        ? { refreshToken: refreshToken ?? "" }
        : await request.json();
  } catch {
    return problem(400, "The request body must be valid JSON.");
  }

  if ((action === "refresh" || action === "logout") && !refreshToken) {
    const response =
      action === "logout"
        ? new NextResponse(null, { status: 204 })
        : problem(401, "Your administrator session has expired. Please sign in again.");
    clearAuthenticationCookies(response);
    return response;
  }

  let backend: Response;
  try {
    backend = await callBackend(action, body, request, accessToken);
  } catch {
    return problem(503, "The authentication service could not be reached. Please try again.");
  }
  if (!backend.ok) {
    const response = await backendProblem(backend);
    if (backend.status === 401 && (action === "refresh" || action === "logout")) {
      clearAuthenticationCookies(response);
    }
    return response;
  }

  if (action === "logout") {
    const response = new NextResponse(null, { status: 204 });
    clearAuthenticationCookies(response);
    return response;
  }
  if (action === "forgot-password") return NextResponse.json(await backend.json(), { status: 202 });
  if (action === "reset-password") return new NextResponse(null, { status: 204 });
  if (action === "change-password") {
    const response = new NextResponse(null, { status: 204 });
    clearAuthenticationCookies(response);
    return response;
  }

  const exchange = (await backend.json()) as TokenExchange;
  if (!exchange.identity.roles.includes("administrator")) {
    await callBackend("logout", { refreshToken: exchange.refreshToken }, request).catch(
      () => undefined,
    );
    return problem(403, "This account does not have administrator access.");
  }
  const response = NextResponse.json({ identity: exchange.identity });
  setAuthenticationCookies(response, exchange);
  return response;
}

export async function handleSession(request: NextRequest): Promise<NextResponse> {
  const accessToken = request.cookies.get(cookieNames().access)?.value;
  if (accessToken) {
    try {
      const identityResponse = await fetchIdentity(accessToken, request);
      if (identityResponse.ok) return administratorResponse(request, await identityResponse.json());
      if (identityResponse.status !== 401) return backendProblem(identityResponse);
    } catch {
      return problem(503, "The authentication service could not be reached. Please try again.");
    }
  }

  const refreshToken = request.cookies.get(cookieNames().refresh)?.value;
  if (!refreshToken) return sessionFailure(request);
  let refreshed: Response;
  try {
    refreshed = await callBackend("refresh", { refreshToken }, request);
  } catch {
    return problem(503, "The authentication service could not be reached. Please try again.");
  }
  if (!refreshed.ok) {
    const response = await backendProblem(refreshed);
    clearAuthenticationCookies(response);
    return sessionFailure(request);
  }
  const exchange = (await refreshed.json()) as TokenExchange;
  if (!exchange.identity.roles.includes("administrator")) {
    const response = problem(403, "This account no longer has administrator access.");
    clearAuthenticationCookies(response);
    return response;
  }
  const response = sessionSuccess(request, exchange.identity);
  setAuthenticationCookies(response, exchange);
  return response;
}

export function adminAccessCookieName(): string {
  return cookieNames().access;
}

function administratorResponse(request: NextRequest, value: unknown): NextResponse {
  const identity = value as AdminIdentity;
  if (identity.roles.includes("administrator")) return sessionSuccess(request, identity);
  const response = problem(403, "This account does not have administrator access.");
  clearAuthenticationCookies(response);
  return response;
}

function sessionSuccess(request: NextRequest, identity: AdminIdentity): NextResponse {
  const returnTo = safeReturnTo(request.nextUrl.searchParams.get("returnTo"));
  return returnTo
    ? NextResponse.redirect(new URL(returnTo, request.url))
    : NextResponse.json({ identity });
}

function sessionFailure(request: NextRequest): NextResponse {
  const returnTo = safeReturnTo(request.nextUrl.searchParams.get("returnTo"));
  if (!returnTo)
    return problem(401, "Your administrator session has expired. Please sign in again.");
  const response = NextResponse.redirect(new URL("/auth/sign-in?reason=expired", request.url));
  clearAuthenticationCookies(response);
  return response;
}

function safeReturnTo(value: string | null): string | null {
  return value?.startsWith("/") && !value.startsWith("//") ? value : null;
}

function cookieNames(): { access: string; refresh: string } {
  return process.env.APP_ENVIRONMENT === "Production"
    ? { access: "__Secure-dceylon-admin-access", refresh: "__Secure-dceylon-admin-refresh" }
    : { access: "dceylon-admin-access", refresh: "dceylon-admin-refresh" };
}

function setAuthenticationCookies(response: NextResponse, exchange: TokenExchange): void {
  const names = cookieNames();
  const secure = process.env.APP_ENVIRONMENT === "Production";
  response.cookies.set(names.access, exchange.accessToken, {
    httpOnly: true,
    sameSite: "lax",
    secure,
    path: "/",
    expires: new Date(exchange.accessTokenExpiresAtUtc),
  });
  response.cookies.set(names.refresh, exchange.refreshToken, {
    httpOnly: true,
    sameSite: "lax",
    secure,
    path: "/api/auth",
    expires: new Date(exchange.refreshTokenExpiresAtUtc),
  });
}

function clearAuthenticationCookies(response: NextResponse): void {
  const names = cookieNames();
  const secure = process.env.APP_ENVIRONMENT === "Production";
  response.cookies.set(names.access, "", {
    httpOnly: true,
    sameSite: "lax",
    secure,
    path: "/",
    maxAge: 0,
  });
  response.cookies.set(names.refresh, "", {
    httpOnly: true,
    sameSite: "lax",
    secure,
    path: "/api/auth",
    maxAge: 0,
  });
}

function callBackend(
  action: string,
  body: unknown,
  request: NextRequest,
  accessToken?: string,
): Promise<Response> {
  return fetch(new URL(`/api/v1/auth/${action}`, apiBaseUrl()), {
    method: "POST",
    headers: {
      ...forwardedHeaders(request),
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
    },
    body: JSON.stringify(body),
    cache: "no-store",
    signal: AbortSignal.timeout(10_000),
  });
}

function fetchIdentity(accessToken: string, request: NextRequest): Promise<Response> {
  return fetch(new URL("/api/v1/auth/me", apiBaseUrl()), {
    headers: { ...forwardedHeaders(request), Authorization: `Bearer ${accessToken}` },
    cache: "no-store",
    signal: AbortSignal.timeout(5_000),
  });
}

function forwardedHeaders(request: NextRequest): Record<string, string> {
  return {
    Accept: "application/json",
    "Content-Type": "application/json",
    "X-Correlation-ID": request.headers.get("x-correlation-id") ?? crypto.randomUUID(),
    ...(request.headers.get("user-agent")
      ? { "User-Agent": request.headers.get("user-agent")! }
      : {}),
    ...(request.headers.get("x-forwarded-for")
      ? { "X-Forwarded-For": request.headers.get("x-forwarded-for")! }
      : {}),
  };
}

function isSameSite(request: NextRequest): boolean {
  if (request.headers.get("sec-fetch-site") === "cross-site") return false;
  const origin = request.headers.get("origin");
  if (!origin) return true;
  try {
    return (
      new URL(origin).host ===
      (request.headers.get("x-forwarded-host") ?? request.headers.get("host"))
    );
  } catch {
    return false;
  }
}

async function backendProblem(response: Response): Promise<NextResponse> {
  const value = (await response.json().catch(() => null)) as {
    detail?: unknown;
    message?: unknown;
    title?: unknown;
  } | null;
  const error = [value?.detail, value?.message, value?.title].find(
    (item): item is string => typeof item === "string" && item.length > 0,
  );
  return problem(response.status, error ?? "Authentication is temporarily unavailable.");
}

function problem(status: number, error: string): NextResponse {
  return NextResponse.json({ error }, { status });
}

function apiBaseUrl(): string {
  const value = process.env.API_BASE_URL?.trim();
  if (!value) throw new Error("API_BASE_URL is required for authentication.");
  return value;
}
