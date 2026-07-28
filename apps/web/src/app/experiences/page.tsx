import type { Metadata } from "next";

import { ProductTypePage } from "@/components/product-type-page";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Experiences",
};

export default function ExperiencesPage() {
  return (
    <ProductTypePage
      description="Small-scale, locally hosted encounters shaped by culture, landscape, food, and wellbeing."
      eyebrow="Time well spent"
      productType="experience"
      title="Experiences that bring the island closer."
    />
  );
}
