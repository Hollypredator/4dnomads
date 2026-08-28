import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      {
        // www and the apex both resolve and both served the app, so a session
        // started on one host was invisible to the other -- auth cookies are
        // host-scoped. Collapsing onto the apex keeps one session, and matches
        // the site_url that confirmation-email links are built from.
        source: "/:path*",
        has: [{ type: "host", value: "www.4dnomads.com.tr" }],
        destination: "https://4dnomads.com.tr/:path*",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
