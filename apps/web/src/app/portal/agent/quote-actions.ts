"use server";

import { QuoteApiError } from "@dceylon/sdk";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { getQuoteClient } from "@/lib/quotes";
import { requirePortalAuthentication } from "@/lib/portal-auth";

import type { CustomerActionState } from "../customer/action-state";

export async function prepareQuote(
  _state: CustomerActionState,
  formData: FormData,
): Promise<CustomerActionState> {
  const quoteId = required(formData, "quoteId");
  try {
    const client = await authenticatedClient(quoteId);
    await client.prepareAgentQuote(quoteId, {
      currency: required(formData, "currency"),
      concurrencyToken: required(formData, "concurrencyToken"),
    });
    revalidatePath("/portal/agent/quotes");
    redirect(`/portal/agent/quotes/${quoteId}?prepared=1`);
  } catch (error) {
    return quoteActionError(error, quoteId);
  }
}

export async function updateQuoteDraft(
  _state: CustomerActionState,
  formData: FormData,
): Promise<CustomerActionState> {
  const quoteId = required(formData, "quoteId");
  try {
    const client = await authenticatedClient(quoteId);
    const lines = aligned(formData, [
      "lineTitle",
      "lineDescription",
      "lineQuantity",
      "lineUnitAmount",
    ])
      .filter((row): row is [string, string, string, string] => Boolean(row[0]))
      .map(([title, description, quantity, unitAmount]) => ({
        title,
        description: description || null,
        quantity: Number(quantity),
        unitAmount: Number(unitAmount),
      }));
    const components = aligned(formData, ["componentKind", "componentLabel", "componentAmount"])
      .filter((row): row is [string, string, string] => Boolean(row[1]))
      .map(([kind, label, amount]) => ({
        kind,
        label,
        amount: Number(amount),
      }));
    await client.updateAgentDraft(quoteId, {
      currency: required(formData, "currency"),
      assumptions: linesFrom(formData, "assumptions"),
      inclusions: linesFrom(formData, "inclusions"),
      exclusions: linesFrom(formData, "exclusions"),
      terms: required(formData, "terms"),
      internalNotes: optional(formData, "internalNotes"),
      lines,
      components,
      concurrencyToken: required(formData, "concurrencyToken"),
    });
    revalidatePath(`/portal/agent/quotes/${quoteId}`);
    return { message: "Quote draft and deterministic totals updated.", status: "success" };
  } catch (error) {
    return quoteActionError(error, quoteId);
  }
}

export async function sendQuote(
  _state: CustomerActionState,
  formData: FormData,
): Promise<CustomerActionState> {
  const quoteId = required(formData, "quoteId");
  try {
    const client = await authenticatedClient(quoteId);
    await client.sendAgentQuote(quoteId, {
      expiresAtUtc: new Date(required(formData, "expiresAtUtc")).toISOString(),
      concurrencyToken: required(formData, "concurrencyToken"),
    });
    revalidatePath(`/portal/agent/quotes/${quoteId}`);
    redirect(`/portal/agent/quotes/${quoteId}?sent=1`);
  } catch (error) {
    return quoteActionError(error, quoteId);
  }
}

export async function agentQuoteTransition(
  _state: CustomerActionState,
  formData: FormData,
): Promise<CustomerActionState> {
  const quoteId = required(formData, "quoteId");
  const operation = required(formData, "operation");
  try {
    const client = await authenticatedClient(quoteId);
    const concurrencyToken = required(formData, "concurrencyToken");
    if (operation === "revise") {
      await client.reviseAgentQuote(quoteId, concurrencyToken);
    } else if (operation === "withdraw") {
      await client.withdrawAgentQuote(quoteId, concurrencyToken);
    } else {
      return { message: "Unknown quote action.", status: "error" };
    }
    revalidatePath(`/portal/agent/quotes/${quoteId}`);
    redirect(`/portal/agent/quotes/${quoteId}?updated=${operation}`);
  } catch (error) {
    return quoteActionError(error, quoteId);
  }
}

async function authenticatedClient(quoteId: string) {
  const authentication = await requirePortalAuthentication(
    "agent",
    `/portal/agent/quotes/${quoteId}`,
  );
  return getQuoteClient(authentication.accessToken);
}

function quoteActionError(error: unknown, quoteId: string): CustomerActionState {
  if (!(error instanceof QuoteApiError)) throw error;
  if (error.status === 401)
    redirect(`/auth/sign-in?callbackUrl=${encodeURIComponent(`/portal/agent/quotes/${quoteId}`)}`);
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

function aligned(formData: FormData, names: string[]): string[][] {
  const values = names.map((name) =>
    formData.getAll(name).map((value) => (typeof value === "string" ? value.trim() : "")),
  );
  const length = Math.max(0, ...values.map((items) => items.length));
  return Array.from({ length }, (_, index) => values.map((items) => items[index] ?? ""));
}

function linesFrom(formData: FormData, name: string): string[] {
  return required(formData, name)
    .split("\n")
    .map((value) => value.trim())
    .filter(Boolean);
}

function optional(formData: FormData, name: string): string | null {
  return required(formData, name) || null;
}

function required(formData: FormData, name: string): string {
  const value = formData.get(name);
  return typeof value === "string" ? value.trim() : "";
}
