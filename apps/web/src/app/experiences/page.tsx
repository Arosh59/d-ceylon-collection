import type { Metadata } from "next";

import { PlaceholderPage } from "@/components/ui/placeholder-page";

export const metadata: Metadata = {
  title: "Experiences",
};

export default function ExperiencesPage() {
  return (
    <PlaceholderPage
      description="Meaningful encounters with culture, nature, food, craft, and adventure will be curated here."
      eyebrow="Make it memorable"
      title="Move beyond seeing. Begin experiencing."
    />
  );
}
