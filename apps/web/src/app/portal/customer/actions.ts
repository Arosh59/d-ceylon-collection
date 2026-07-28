"use server";

import { CustomerApiError } from "@dceylon/sdk";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { getCustomerClient } from "@/lib/customer";
import { requirePortalAuthentication } from "@/lib/portal-auth";

import type { CustomerActionState } from "./action-state";

export async function saveProfile(
  _state: CustomerActionState,
  formData: FormData,
): Promise<CustomerActionState> {
  const client = await authenticatedClient("/portal/customer/profile");
  const concurrencyToken = text(formData, "concurrencyToken");
  const input = {
    givenName: requiredText(formData, "givenName"),
    familyName: requiredText(formData, "familyName"),
    contactEmail: optionalText(formData, "contactEmail"),
    contactPhone: optionalText(formData, "contactPhone"),
    countryCode: optionalText(formData, "countryCode"),
    preferredLocale: requiredText(formData, "preferredLocale"),
    preferredContactMethod: requiredText(formData, "preferredContactMethod"),
    marketingConsent: formData.get("marketingConsent") === "on",
  };

  try {
    if (concurrencyToken) {
      await client.updateProfile({ ...input, concurrencyToken });
    } else {
      await client.createProfile(input);
    }
    revalidatePath("/portal/customer/profile");
    revalidatePath("/portal/customer");
    return { message: "Your profile was saved.", status: "success" };
  } catch (error) {
    return actionError(error);
  }
}

export async function deleteProfile(formData: FormData): Promise<void> {
  const client = await authenticatedClient("/portal/customer/profile");
  await client.deleteProfile(requiredText(formData, "concurrencyToken"));
  revalidatePath("/portal/customer");
  revalidatePath("/portal/customer/profile");
  redirect("/portal/customer");
}

export async function saveTraveller(
  _state: CustomerActionState,
  formData: FormData,
): Promise<CustomerActionState> {
  const id = text(formData, "id");
  const callback = id
    ? `/portal/customer/travellers/${encodeURIComponent(id)}/edit`
    : "/portal/customer/travellers/new";
  const client = await authenticatedClient(callback);
  const input = {
    givenName: requiredText(formData, "givenName"),
    familyName: requiredText(formData, "familyName"),
    dateOfBirth: optionalText(formData, "dateOfBirth"),
    accessibilityNeeds: optionalText(formData, "accessibilityNeeds"),
    dietaryNeeds: optionalText(formData, "dietaryNeeds"),
    emergencyContactName: optionalText(formData, "emergencyContactName"),
    emergencyContactPhone: optionalText(formData, "emergencyContactPhone"),
  };

  try {
    if (id) {
      await client.updateTraveller(id, {
        ...input,
        concurrencyToken: requiredText(formData, "concurrencyToken"),
      });
    } else {
      await client.createTraveller(input);
    }
  } catch (error) {
    return actionError(error);
  }

  revalidatePath("/portal/customer/travellers");
  redirect("/portal/customer/travellers");
}

export async function deleteTraveller(formData: FormData): Promise<void> {
  const client = await authenticatedClient("/portal/customer/travellers");
  await client.deleteTraveller(
    requiredText(formData, "id"),
    requiredText(formData, "concurrencyToken"),
  );
  revalidatePath("/portal/customer/travellers");
}

export async function saveWishlistEntry(
  _state: CustomerActionState,
  formData: FormData,
): Promise<CustomerActionState> {
  const client = await authenticatedClient("/portal/customer/wishlist");
  const id = text(formData, "id");

  try {
    if (id) {
      await client.updateWishlistEntry(id, {
        note: optionalText(formData, "note"),
        concurrencyToken: requiredText(formData, "concurrencyToken"),
      });
    } else {
      await client.createWishlistEntry({
        productSlug: requiredText(formData, "productSlug"),
        note: optionalText(formData, "note"),
      });
    }
    revalidatePath("/portal/customer/wishlist");
    return {
      message: id ? "Wishlist note updated." : "Experience added to your wishlist.",
      status: "success",
    };
  } catch (error) {
    return actionError(error);
  }
}

export async function deleteWishlistEntry(formData: FormData): Promise<void> {
  const client = await authenticatedClient("/portal/customer/wishlist");
  await client.deleteWishlistEntry(
    requiredText(formData, "id"),
    requiredText(formData, "concurrencyToken"),
  );
  revalidatePath("/portal/customer/wishlist");
}

export async function saveItinerary(
  _state: CustomerActionState,
  formData: FormData,
): Promise<CustomerActionState> {
  const id = text(formData, "id");
  const callback = id
    ? `/portal/customer/saved-itineraries/${encodeURIComponent(id)}/edit`
    : "/portal/customer/saved-itineraries/new";
  const client = await authenticatedClient(callback);
  const input = {
    title: requiredText(formData, "title"),
    summary: optionalText(formData, "summary"),
    travelStartDate: optionalText(formData, "travelStartDate"),
    travelEndDate: optionalText(formData, "travelEndDate"),
    primaryDestinationSlug: optionalText(formData, "primaryDestinationSlug"),
  };

  try {
    if (id) {
      await client.updateSavedItinerary(id, {
        ...input,
        concurrencyToken: requiredText(formData, "concurrencyToken"),
      });
    } else {
      await client.createSavedItinerary(input);
    }
  } catch (error) {
    return actionError(error);
  }

  revalidatePath("/portal/customer/saved-itineraries");
  redirect("/portal/customer/saved-itineraries");
}

export async function deleteItinerary(formData: FormData): Promise<void> {
  const client = await authenticatedClient("/portal/customer/saved-itineraries");
  await client.deleteSavedItinerary(
    requiredText(formData, "id"),
    requiredText(formData, "concurrencyToken"),
  );
  revalidatePath("/portal/customer/saved-itineraries");
}

async function authenticatedClient(callbackUrl: string) {
  const authentication = await requirePortalAuthentication("customer", callbackUrl);
  return getCustomerClient(authentication.accessToken);
}

function actionError(error: unknown): CustomerActionState {
  if (!(error instanceof CustomerApiError)) {
    throw error;
  }
  if (error.status === 401) {
    redirect("/auth/sign-in?callbackUrl=%2Fportal%2Fcustomer");
  }
  if (error.status === 403) {
    redirect("/auth/forbidden");
  }
  return {
    ...(error.validationErrors ? { errors: error.validationErrors } : {}),
    message:
      error.status === 409
        ? "This record changed or already exists. Reload the latest information and try again."
        : error.message,
    status: error.status === 409 ? "conflict" : "error",
  };
}

function requiredText(formData: FormData, name: string): string {
  return text(formData, name).trim();
}

function optionalText(formData: FormData, name: string): string | null {
  return text(formData, name).trim() || null;
}

function text(formData: FormData, name: string): string {
  const value = formData.get(name);
  return typeof value === "string" ? value : "";
}
