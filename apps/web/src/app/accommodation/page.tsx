import type { Metadata } from "next";

import { ProductTypePage } from "@/components/product-type-page";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Accommodation",
};

export default function AccommodationPage() {
  return (
    <ProductTypePage
      description="A considered set of smaller stays with a strong relationship to landscape, local hosting, and pace."
      eyebrow="Stay with intention"
      productType="accommodation"
      title="Places that make room for the journey."
    />
  );
}
