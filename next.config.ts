import type { NextConfig } from "next";

const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
];

const nextConfig: NextConfig = {
  // Classic dynamic rendering: pages that read the database or cookies render per request.
  cacheComponents: false,
  poweredByHeader: false,
  // Illustrative stock photos (labelled as such on the page).
  images: { remotePatterns: [{ protocol: "https", hostname: "images.unsplash.com", pathname: "/photo-*" }] },
  serverExternalPackages: ["pdfkit", "exceljs", "pg"],
  // Serverless hosts (Vercel) bundle only traced files: the PDF renderer reads these at runtime.
  outputFileTracingIncludes: {
    "/**": ["./src/fonts/pdf/**", "./public/img/logo.png"],
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  experimental: {
    serverActions: { bodySizeLimit: "12mb" },
  },
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
