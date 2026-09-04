import { getCatalogueClient } from "@/lib/catalogue";

import { ProductListing } from "./product-listing";
import { Container } from "./ui/container";

interface ProductTypePageProps {
  description: string;
  eyebrow: string;
  productType: string;
  title: string;
}

export async function ProductTypePage({
  description,
  eyebrow,
  productType,
  title,
}: ProductTypePageProps) {
  const catalogue = await getCatalogueClient();
  const products = await catalogue.getProducts({ productType, pageSize: 12 });

  return (
    <main id="main-content">
      <section className="page-hero">
        <Container>
          <p className="eyebrow text-gold-light">{eyebrow}</p>
          <h1 className="mt-5 max-w-4xl text-5xl text-white sm:text-7xl">{title}</h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-white/72">{description}</p>
        </Container>
      </section>
      <Container className="py-12 sm:py-20">
        <ProductListing
          emptyDescription="No published catalogue entries currently match this product type."
          emptyTitle={`No ${productType} entries are available yet.`}
          products={products}
        />
      </Container>
    </main>
  );
}
