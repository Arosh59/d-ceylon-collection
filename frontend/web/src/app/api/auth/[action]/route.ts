import type { NextRequest } from "next/server";

import { handleAuthenticationPost, handleSession } from "@/lib/bff-auth";

export async function GET(request: NextRequest, context: { params: Promise<{ action: string }> }) {
  const { action } = await context.params;
  return action === "session"
    ? handleSession(request)
    : Response.json({ error: "Not found." }, { status: 404 });
}

export async function POST(request: NextRequest, context: { params: Promise<{ action: string }> }) {
  const { action } = await context.params;
  return handleAuthenticationPost(request, action);
}
