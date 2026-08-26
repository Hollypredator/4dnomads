import { createClient } from "@/utils/supabase/server";
import { unwrap, unwrapList } from "@/lib/errors";
import { mapProfileRow, mapHomeRow, mapReviewRow } from "@/lib/data/mappers";
import type { HostProfile } from "@/types";

const PROFILE_COLUMNS =
  "id, first_name, last_name, email, avatar_url, bio, languages, interests, is_verified, is_banned, created_at";

const HOME_COLUMNS =
  "id, host_id, sleeping_arrangement, max_guests, house_rules, location_name, approx_lat, approx_lng, smoking_policy, pets_info, amenities, hosting_status, gender_preference, kid_friendly, wheelchair_accessible, blockout_dates";

export async function getUserById(id: string) {
  const supabase = await createClient();
  const result = await supabase.from("profiles").select(PROFILE_COLUMNS).eq("id", id).maybeSingle();
  if (!result.data) return null;
  return mapProfileRow(unwrap(result, { op: "getUserById", args: { id } }));
}

/** Replaces mock-data.ts getHostProfile(). Reviews are the RLS-visible set only (decision 7). */
export async function getHostProfile(userId: string): Promise<HostProfile | null> {
  const supabase = await createClient();

  const profileResult = await supabase
    .from("profiles")
    .select(PROFILE_COLUMNS)
    .eq("id", userId)
    .is("deleted_at", null)
    .maybeSingle();

  if (!profileResult.data) return null;
  const profile = mapProfileRow(unwrap(profileResult, { op: "getHostProfile.profile", args: { userId } }));
  if (profile.isBanned) return null;

  const [homeResult, reviewsResult] = await Promise.all([
    supabase.from("homes").select(HOME_COLUMNS).eq("host_id", userId).maybeSingle(),
    supabase.from("reviews").select("*").eq("target_id", userId),
  ]);

  const home = homeResult.data ? mapHomeRow(homeResult.data) : null;
  const reviews = unwrapList(reviewsResult, { op: "getHostProfile.reviews", args: { userId } }).map(mapReviewRow);
  const averageRating =
    reviews.length > 0 ? Math.round((reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length) * 10) / 10 : 0;

  return {
    ...profile,
    home,
    reviews,
    reviewCount: reviews.length,
    averageRating,
    responseRate: 95, // TODO: derive from stay_requests response latency once there is real traffic to measure
  };
}

/**
 * Replaces mock-data.ts getAllHosts(). Bounded by PostGIS radius search
 * (T19) -- no longer fetches every host on earth. Batches the host/review
 * joins into 3 queries total regardless of page size, rather than fanning
 * out one getHostProfile() call per host (Section 7's N+1 finding).
 */
export async function getAllHosts(opts: { lat?: number; lng?: number; radiusMeters?: number; limit?: number; offset?: number } = {}) {
  const supabase = await createClient();
  const { lat, lng, radiusMeters = 50_000, limit = 30, offset = 0 } = opts;

  const homesResult =
    lat === undefined || lng === undefined
      ? await supabase.from("homes").select(HOME_COLUMNS).order("created_at", { ascending: false }).range(offset, offset + limit - 1)
      : await supabase.rpc("homes_near", { p_lat: lat, p_lng: lng, p_radius_meters: radiusMeters, p_limit: limit, p_offset: offset });

  const homes = unwrapList<Record<string, unknown>>(homesResult, { op: "getAllHosts", args: opts }).map(mapHomeRow);
  if (homes.length === 0) return [];

  const hostIds = homes.map((h) => h.hostId);

  const [profilesResult, reviewsResult] = await Promise.all([
    supabase.from("profiles").select(PROFILE_COLUMNS).in("id", hostIds).is("deleted_at", null),
    supabase.from("reviews").select("*").in("target_id", hostIds),
  ]);

  const profiles = unwrapList(profilesResult, { op: "getAllHosts.profiles" }).map(mapProfileRow);
  const reviews = unwrapList(reviewsResult, { op: "getAllHosts.reviews" }).map(mapReviewRow);

  const profileById = new Map(profiles.map((p) => [p.id, p]));
  const homeByHostId = new Map(homes.map((h) => [h.hostId, h]));

  const results: HostProfile[] = [];
  for (const hostId of hostIds) {
    const profile = profileById.get(hostId);
    if (!profile || profile.isBanned) continue;
    const hostReviews = reviews.filter((r) => r.targetId === hostId);
    const averageRating =
      hostReviews.length > 0 ? Math.round((hostReviews.reduce((s, r) => s + r.rating, 0) / hostReviews.length) * 10) / 10 : 0;
    results.push({
      ...profile,
      home: homeByHostId.get(hostId) ?? null,
      reviews: hostReviews,
      reviewCount: hostReviews.length,
      averageRating,
      responseRate: 95,
    });
  }
  return results;
}
