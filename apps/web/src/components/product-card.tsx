import type { ProductSummary } from "@dceylon/sdk";
import Link from "next/link";

import { formatStartingPrice } from "@/lib/format-price";

interface ProductCardProps {
  product: ProductSummary;
}

export function ProductCard({ product }: ProductCardProps) {
  return (
    <article className="group relative flex h-full flex-col overflow-hidden rounded-[1.75rem] border border-navy/8 bg-white shadow-soft">
      <div
        aria-hidden="true"
        className="aspect-[4/3] bg-[radial-gradient(circle_at_75%_20%,rgba(200,164,93,0.34),transparent_35%),linear-gradient(145deg,#17365d,#0e2342)]"
      />
      <div className="flex flex-1 flex-col p-6">
        <p className="text-xs font-semibold tracking-[0.16em] text-gold-dark uppercase">
          {product.productType.name}
        </p>
        <h2 className="mt-3 text-2xl">
          <Link
            className="before:absolute before:inset-0 focus-visible:outline-offset-4"
            href={`/catalogue/${product.slug}`}
          >
            {product.name}
          </Link>
        </h2>
        <p className="mt-4 line-clamp-3 leading-7 text-ink-muted">{product.shortDescription}</p>
        <p className="mt-auto pt-6 text-sm font-semibold text-navy">
          {formatStartingPrice(product.startingPrice, product.currency)}
        </p>
      </div>
    </article>
  );
}
