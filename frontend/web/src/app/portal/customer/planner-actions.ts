"use server";

import { TravelPlanningApiError } from "@dceylon/sdk";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { getTravelPlanningClient } from "@/lib/travel-planning";
import { requirePortalAuthentication } from "@/lib/portal-auth";

import type { CustomerActionState } from "./action-state";

export async function saveTravelPlan(
  _state: CustomerActionState,
  formData: FormData,
): Promise<CustomerActionState> {
  const id = text(formData, "id");
  const client = await authenticatedClient(
    id ? `/portal/customer/travel-plans/${id}/edit` : "/portal/customer/travel-plans/new",
  );
  const input = {
    title: required(formData, "title"),
    savedItineraryId: optional(formData, "savedItineraryId"),
    travelStartDate: required(formData, "travelStartDate"),
    travelEndDate: required(formData, "travelEndDate"),
    pace: required(formData, "pace"),
    destinationSlugs: values(formData, "destinationSlugs"),
    travellerIds: formData
      .getAll("travellerIds")
      .filter((value): value is string => typeof value === "string" && value.length > 0),
    interests: values(formData, "interests"),
    productTypeSlugs: values(formData, "productTypeSlugs"),
    categorySlugs: values(formData, "categorySlugs"),
    tagSlugs: values(formData, "tagSlugs"),
    accessibilityConsiderations: optional(formData, "accessibilityConsiderations"),
    dietaryConsiderations: optional(formData, "dietaryConsiderations"),
  };

  try {
    if (id) {
      await client.updateInput(id, {
        ...input,
        concurrencyToken: required(formData, "concurrencyToken"),
      });
      revalidatePath(`/portal/customer/travel-plans/${id}`);
      redirect(`/portal/customer/travel-plans/${id}`);
    }
    const plan = await client.createPlan(input);
    revalidatePath("/portal/customer/travel-plans");
    redirect(`/portal/customer/travel-plans/${plan.id}`);
  } catch (error) {
    return actionError(error);
  }
}

export async function regenerateTravelPlan(
  _state: CustomerActionState,
  formData: FormData,
): Promise<CustomerActionState> {
  const id = required(formData, "id");
  try {
    const client = await authenticatedClient(`/portal/customer/travel-plans/${id}`);
    await client.generate(id, required(formData, "concurrencyToken"));
    revalidatePath(`/portal/customer/travel-plans/${id}`);
    redirect(`/portal/customer/travel-plans/${id}?regenerated=1`);
  } catch (error) {
    return actionError(error);
  }
}

export async function updateItineraryDay(
  _state: CustomerActionState,
  formData: FormData,
): Promise<CustomerActionState> {
  const id = required(formData, "id");
  try {
    const client = await authenticatedClient(`/portal/customer/travel-plans/${id}`);
    await client.updateDay(id, required(formData, "dayId"), {
      title: required(formData, "title"),
      concurrencyToken: required(formData, "concurrencyToken"),
    });
    revalidatePath(`/portal/customer/travel-plans/${id}`);
    return { message: "Day title updated.", status: "success" };
  } catch (error) {
    return actionError(error);
  }
}

export async function saveItineraryItem(
  _state: CustomerActionState,
  formData: FormData,
): Promise<CustomerActionState> {
  const id = required(formData, "id");
  const itemId = text(formData, "itemId");
  const input = {
    title: required(formData, "title"),
    notes: optional(formData, "notes"),
    durationMinutes: numberOrNull(formData, "durationMinutes"),
    destinationSlug: required(formData, "destinationSlug"),
    position: numberOrNull(formData, "position"),
  };
  try {
    const client = await authenticatedClient(`/portal/customer/travel-plans/${id}`);
    if (itemId) {
      await client.updateItem(id, itemId, {
        ...input,
        concurrencyToken: required(formData, "concurrencyToken"),
      });
    } else {
      await client.createItem(id, required(formData, "dayId"), input);
    }
    revalidatePath(`/portal/customer/travel-plans/${id}`);
    return { message: itemId ? "Draft item updated." : "Draft item added.", status: "success" };
  } catch (error) {
    return actionError(error);
  }
}

export async function reorderItineraryItem(
  _state: CustomerActionState,
  formData: FormData,
): Promise<CustomerActionState> {
  const id = required(formData, "id");
  try {
    const client = await authenticatedClient(`/portal/customer/travel-plans/${id}`);
    await client.reorderItem(id, required(formData, "itemId"), {
      targetDayId: required(formData, "targetDayId"),
      position: Number(required(formData, "position")),
      concurrencyToken: required(formData, "concurrencyToken"),
    });
    revalidatePath(`/portal/customer/travel-plans/${id}`);
    return { message: "Draft item reordered.", status: "success" };
  } catch (error) {
    return actionError(error);
  }
}

async function authenticatedClient(callbackUrl: string) {
  const auth = await requirePortalAuthentication("customer", callbackUrl);
  return getTravelPlanningClient(auth.accessToken);
}

function actionError(error: unknown): CustomerActionState {
  if (!(error instanceof TravelPlanningApiError)) throw error;
  if (error.status === 401) redirect("/auth/sign-in?callbackUrl=%2Fportal%2Fcustomer");
  if (error.status === 403) redirect("/auth/forbidden");
  return {
    ...(error.validationErrors ? { errors: error.validationErrors } : {}),
    message:
      error.status === 409
        ? "This draft changed in another request. Reload it before trying again."
        : error.message,
    status: error.status === 409 ? "conflict" : "error",
  };
}

function values(formData: FormData, name: string): string[] {
  return required(formData, name)
    .split(",")
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean);
}

function numberOrNull(formData: FormData, name: string): number | null {
  const value = text(formData, name);
  return value ? Number(value) : null;
}

function optional(formData: FormData, name: string): string | null {
  return text(formData, name).trim() || null;
}

function required(formData: FormData, name: string): string {
  return text(formData, name).trim();
}

function text(formData: FormData, name: string): string {
  const value = formData.get(name);
  return typeof value === "string" ? value : "";
}
