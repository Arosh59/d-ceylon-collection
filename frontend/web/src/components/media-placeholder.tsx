import type { CollectionSummary, DestinationSummary, ProductSummary } from "@dceylon/sdk";
import Image from "next/image";

type Media = NonNullable<
  ProductSummary["primaryMedia"] | CollectionSummary["heroMedia"] | DestinationSummary["heroMedia"]
>;

interface MediaPlaceholderProps {
  className?: string;
  media?: Media | null;
}

const destinationImageByAssetKey: Record<string, string> = {
  "placeholder:colombo": "/images/destinations/colombo-provided.jpg",
  "placeholder:ella": "/images/destinations/ella-provided.jpg",
  "placeholder:galle": "/images/destinations/galle-provided.png",
  "placeholder:kandy": "/images/destinations/kandy-provided.jpg",
  "placeholder:sigiriya": "/images/destinations/sigiriya-provided.jpg",
  "placeholder:tangalle": "/images/destinations/tangalle-provided.jpg",
};

export function MediaPlaceholder({ className = "", media }: MediaPlaceholderProps) {
  const image = media ? destinationImageByAssetKey[media.assetKey] : undefined;

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
