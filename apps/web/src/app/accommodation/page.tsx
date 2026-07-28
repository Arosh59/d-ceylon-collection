import type { Metadata } from "next";

import { PlaceholderPage } from "@/components/ui/placeholder-page";

export const metadata: Metadata = {
  title: "Accommodation",
};

export default function AccommodationPage() {
  return (
    <PlaceholderPage
      description="Distinctive stays with a strong sense of place will become part of the connected catalogue."
      eyebrow="Stay with intention"
      title="Rest somewhere worth remembering."
    />
  );
}
