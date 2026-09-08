import type { CollectionSummary, DestinationSummary, ProductSummary } from "@dceylon/sdk";
import Image from "next/image";

import { destinationImageUrl } from "@/lib/destination-media";

type Media = NonNullable<
  ProductSummary["primaryMedia"] | CollectionSummary["heroMedia"] | DestinationSummary["heroMedia"]
>;

interface MediaPlaceholderProps {
  className?: string;
  media?: Media | null;
}

export function MediaPlaceholder({ className = "", media }: MediaPlaceholderProps) {
  const image = destinationImageUrl(media?.assetKey);

  if (image && media) {
    return (
      <div
        className={`relative overflow-hidden bg-mist ${className}`}
        data-asset-key={media.assetKey}
      >
        <Image
          alt={media.altText}
          className="object-cover"
          fill
          sizes="(min-width: 1024px) 33vw, 100vw"
          src={image}
        />
      </div>
    );
  }

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
