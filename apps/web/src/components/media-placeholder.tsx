import type { CollectionSummary, DestinationSummary, ProductSummary } from "@dceylon/sdk";

type Media = NonNullable<
  ProductSummary["primaryMedia"] | CollectionSummary["heroMedia"] | DestinationSummary["heroMedia"]
>;

interface MediaPlaceholderProps {
  className?: string;
  media?: Media | null;
}

export function MediaPlaceholder({ className = "", media }: MediaPlaceholderProps) {
  return (
    <div
      aria-label={media?.altText ?? "Editorial image placeholder"}
      className={`media-placeholder ${className}`}
      data-asset-key={media?.assetKey ?? "placeholder:unavailable"}
      role="img"
    >
      <span aria-hidden="true">D Ceylon Collection</span>
    </div>
  );
}
