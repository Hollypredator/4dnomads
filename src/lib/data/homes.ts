import { cache } from "react";
import { createClient } from "@/utils/supabase/server";
import { unwrap, unwrapMaybe, unwrapList } from "@/lib/errors";
import { mapHomeRow } from "@/lib/data/mappers";
import type { Home } from "@/types";

const HOME_COLUMNS =
  "id, host_id, sleeping_arrangement, max_guests, house_rules, location_name, approx_lat, approx_lng, smoking_policy, pets_info, amenities, hosting_status, gender_preference, kid_friendly, wheelchair_accessible, blockout_dates, wifi_mbps";

export const getHomeByHostId = cache(async (hostId: string): Promise<Home | null> => {
  const supabase = await createClient();
  const result = await supabase.from("homes").select(HOME_COLUMNS).eq("host_id", hostId).maybeSingle();
  const row = unwrapMaybe(result, { op: "getHomeByHostId", args: { hostId } });
  return row ? mapHomeRow(row) : null;
});

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
  wifiMbps: number | null;
}

/**
 * The only write path for a home. Exact lat/lng exist only as RPC
 * arguments -- upsert_home() fuzzes them server-side before anything is
 * written to disk. See decision 3, docs/cutover-plan.md.
 */
export async function upsertHome(authUserId: string, input: UpsertHomeInput): Promise<Home> {
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
    p_wifi_mbps: input.wifiMbps,
  });
  // upsert_home returns the row with the geography column raw, not through
  // the approx_lat/approx_lng computed fields -- re-fetch through the
  // computed-field-aware select so the caller gets consistent shape.
  // Not flagged mutation:true: this is an RPC call, not an insert/update
  // .select().single() -- a PL/pgSQL RLS violation inside upsert_home()
  // raises a real Postgres error rather than returning null/null, so the
  // WITH-CHECK-silent-null failure mode this flag exists for doesn't apply.
  unwrap(result, { op: "upsertHome" });
  const home = await getHomeByHostId(authUserId);
  if (!home) throw new Error("upsertHome: home not found immediately after upsert");
  return home;
}

/**
 * Real host counts per location, for the homepage "Popular Destinations"
 * section (never fabricated numbers -- see the design conversation this
 * replaced). Grouped in application code rather than a dedicated RPC:
 * at current and near-term scale a handful of hundred homes is a trivial
 * fetch, and this avoids a migration for a single homepage widget. Revisit
 * with a real aggregate query once /explore has enough traffic to matter.
 */
export const getCityHostCounts = cache(async (limit = 4): Promise<{ name: string; hostCount: number }[]> => {
  const supabase = await createClient();
  const result = await supabase.from("homes").select("location_name").limit(500);
  const rows = unwrapList(result, { op: "getCityHostCounts" });

  const counts = new Map<string, number>();
  for (const row of rows) {
    const city = (row.location_name as string).split(",").pop()?.trim() ?? (row.location_name as string);
    counts.set(city, (counts.get(city) ?? 0) + 1);
  }

  return Array.from(counts.entries())
    .map(([name, hostCount]) => ({ name, hostCount }))
    .sort((a, b) => b.hostCount - a.hostCount)
    .slice(0, limit);
});
