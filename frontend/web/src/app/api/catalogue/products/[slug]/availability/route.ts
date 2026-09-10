import { NextResponse, type NextRequest } from "next/server";

const queryNames = ["startDate", "endDate", "adults", "children", "rooms"] as const;

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ slug: string }> },
): Promise<NextResponse> {
  const { slug } = await context.params;
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/u.test(slug)) {
    return NextResponse.json({ error: "Invalid product identifier." }, { status: 400 });
  }
  const target = new URL(
    `/api/v1/catalogue/products/${encodeURIComponent(slug)}/availability`,
    apiBaseUrl(),
  );
  for (const name of queryNames) {
    const value = request.nextUrl.searchParams.get(name);
    if (value !== null) target.searchParams.set(name, value);
  }
  try {
    const response = await fetch(target, {
      cache: "no-store",
      headers: {
        Accept: "application/json",
        "X-Correlation-ID": request.headers.get("x-correlation-id") ?? crypto.randomUUID(),
      },
      signal: AbortSignal.timeout(7_000),
    });
    const body = await response.text();
    return new NextResponse(body || null, {
      status: response.status,
      headers: {
        "Cache-Control": "no-store",
        "Content-Type": response.headers.get("content-type") ?? "application/json",
      },
    });
  } catch {
    return NextResponse.json(
      { error: "Availability is temporarily unavailable. Please try again." },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }
}

function apiBaseUrl(): string {
  const value = process.env.API_BASE_URL?.trim();
  if (!value) throw new Error("API_BASE_URL is required.");
  return value;
}
