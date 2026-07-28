import type { Metadata } from "next";

import { PlaceholderPage } from "@/components/ui/placeholder-page";

export const metadata: Metadata = {
  title: "Collections",
};

export default function CollectionsPage() {
  return (
    <PlaceholderPage
      description="Five perspectives—Root, Flow, Awaken, Breathe, and Rediscover—will soon connect the island's places and experiences."
      eyebrow="Five ways to travel"
      title="Begin with how you want to feel."
    />
  );
}
