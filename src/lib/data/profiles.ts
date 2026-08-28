import { cache } from "react";
import { createClient } from "@/utils/supabase/server";
import { unwrap, unwrapList, unwrapMaybe } from "@/lib/errors";
import { mapProfileRow, mapHomeRow, mapReviewRow } from "@/lib/data/mappers";
import type { HostProfile, User } from "@/types";

const PROFILE_COLUMNS =
  "id, first_name, last_name, email, avatar_url, bio, languages, interests, is_verified, is_banned, created_at";

const HOME_COLUMNS =
  "id, host_id, sleeping_arrangement, max_guests, house_rules, location_name, approx_lat, approx_lng, smoking_policy, pets_info, amenities, hosting_status, gender_preference, kid_friendly, wheelchair_accessible, blockout_dates, wifi_mbps";

export const getUserById = cache(async (id: string) => {
  const supabase = await createClient();
  const result = await supabase.from("profiles").select(PROFILE_COLUMNS).eq("id", id).maybeSingle();
  const row = unwrapMaybe(result, { op: "getUserById", args: { id } });
  return row ? mapProfileRow(row) : null;
});

/** For a set of ids in one request (e.g. an event's RSVP list) -- one query instead of N getUserById() calls. */
export async function getAttendeeProfiles(ids: string[]): Promise<User[]> {
  if (ids.length === 0) return [];
  const supabase = await createClient();
  const result = await supabase.from("profiles").select(PROFILE_COLUMNS).in("id", ids);
  return unwrapList(result, { op: "getAttendeeProfiles", args: { ids } }).map(mapProfileRow);
}

/** Replaces mock-data.ts getHostProfile(). Reviews are the RLS-visible set only (decision 7). */
export const getHostProfile = cache(async (userId: string): Promise<HostProfile | null> => {
  const supabase = await createClient();

  const profileResult = await supabase
    .from("profiles")
    .select(PROFILE_COLUMNS)
    .eq("id", userId)
    .is("deleted_at", null)
    .maybeSingle();

  const profileRow = unwrapMaybe(profileResult, { op: "getHostProfile.profile", args: { userId } });
  if (!profileRow) return null;
  const profile = mapProfileRow(profileRow);
  if (profile.isBanned) return null;

  const [homeResult, reviewsResult] = await Promise.all([
    supabase.from("homes").select(HOME_COLUMNS).eq("host_id", userId).maybeSingle(),
    supabase.from("reviews").select("*").eq("target_id", userId),
  ]);

  const homeRow = unwrapMaybe(homeResult, { op: "getHostProfile.home", args: { userId } });
  const home = homeRow ? mapHomeRow(homeRow) : null;
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
});

/**
 * Replaces mock-data.ts getAllHosts(). Bounded by PostGIS radius search
 * (T19) -- no longer fetches every host on earth. Batches the host/review
 * joins into 3 queries total regardless of page size, rather than fanning
 * out one getHostProfile() call per host (Section 7's N+1 finding).
 */
export const getAllHosts = cache(async (opts: { lat?: number; lng?: number; radiusMeters?: number; limit?: number; offset?: number } = {}) => {
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
});

export interface UpdateProfileInput {
  firstName: string;
  lastName: string;
  bio: string;
  languages: string[];
  interests: string[];
  avatarUrl: string | null;
}

/**
 * Writes the caller's own profile.
 *
 * The row is targeted by the caller's own session id, passed in by the
 * action that already ran requireSession() -- never a client-supplied id, so
 * this is not an object-reference vulnerability. The RLS update policy and
 * the column-level GRANT (only first_name, last_name, avatar_url, bio,
 * languages, interests are writable by `authenticated`) are the backstops --
 * is_verified and is_banned cannot be reached from here even if this
 * function tried. (Previously re-derived the id via a second
 * supabase.auth.getUser() network round trip here; the caller already has it
 * from the cache()-wrapped getSession().)
 */
export async function updateOwnProfile(authUserId: string, input: UpdateProfileInput) {
  const supabase = await createClient();

  const result = await supabase
    .from("profiles")
    .update({
      first_name: input.firstName,
      last_name: input.lastName,
      bio: input.bio,
      languages: input.languages,
      interests: input.interests,
      avatar_url: input.avatarUrl,
    })
    .eq("id", authUserId)
    .select(PROFILE_COLUMNS)
    .single();

  return mapProfileRow(unwrap(result, { op: "updateOwnProfile", mutation: true }));
}
