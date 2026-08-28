import "server-only";

/**
 * Canonical site URL, used everywhere SEO metadata needs an absolute origin
 * (sitemap, robots, canonical/OpenGraph tags, JSON-LD). Centralized here
 * rather than hardcoded per-file so that adding the planned .com domain, or
 * switching which one is canonical, is a one-line env var change rather than
 * a grep across every metadata export in the app.
 *
 * Falls back to the current .com.tr domain for local dev / any environment
 * that hasn't set NEXT_PUBLIC_SITE_URL yet, so nothing breaks before the env
 * var is configured on Vercel.
 */
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://4dnomads.com.tr").replace(/\/$/, "");

export const SITE_NAME = "4dnomads";
