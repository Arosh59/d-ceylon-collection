const destinationImageByAssetKey: Readonly<Record<string, string>> = {
  "placeholder:colombo": "/images/destinations/colombo-provided.jpg",
  "placeholder:ella": "/images/destinations/ella-provided.jpg",
  "placeholder:galle": "/images/destinations/galle-provided.png",
  "placeholder:kandy": "/images/destinations/kandy-provided.jpg",
  "placeholder:sigiriya": "/images/destinations/sigiriya-provided.jpg",
  "placeholder:tangalle": "/images/destinations/tangalle-provided.jpg",
};

export function destinationImageUrl(assetKey: string | null | undefined): string | undefined {
  return assetKey ? destinationImageByAssetKey[assetKey] : undefined;
}
