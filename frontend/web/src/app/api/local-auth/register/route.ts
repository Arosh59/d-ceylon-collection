import { NextResponse } from "next/server";

import { getAuthenticationEnvironment } from "@/lib/auth-environment";
import { createLocalCustomer } from "@/lib/local-auth-store";

export async function POST(request: Request) {
  const environment = getAuthenticationEnvironment();
  if (!environment.authenticationMode || environment.authenticationMode !== "local") {
    return NextResponse.json({ error: "Local registration is disabled." }, { status: 404 });
  }

  const body = (await request.json().catch(() => null)) as {
    email?: unknown;
    name?: unknown;
    password?: unknown;
  } | null;
  const name = typeof body?.name === "string" ? body.name.trim() : "";
  const email = typeof body?.email === "string" ? body.email.trim() : "";
  const password = typeof body?.password === "string" ? body.password : "";

  if (name.length < 2 || name.length > 100) {
    return NextResponse.json({ error: "Enter your name." }, { status: 400 });
  }
  if (!/^\S+@\S+\.\S+$/u.test(email) || email.length > 254) {
    return NextResponse.json({ error: "Enter a valid email address." }, { status: 400 });
  }
  if (password.length < 8 || password.length > 128) {
    return NextResponse.json({ error: "Use a password between 8 and 128 characters." }, { status: 400 });
  }

  try {
    const user = await createLocalCustomer(name, email, password);
    return NextResponse.json({ email: user.email, name: user.name }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to create the account.";
    const status = message.includes("already exists") ? 409 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
