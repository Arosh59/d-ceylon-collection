import "server-only";

export interface ContactContent {
  email: string;
  phone: string;
  eyebrow: string;
  heading: string;
  description: string;
  promise: string;
}

const fallback: ContactContent = {
  email: "hello@dceyloncollection.com",
  phone: "",
  eyebrow: "Contact D Ceylon",
  heading: "Tell us what you’re hoping to find.",
  description:
    "A place, a feeling, or a first question is enough. We’ll help you find a considered way into Sri Lanka.",
  promise: "We’ll reply with a human point of view, not a packed itinerary or a hard sell.",
};

export async function getContactContent(): Promise<ContactContent> {
  const baseUrl = process.env.API_BASE_URL?.trim();
  if (!baseUrl) return fallback;
  try {
    const response = await fetch(new URL("/api/v1/editorial/site/contact", baseUrl), {
      cache: "no-store",
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(5_000),
    });
    if (!response.ok) return fallback;
    const value = (await response.json()) as Partial<ContactContent>;
    return {
      email: value.email?.trim() || fallback.email,
      phone: value.phone?.trim() || "",
      eyebrow: value.eyebrow?.trim() || fallback.eyebrow,
      heading: value.heading?.trim() || fallback.heading,
      description: value.description?.trim() || fallback.description,
      promise: value.promise?.trim() || fallback.promise,
    };
  } catch {
    return fallback;
  }
}
