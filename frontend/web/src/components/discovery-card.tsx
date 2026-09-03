import type { CollectionSummary, DestinationSummary } from "@dceylon/sdk";
import Link from "next/link";

import { MediaPlaceholder } from "./media-placeholder";

interface DiscoveryCardProps {
  href: string;
  item: CollectionSummary | DestinationSummary;
}

export function DiscoveryCard({ href, item }: DiscoveryCardProps) {
  return (
    <article className="group relative overflow-hidden rounded-[1.75rem] border border-navy/8 bg-white shadow-soft">
      <MediaPlaceholder className="aspect-[8/5]" media={item.heroMedia} />
      <div className="p-7">
        <h2 className="text-3xl">
          <Link
            className="before:absolute before:inset-0 focus-visible:outline-offset-4"
            href={href}
          >
            {item.name}
          </Link>
        </h2>
        <p className="mt-4 leading-7 text-ink-muted">{item.summary}</p>
      </div>
    </article>
  );
}
