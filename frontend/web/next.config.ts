import type { NextConfig } from "next";
import path from "node:path";

const developmentScriptSource = process.env.NODE_ENV === "development" ? " 'unsafe-eval'" : "";

const contentSecurityPolicy = [
  "default-src 'self'",
  "base-uri 'self'",
  "connect-src 'self' https://maps.googleapis.com https://maps.gstatic.com https://maps.google.com",
  "font-src 'self' data: https://fonts.gstatic.com",
  "form-action 'self'",
  "frame-ancestors 'none'",
  "img-src 'self' data: https://maps.googleapis.com https://maps.gstatic.com https://maps.google.com",
  "object-src 'none'",
  `script-src 'self' 'unsafe-inline' https://maps.googleapis.com https://maps.gstatic.com${developmentScriptSource}`,
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
].join("; ");

const securityHeaders = [
  {
    key: "Content-Security-Policy",
    value: contentSecurityPolicy,
  },
  {
    key: "Permissions-Policy",
    value: "camera=(), geolocation=(), microphone=()",
  },
  {
    key: "Referrer-Policy",
    value: "strict-origin-when-cross-origin",
  },
  {
    key: "X-Content-Type-Options",
    value: "nosniff",
  },
  {
    key: "X-Frame-Options",
    value: "DENY",
  },
];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  reactStrictMode: true,
  transpilePackages: ["@dceylon/sdk"],
  turbopack: {
    root: path.resolve(import.meta.dirname, "../.."),
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
