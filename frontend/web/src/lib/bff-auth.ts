import { NextResponse, type NextRequest } from "next/server";

export interface SessionIdentity {
  subject: string;
  displayName: string;
  email: string | null;
  roles: string[];
  permissions: string[];
  customerId: string | null;
  organisationId: string | null;
}

interface TokenExchange {
  accessToken: string;
  accessTokenExpiresAtUtc: string;
  refreshToken: string;
  refreshTokenExpiresAtUtc: string;
  identity: SessionIdentity;
}

const actions = new Set([
  "login",
  "google",
  "register",
  "refresh",
  "logout",
  "forgot-password",
  "reset-password",
  "testing",
]);

export async function handleAuthenticationPost(
  request: NextRequest,
  action: string,
): Promise<NextResponse> {
  if (!actions.has(action)) return problem(404, "Authentication route not found.");
  if (!isSameSite(request)) return problem(403, "The request origin is not allowed.");

  const refreshToken = request.cookies.get(cookieNames().refresh)?.value;
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
        : problem(401, "Your session has expired. Please sign in again.");
    clearAuthenticationCookies(response);
    return response;
  }

  let backend: Response;
  try {
    backend =
      action === "testing"
        ? await callTestingBackend(body, request)
        : await callBackend(action, body, request);
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
  if (action === "forgot-password") {
    return NextResponse.json(await backend.json(), { status: 202 });
  }
  if (action === "reset-password") return new NextResponse(null, { status: 204 });

  if (action === "testing") {
    const testing = (await backend.json()) as {
      accessToken: string;
      expiresAtUtc: string;
      identity: SessionIdentity;
    };
    const response = NextResponse.json({ identity: testing.identity });
    setAccessCookie(response, testing.accessToken, testing.expiresAtUtc);
    return response;
  }
  const exchange = (await backend.json()) as TokenExchange;
  const response = NextResponse.json({ identity: exchange.identity });
  setAuthenticationCookies(response, exchange);
  return response;
}

export async function handleSession(request: NextRequest): Promise<NextResponse> {
  const accessToken = request.cookies.get(cookieNames().access)?.value;
  if (accessToken) {
    try {
      const identity = await fetchIdentity(accessToken, request);
      if (identity.ok) return sessionSuccess(request, await identity.json());
      if (identity.status !== 401) return backendProblem(identity);
    } catch {
      return problem(503, "The authentication service could not be reached. Please try again.");
    }
  }

  const refreshToken = request.cookies.get(cookieNames().refresh)?.value;
  if (!refreshToken)
    return sessionFailure(request, "Your session has expired. Please sign in again.");
  let refreshed: Response;
  try {
    refreshed = await callBackend("refresh", { refreshToken }, request);
  } catch {
    return problem(503, "The authentication service could not be reached. Please try again.");
  }
  if (!refreshed.ok) {
    const response = await backendProblem(refreshed);
    clearAuthenticationCookies(response);
    return sessionFailure(request, "Your session has expired. Please sign in again.", response);
  }
  const exchange = (await refreshed.json()) as TokenExchange;
  const response = sessionSuccess(request, exchange.identity);
  setAuthenticationCookies(response, exchange);
  return response;
}

function sessionSuccess(request: NextRequest, identity: unknown): NextResponse {
  const returnTo = safeReturnTo(request.nextUrl.searchParams.get("returnTo"));
  return returnTo
    ? NextResponse.redirect(new URL(returnTo, request.url))
    : NextResponse.json({ identity });
}

function sessionFailure(request: NextRequest, error: string, source?: NextResponse): NextResponse {
  const returnTo = safeReturnTo(request.nextUrl.searchParams.get("returnTo"));
  if (!returnTo) return source ?? problem(401, error);
  const signIn = new URL("/auth/sign-in", request.url);
  signIn.searchParams.set("reason", "expired");
  signIn.searchParams.set("callbackUrl", returnTo);
  const response = NextResponse.redirect(signIn);
  clearAuthenticationCookies(response);
  return response;
}

function safeReturnTo(value: string | null): string | null {
  return value?.startsWith("/") && !value.startsWith("//") ? value : null;
}

export function accessCookieName(): string {
  return cookieNames().access;
}

function cookieNames(): { access: string; refresh: string } {
  const secure = process.env.APP_ENVIRONMENT === "Production";
  return secure
    ? { access: "__Secure-dceylon-web-access", refresh: "__Secure-dceylon-web-refresh" }
    : { access: "dceylon-web-access", refresh: "dceylon-web-refresh" };
}

function setAuthenticationCookies(response: NextResponse, exchange: TokenExchange): void {
  const names = cookieNames();
  const secure = process.env.APP_ENVIRONMENT === "Production";
  setAccessCookie(response, exchange.accessToken, exchange.accessTokenExpiresAtUtc);
  response.cookies.set(names.refresh, exchange.refreshToken, {
    httpOnly: true,
    sameSite: "lax",
    secure,
    path: "/api/auth",
    expires: new Date(exchange.refreshTokenExpiresAtUtc),
  });
}

function setAccessCookie(response: NextResponse, token: string, expiresAtUtc: string): void {
  const secure = process.env.APP_ENVIRONMENT === "Production";
  response.cookies.set(cookieNames().access, token, {
    httpOnly: true,
    sameSite: "lax",
    secure,
    path: "/",
    expires: new Date(expiresAtUtc),
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

function callBackend(action: string, body: unknown, request: NextRequest): Promise<Response> {
  return fetch(new URL(`/api/v1/auth/${action}`, apiBaseUrl()), {
    method: "POST",
    headers: forwardedHeaders(request),
    body: JSON.stringify(body),
    cache: "no-store",
    signal: AbortSignal.timeout(10_000),
  });
}

function callTestingBackend(body: unknown, request: NextRequest): Promise<Response> {
  if (process.env.APP_ENVIRONMENT !== "Testing") {
    return Promise.resolve(new Response(null, { status: 404 }));
  }
  const value = body as { persona?: unknown; testKey?: unknown };
  const key = typeof value.testKey === "string" ? value.testKey : "";
  return fetch(new URL("/api/v1/access/testing/token", apiBaseUrl()), {
    method: "POST",
    headers: { ...forwardedHeaders(request), "X-Test-Authentication-Key": key },
    body: JSON.stringify({ persona: value.persona }),
    cache: "no-store",
    signal: AbortSignal.timeout(5_000),
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
    const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host");
    return new URL(origin).host === host;
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
