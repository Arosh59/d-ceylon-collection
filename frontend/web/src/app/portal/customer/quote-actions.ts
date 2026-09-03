"use server";

import { QuoteApiError } from "@dceylon/sdk";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { getQuoteClient } from "@/lib/quotes";
import { requirePortalAuthentication } from "@/lib/portal-auth";

import type { CustomerActionState } from "./action-state";

export async function requestQuote(
  _state: CustomerActionState,
  formData: FormData,
): Promise<CustomerActionState> {
  try {
    const authentication = await requirePortalAuthentication(
      "customer",
      `/portal/customer/travel-plans/${required(formData, "travelPlanId")}`,
    );
    const client = await getQuoteClient(authentication.accessToken);
    const quote = await client.requestQuote({
      travelPlanId: required(formData, "travelPlanId"),
      itineraryRevisionId: required(formData, "itineraryRevisionId"),
      customerNotes: optional(formData, "customerNotes"),
    });
    revalidatePath("/portal/customer/quotes");
    redirect(`/portal/customer/quotes/${quote.id}?requested=1`);
  } catch (error) {
    return quoteActionError(error, "/portal/customer");
  }
}

export async function customerQuoteTransition(
  _state: CustomerActionState,
  formData: FormData,
): Promise<CustomerActionState> {
  const quoteId = required(formData, "quoteId");
  const operation = required(formData, "operation");
  try {
    const authentication = await requirePortalAuthentication(
      "customer",
      `/portal/customer/quotes/${quoteId}`,
    );
    const client = await getQuoteClient(authentication.accessToken);
    const concurrencyToken = required(formData, "concurrencyToken");
    if (operation === "accept") {
      await client.acceptCustomerQuote(quoteId, required(formData, "versionId"), concurrencyToken);
    } else if (operation === "decline") {
      await client.declineCustomerQuote(quoteId, required(formData, "versionId"), concurrencyToken);
    } else if (operation === "withdraw") {
      await client.withdrawCustomerQuote(quoteId, concurrencyToken);
    } else {
      return { message: "Unknown quote action.", status: "error" };
    }
    revalidatePath(`/portal/customer/quotes/${quoteId}`);
    revalidatePath("/portal/customer/quotes");
    redirect(`/portal/customer/quotes/${quoteId}?updated=${operation}`);
  } catch (error) {
    return quoteActionError(error, `/portal/customer/quotes/${quoteId}`);
  }
}

function quoteActionError(error: unknown, callbackUrl: string): CustomerActionState {
  if (!(error instanceof QuoteApiError)) throw error;
  if (error.status === 401)
    redirect(`/auth/sign-in?callbackUrl=${encodeURIComponent(callbackUrl)}`);
  if (error.status === 403) redirect("/auth/forbidden");
  return {
    ...(error.validationErrors ? { errors: error.validationErrors } : {}),
    message:
      error.status === 409
        ? "This quote changed or the requested transition is no longer allowed. Reload and retry."
        : error.message,
    status: error.status === 409 ? "conflict" : "error",
  };
}

function optional(formData: FormData, name: string): string | null {
  return required(formData, name) || null;
}

function required(formData: FormData, name: string): string {
  const value = formData.get(name);
  return typeof value === "string" ? value.trim() : "";
}
