import type { MetadataRoute } from "next";

import { getWebEnvironment } from "@/lib/environment";

export const dynamic = "force-dynamic";

export default function robots(): MetadataRoute.Robots {
  const { siteUrl } = getWebEnvironment();

  return {
    rules: {
      userAgent: "*",
      allow: "/",
    },
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
