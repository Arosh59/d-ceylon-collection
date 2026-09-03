import type { MetadataRoute } from "next";

import { getWebEnvironment } from "@/lib/environment";

const routes = [
  "",
  "/catalogue",
  "/collections",
  "/destinations",
  "/experiences",
  "/accommodation",
];

export default function sitemap(): MetadataRoute.Sitemap {
  const { siteUrl } = getWebEnvironment();

  return routes.map((route) => ({
    url: `${siteUrl}${route}`,
    changeFrequency: "weekly",
    priority: route === "" ? 1 : 0.7,
  }));
}
