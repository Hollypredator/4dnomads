import { createClient } from "@/utils/supabase/server";
import { unwrapList } from "@/lib/errors";
import { mapProfileRow, mapHomeRow, mapStayRequestRow, mapReviewRow } from "@/lib/data/mappers";

const PROFILE_COLUMNS =
  "id, first_name, last_name, email, avatar_url, bio, languages, interests, is_verified, is_banned, created_at";
const HOME_COLUMNS =
  "id, host_id, sleeping_arrangement, max_guests, house_rules, location_name, approx_lat, approx_lng, smoking_policy, pets_info, amenities, hosting_status, gender_preference, kid_friendly, wheelchair_accessible, blockout_dates";

// Every function here relies on the moderator-only branch already baked
// into the relevant RLS SELECT policy (is_moderator()) -- a non-moderator
// calling these gets back only what they're independently entitled to see,
// never a 403 and never everyone else's data. requireModerator() at the
// page level is what actually keeps this page moderator-only.

export async function getAllUsersForAdmin() {
  const supabase = await createClient();
  const result = await supabase.from("profiles").select(PROFILE_COLUMNS).order("created_at", { ascending: false });
  return unwrapList(result, { op: "getAllUsersForAdmin" }).map(mapProfileRow);
}

export async function getAllHomesForAdmin() {
  const supabase = await createClient();
  const result = await supabase.from("homes").select(HOME_COLUMNS).order("created_at", { ascending: false });
  return unwrapList(result, { op: "getAllHomesForAdmin" }).map(mapHomeRow);
}

export async function getAllStayRequestsForAdmin() {
  const supabase = await createClient();
  const result = await supabase.from("stay_requests").select("*").order("created_at", { ascending: false }).limit(200);
  return unwrapList(result, { op: "getAllStayRequestsForAdmin" }).map(mapStayRequestRow);
}

export async function getAllReviewsForAdmin() {
  const supabase = await createClient();
  const result = await supabase.from("reviews").select("*").order("created_at", { ascending: false }).limit(200);
  return unwrapList(result, { op: "getAllReviewsForAdmin" }).map(mapReviewRow);
}
