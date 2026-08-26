import { createClient } from "@/utils/supabase/server";
import { unwrap } from "@/lib/errors";
import { mapHomeRow } from "@/lib/data/mappers";
import type { Home } from "@/types";

const HOME_COLUMNS =
  "id, host_id, sleeping_arrangement, max_guests, house_rules, location_name, approx_lat, approx_lng, smoking_policy, pets_info, amenities, hosting_status, gender_preference, kid_friendly, wheelchair_accessible, blockout_dates";

export async function getHomeByHostId(hostId: string): Promise<Home | null> {
  const supabase = await createClient();
  const result = await supabase.from("homes").select(HOME_COLUMNS).eq("host_id", hostId).maybeSingle();
  if (!result.data) return null;
  return mapHomeRow(unwrap(result, { op: "getHomeByHostId", args: { hostId } }));
}

export interface UpsertHomeInput {
  sleepingArrangement: string;
  maxGuests: number;
  houseRules: string;
  locationName: string;
  latitude: number;
  longitude: number;
  smokingPolicy: Home["smokingPolicy"];
  petsInfo: string;
  amenities: string[];
  hostingStatus: Home["hostingStatus"];
  genderPreference: Home["genderPreference"];
  kidFriendly: boolean;
  wheelchairAccessible: boolean;
  blockoutDates: string[];
}

/**
 * The only write path for a home. Exact lat/lng exist only as RPC
 * arguments -- upsert_home() fuzzes them server-side before anything is
 * written to disk. See decision 3, docs/cutover-plan.md.
 */
export async function upsertHome(input: UpsertHomeInput): Promise<Home> {
  const supabase = await createClient();
  const result = await supabase.rpc("upsert_home", {
    p_sleeping_arrangement: input.sleepingArrangement,
    p_max_guests: input.maxGuests,
    p_house_rules: input.houseRules,
    p_location_name: input.locationName,
    p_lat: input.latitude,
    p_lng: input.longitude,
    p_smoking_policy: input.smokingPolicy,
    p_pets_info: input.petsInfo,
    p_amenities: input.amenities,
    p_hosting_status: input.hostingStatus,
    p_gender_preference: input.genderPreference,
    p_kid_friendly: input.kidFriendly,
    p_wheelchair_accessible: input.wheelchairAccessible,
    p_blockout_dates: input.blockoutDates,
  });
  // upsert_home returns the row with the geography column raw, not through
  // the approx_lat/approx_lng computed fields -- re-fetch through the
  // computed-field-aware select so the caller gets consistent shape.
  unwrap(result, { op: "upsertHome" });
  const home = await getHomeByHostId((await supabase.auth.getUser()).data.user!.id);
  if (!home) throw new Error("upsertHome: home not found immediately after upsert");
  return home;
}
