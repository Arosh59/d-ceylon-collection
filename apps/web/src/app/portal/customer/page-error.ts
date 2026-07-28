import "server-only";

import { CustomerApiError, QuoteApiError, TravelPlanningApiError } from "@dceylon/sdk";
import { notFound, redirect } from "next/navigation";

export function handleCustomerPageError(error: unknown, callbackUrl: string): never {
  if (
    error instanceof CustomerApiError ||
    error instanceof QuoteApiError ||
    error instanceof TravelPlanningApiError
  ) {
    if (error.status === 401) {
      redirect(`/auth/sign-in?callbackUrl=${encodeURIComponent(callbackUrl)}`);
    }
    if (error.status === 403) {
      redirect("/auth/forbidden");
    }
    if (error.status === 404) {
      notFound();
    }
  }
  throw error;
}
