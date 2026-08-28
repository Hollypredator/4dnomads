import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

/**
 * Everything behind requireSession() (dashboard, messages, profile/edit,
 * onboarding), the moderator-only admin panel, and the OAuth callback route
 * are disallowed explicitly here rather than left to "a crawler won't find
 * a link to it" -- omission from the sitemap is not the same guarantee as an
 * explicit disallow, and several of these (messages, dashboard) are exactly
 * the kind of authenticated app screen that provides zero value indexed and
 * that a crawler could still reach via a stray external link.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/dashboard",
        "/messages",
        "/onboarding",
        "/profile/edit",
        "/profile/edit/*",
        "/admin",
        "/admin/*",
        "/auth/*",
        "/api/*",
      ],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
