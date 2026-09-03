import "server-only";

import { QuoteApiError } from "@dceylon/sdk";
import { notFound, redirect } from "next/navigation";

export function handleAgentQuoteError(error: unknown, callbackUrl: string): never {
  if (error instanceof QuoteApiError) {
    if (error.status === 401)
      redirect(`/auth/sign-in?callbackUrl=${encodeURIComponent(callbackUrl)}`);
    if (error.status === 403) redirect("/auth/forbidden");
    if (error.status === 404) notFound();
  }
  throw error;
}
