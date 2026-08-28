import { cache } from "react";
import { createClient } from "@/utils/supabase/server";
import { unwrap, unwrapList } from "@/lib/errors";
import { mapStayRequestRow, mapProfileRow } from "@/lib/data/mappers";
import type { StayRequestWithUsers } from "@/types";

const PROFILE_COLUMNS =
  "id, first_name, last_name, email, avatar_url, bio, languages, interests, is_verified, is_banned, created_at";

/** Replaces mock-data.ts getRequestsForUser(). RLS already scopes rows to the caller; the .eq is defense in depth, not the only guard. */
export const getRequestsForUser = cache(async (userId: string): Promise<StayRequestWithUsers[]> => {
  const supabase = await createClient();
  const result = await supabase
    .from("stay_requests")
    .select(`*, traveler:profiles!stay_requests_traveler_id_fkey(${PROFILE_COLUMNS}), host:profiles!stay_requests_host_id_fkey(${PROFILE_COLUMNS})`)
    .or(`traveler_id.eq.${userId},host_id.eq.${userId}`)
    .order("created_at", { ascending: false });

  const rows = unwrapList(result, { op: "getRequestsForUser", args: { userId } });
  return rows.map((row) => ({
    ...mapStayRequestRow(row),
    traveler: mapProfileRow(row.traveler as Record<string, unknown>),
    host: mapProfileRow(row.host as Record<string, unknown>),
  }));
});

export interface CreateStayRequestInput {
  hostId: string;
  homeId: string;
  arrivalDate: string;
  departureDate: string;
  numberOfGuests: number;
  initialMessage: string;
}

/**
 * The traveler is always the caller (auth.uid()), never a client-supplied
 * id -- the insert policy enforces this too, but a Server Action must not
 * rely on RLS alone (see Section 3, threat 7 / T23 in docs/cutover-plan.md).
 */
export async function createStayRequest(travelerId: string, input: CreateStayRequestInput) {
  const supabase = await createClient();
  const result = await supabase
    .from("stay_requests")
    .insert({
      traveler_id: travelerId,
      host_id: input.hostId,
      home_id: input.homeId,
      arrival_date: input.arrivalDate,
      departure_date: input.departureDate,
      number_of_guests: input.numberOfGuests,
      initial_message: input.initialMessage,
    })
    .select("*")
    .single();

  return mapStayRequestRow(unwrap(result, { op: "createStayRequest", args: { travelerId, ...input }, mutation: true }));
}

export type StayRequestAction = "accept" | "decline" | "cancel";

/**
 * The stay_requests_guard_transition trigger (20260826000004_stay_requests_messages.sql)
 * is the actual authority on whether a transition is legal -- this function
 * only re-derives the target status and lets the database enforce who may
 * make it, so a forged actor id in a Server Action call cannot bypass
 * anything (decision 4 / T23).
 */
export async function updateStayRequestStatus(requestId: string, action: StayRequestAction) {
  const supabase = await createClient();
  const nextStatus = action === "accept" ? "accepted" : action === "decline" ? "declined" : "cancelled";

  const result = await supabase.from("stay_requests").update({ status: nextStatus }).eq("id", requestId).select("*").single();

  // classify() already maps 42501 (raised by stay_requests_guard_transition)
  // to "forbidden" -- no special-case needed here; mutation:true covers the
  // sibling case where RLS denies silently (null data, no error) instead.
  return mapStayRequestRow(unwrap(result, { op: "updateStayRequestStatus", args: { requestId, action }, mutation: true }));
}
