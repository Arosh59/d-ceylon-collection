import { cookies } from "next/headers";
import { NextResponse, type NextRequest } from "next/server";

import { adminAccessCookieName } from "@/lib/bff-auth";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest, context: RouteContext) {
  return forward(request, context, "POST");
}
export async function PUT(request: NextRequest, context: RouteContext) {
  return forward(request, context, "PUT");
}
export async function DELETE(request: NextRequest, context: RouteContext) {
  return forward(request, context, "DELETE");
}

type RouteContext = { params: Promise<{ path: string[] }> };

async function forward(
  request: NextRequest,
  context: RouteContext,
  method: string,
): Promise<NextResponse> {
  if (!sameSite(request))
    return NextResponse.json({ error: "The request origin is not allowed." }, { status: 403 });
  const token = (await cookies()).get(adminAccessCookieName())?.value;
  if (!token)
    return NextResponse.json({ error: "Your administrator session has expired." }, { status: 401 });
  const { path } = await context.params;
  if (!path.length || path.some((part) => !/^[a-z0-9-]+$/u.test(part))) {
    return NextResponse.json({ error: "Invalid administration path." }, { status: 400 });
  }
  let response: Response;
  try {
    response = await fetch(new URL(`/api/v1/administration/${path.join("/")}`, apiBaseUrl()), {
      method,
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        "X-Correlation-ID": request.headers.get("x-correlation-id") ?? crypto.randomUUID(),
      },
      body: method === "DELETE" ? undefined : await request.text(),
      cache: "no-store",
      signal: AbortSignal.timeout(10_000),
    });
  } catch {
    return NextResponse.json(
      { error: "The administration API could not be reached." },
      { status: 503 },
    );
  }
  const text = await response.text();
  return new NextResponse(text || null, {
    status: response.status,
    headers: { "Content-Type": response.headers.get("content-type") ?? "application/json" },
  });
}

function sameSite(request: NextRequest): boolean {
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

function apiBaseUrl(): string {
  const value = process.env.API_BASE_URL?.trim();
  if (!value) throw new Error("API_BASE_URL is required.");
  return value;
}
