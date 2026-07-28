import type { Metadata } from "next";

import { PlaceholderPage } from "@/components/ui/placeholder-page";

export const metadata: Metadata = {
  title: "Destinations",
};

export default function DestinationsPage() {
  return (
    <PlaceholderPage
      description="Coast, highlands, ancient cities, and living landscapes will form an accessible destination guide in the next phase."
      eyebrow="Across the island"
      title="Every landscape holds a different story."
    />
  );
}
