import type { CataloguePage } from "@dceylon/sdk";

import { ProductCard } from "./product-card";
import { EmptyState } from "./ui/empty-state";

interface ProductListingProps {
  emptyDescription: string;
  emptyTitle: string;
  products: CataloguePage;
}

export function ProductListing({ emptyDescription, emptyTitle, products }: ProductListingProps) {
  if (products.items.length === 0) {
    return <EmptyState description={emptyDescription} title={emptyTitle} />;
  }

  return (
    <>
      <p className="mb-8 text-sm text-ink-muted">
        Showing {products.items.length} of {products.pagination.totalItems}
      </p>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {products.items.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </>
  );
}
