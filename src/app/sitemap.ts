import type { MetadataRoute } from "next";
import { createClient } from "@/utils/supabase/server";
import { SITE_URL } from "@/lib/site";

const STATIC_ROUTES: { path: string; priority: number; changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"] }[] = [
  { path: "/", priority: 1, changeFrequency: "daily" },
  { path: "/explore", priority: 0.9, changeFrequency: "hourly" },
  { path: "/community", priority: 0.8, changeFrequency: "hourly" },
  { path: "/community/forum", priority: 0.7, changeFrequency: "hourly" },
  { path: "/events", priority: 0.7, changeFrequency: "hourly" },
  { path: "/public-trips", priority: 0.6, changeFrequency: "hourly" },
  { path: "/donate", priority: 0.3, changeFrequency: "monthly" },
];

/**
 * Dynamic sitemap: static routes plus every real, public host profile,
 * forum topic and event. Login/register/dashboard/messages/admin and
 * anything behind a session are deliberately excluded -- see robots.ts,
 * which disallows the same set explicitly rather than relying on a page
 * simply not being listed here (omission is not the same as disallowal).
 *
 * Queries select only the id + timestamp each route needs, not the full
 * joined objects the page components themselves fetch (getAllHosts, for
 * instance, also joins homes and reviews) -- a sitemap has no use for that
 * and it would be a needless amount of data to pull on every crawl.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const supabase = await createClient();

  const [profiles, topics, events] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, updated_at")
      .is("deleted_at", null)
      .eq("is_banned", false)
      .order("updated_at", { ascending: false })
      .limit(5000),
    supabase.from("forum_topics").select("id, created_at").order("created_at", { ascending: false }).limit(5000),
    supabase.from("local_events").select("id, created_at").order("created_at", { ascending: false }).limit(5000),
  ]);

  const entries: MetadataRoute.Sitemap = STATIC_ROUTES.map((r) => ({
    url: `${SITE_URL}${r.path}`,
    changeFrequency: r.changeFrequency,
    priority: r.priority,
  }));

  for (const p of profiles.data ?? []) {
    entries.push({
      url: `${SITE_URL}/profile/${p.id}`,
      lastModified: p.updated_at ?? undefined,
      changeFrequency: "weekly",
      priority: 0.6,
    });
  }

  for (const t of topics.data ?? []) {
    entries.push({
      url: `${SITE_URL}/community/forum/${t.id}`,
      lastModified: t.created_at ?? undefined,
      changeFrequency: "weekly",
      priority: 0.5,
    });
  }

  for (const e of events.data ?? []) {
    entries.push({
      url: `${SITE_URL}/events/${e.id}`,
      lastModified: e.created_at ?? undefined,
      changeFrequency: "weekly",
      priority: 0.5,
    });
  }

  return entries;
}
