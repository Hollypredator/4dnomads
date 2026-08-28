import type { MetadataRoute } from "next";

/**
 * Web app manifest. Serves two jobs: it makes the site installable straight
 * from the browser, and it is the same icon/name/theme source the Capacitor
 * native shells are generated from (see capacitor.config.ts), so the store
 * build and the installable web app never drift apart.
 *
 * Icons are produced by `node scripts/generate-icons.mjs`.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "4dnomads",
    short_name: "4dnomads",
    description:
      "Stay with locals, belong anywhere. A free hospitality exchange for travelers and hosts.",
    start_url: "/",
    // "standalone" is what removes browser chrome once installed -- without
    // it the installed app still renders an address bar and reads as a site.
    display: "standalone",
    orientation: "portrait",
    background_color: "#f7f9ff",
    theme_color: "#b22c00",
    categories: ["travel", "social", "lifestyle"],
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      // A separate padded asset: an "any" icon cropped by Android's mask
      // would lose the outer nodes of the mark.
      { src: "/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
