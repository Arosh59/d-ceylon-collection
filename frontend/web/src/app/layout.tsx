import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";

import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { TripConcierge } from "@/components/trip-concierge";
import { getWebEnvironment } from "@/lib/environment";

import "./globals.css";

export function generateMetadata(): Metadata {
  const { siteUrl } = getWebEnvironment();

  return {
    metadataBase: new URL(siteUrl),
    title: {
      default: "D Ceylon Collection | Discover Ceylon",
      template: "%s | D Ceylon Collection",
    },
    description:
      "Premium, thoughtful journeys through Sri Lanka, shaped with local perspective and room to rediscover yourself.",
    applicationName: "D Ceylon Collection",
    openGraph: {
      type: "website",
      locale: "en_LK",
      siteName: "D Ceylon Collection",
      title: "Discover Ceylon. Rediscover Yourself.",
      description: "Thoughtful Sri Lankan journeys with a distinctly local point of view.",
    },
    robots: {
      index: true,
      follow: true,
    },
  };
}

export const viewport: Viewport = {
  colorScheme: "light",
  themeColor: "#0E2342",
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <a
          className="fixed top-3 left-3 z-50 -translate-y-24 rounded-full bg-gold px-5 py-3 font-semibold text-navy transition-transform focus:translate-y-0"
          href="#main-content"
        >
          Skip to main content
        </a>
        <SiteHeader />
        {children}
        <SiteFooter />
        <TripConcierge />
      </body>
    </html>
  );
}
