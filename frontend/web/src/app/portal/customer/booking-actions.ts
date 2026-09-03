"use server";

import { BookingApiError } from "@dceylon/sdk";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { getBookingClient } from "@/lib/bookings";
import { requirePortalAuthentication } from "@/lib/portal-auth";

import type { CustomerActionState } from "./action-state";

export async function createBooking(
  _state: CustomerActionState,
  formData: FormData,
): Promise<CustomerActionState> {
  const quoteId = required(formData, "quoteId");
  try {
    const authentication = await requirePortalAuthentication(
      "customer",
      `/portal/customer/quotes/${quoteId}`,
    );
    const booking = await (
      await getBookingClient(authentication.accessToken)
    ).createCustomerBooking({
      quoteId,
      quoteVersionId: required(formData, "quoteVersionId"),
      customerNotes: optional(formData, "customerNotes"),
    });
    revalidatePath("/portal/customer/bookings");
    redirect(`/portal/customer/bookings/${booking.id}?created=1`);
  } catch (error) {
    return bookingActionError(error, `/portal/customer/quotes/${quoteId}`);
  }
}

export async function createPayment(
  _state: CustomerActionState,
  formData: FormData,
): Promise<CustomerActionState> {
  const bookingId = required(formData, "bookingId");
  try {
    const authentication = await requirePortalAuthentication(
      "customer",
      `/portal/customer/bookings/${bookingId}`,
    );
    await (
      await getBookingClient(authentication.accessToken)
    ).createCustomerPayment(bookingId, {
      gateway: required(formData, "gateway"),
      idempotencyKey: crypto.randomUUID().replaceAll("-", ""),
      kind: required(formData, "kind"),
    });
    revalidatePath(`/portal/customer/bookings/${bookingId}`);
    redirect(`/portal/customer/bookings/${bookingId}?payment=created`);
  } catch (error) {
    return bookingActionError(error, `/portal/customer/bookings/${bookingId}`);
  }
}

function bookingActionError(error: unknown, callbackUrl: string): CustomerActionState {
  if (!(error instanceof BookingApiError)) throw error;
  if (error.status === 401)
    redirect(`/auth/sign-in?callbackUrl=${encodeURIComponent(callbackUrl)}`);
  if (error.status === 403) redirect("/auth/forbidden");
  return {
    ...(error.validationErrors ? { errors: error.validationErrors } : {}),
    message:
      error.status === 409
        ? "This record changed or the requested payment/booking action is no longer allowed. Reload and retry."
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
