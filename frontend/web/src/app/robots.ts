import type { MetadataRoute } from "next";

import { getWebEnvironment } from "@/lib/environment";

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
