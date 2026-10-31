import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  headers() {
    // Inline scripts/styles are required by Next's cached server-rendered shell.
    // Keep this compatible with static rendering; do not pretend it is a nonce CSP.
    const csp = [
      "default-src 'self'", "base-uri 'self'", "object-src 'none'", "frame-ancestors 'none'",
      "form-action 'self'", "img-src 'self' data: blob:", "font-src 'self'",
      "style-src 'self' 'unsafe-inline'", "script-src 'self' 'unsafe-inline'" + (process.env.NODE_ENV === "development" ? " 'unsafe-eval'" : ""),
      "connect-src 'self'" + (process.env.NODE_ENV === "development" ? " ws: wss:" : ""),
      "worker-src 'self' blob:", ...(process.env.NODE_ENV === "production" ? ["upgrade-insecure-requests"] : []),
    ].join("; ");
    return [{ source: "/:path*", headers: [
      { key: "Content-Security-Policy", value: csp },
      { key: "X-Content-Type-Options", value: "nosniff" },
      { key: "X-Frame-Options", value: "DENY" },
      { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
      { key: "Permissions-Policy", value: "camera=(self), microphone=(), geolocation=(), payment=()" },
    ] }, { source: "/reset-password", headers: [{ key: "Referrer-Policy", value: "no-referrer" }, { key: "X-Robots-Tag", value: "noindex, nofollow" }] }];
  },
  cacheComponents: true,
  partialPrefetching: true,
  devIndicators: false,
  // Lets the end-to-end server run beside a normal dev server.
  distDir: process.env.NEXT_DIST_DIR ?? ".next",
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
