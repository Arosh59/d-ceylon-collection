import "server-only";

export interface AdminBookingProfile {
  productId: string;
  bookingMode: "instant" | "request";
  pricingUnit: "person" | "group" | "night" | "room";
  timeZone: string;
  meetingPoint: string | null;
  pickupAvailable: boolean;
  pickupInstructions: string | null;
  languages: string[];
  minimumAge: number | null;
  maximumGroupSize: number | null;
  accessibilityInformation: string | null;
  inclusions: string[];
  exclusions: string[];
  whatToBring: string[];
  importantInformation: string[];
  cancellationPolicy: string | null;
  weatherPolicy: string | null;
  instantConfirmation: boolean;
  concurrencyToken: string;
}

export interface AdminExperienceSlot {
  id: string;
  startsAtUtc: string;
  endsAtUtc: string | null;
  capacity: number;
  reservedCapacity: number;
  minimumParticipants: number;
  priceOverride: number | null;
  currency: string;
  status: "open" | "closed";
  bookingCutoffMinutes: number;
  concurrencyToken: string;
}

export interface AdminRoomInventory {
  id: string;
  stayDate: string;
  capacity: number;
  reservedCapacity: number;
  priceOverride: number | null;
  minimumStayNights: number;
  isClosed: boolean;
  concurrencyToken: string;
}

export interface AdminRoomType {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  maximumAdults: number;
  maximumChildren: number;
  roomQuantity: number;
  beds: string | null;
  bathrooms: number;
  amenities: string[];
  mealPlan: string | null;
  basePrice: number;
  currency: string;
  cancellationPolicy: string | null;
  isActive: boolean;
  concurrencyToken: string;
  inventory: AdminRoomInventory[];
}

export interface AdminAvailabilitySummary {
  product: {
    id: string;
    name: string;
    slug: string;
    currency: string;
    productType: { name: string; slug: string };
  };
  profile: AdminBookingProfile | null;
  experienceSlots: AdminExperienceSlot[];
  roomTypes: AdminRoomType[];
}

export async function getAdminAvailability(
  token: string,
  productId: string,
): Promise<AdminAvailabilitySummary> {
  const response = await fetch(
    new URL(`/api/v1/administration/products/${productId}/availability`, apiBaseUrl()),
    {
      cache: "no-store",
      headers: { Accept: "application/json", Authorization: `Bearer ${token}` },
      signal: AbortSignal.timeout(8_000),
    },
  );
  if (!response.ok) {
    const value = (await response.json().catch(() => null)) as {
      detail?: string;
      message?: string;
    } | null;
    throw new Error(
      value?.detail ?? value?.message ?? `Administration API returned HTTP ${response.status}.`,
    );
  }
  return response.json() as Promise<AdminAvailabilitySummary>;
}

function apiBaseUrl(): string {
  const value = process.env.API_BASE_URL?.trim();
  if (!value) throw new Error("API_BASE_URL is required.");
  return value;
}
