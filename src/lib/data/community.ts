import { cache } from "react";
import { createClient } from "@/utils/supabase/server";
import { unwrap, unwrapList, unwrapVoid, unwrapMaybe, AppError } from "@/lib/errors";
import { mapPublicTripRow, mapLocalEventRow, mapProfileRow } from "@/lib/data/mappers";
import type { PublicTripWithUser, LocalEventWithCreator } from "@/types";

const PROFILE_COLUMNS =
  "id, first_name, last_name, email, avatar_url, bio, languages, interests, is_verified, is_banned, created_at";

// ── Public trips ──────────────────────────────

export const getPublicTrips = cache(async (): Promise<PublicTripWithUser[]> => {
  const supabase = await createClient();
  const result = await supabase
    .from("public_trips")
    .select(`*, traveler:profiles!public_trips_traveler_id_fkey(${PROFILE_COLUMNS})`)
    .order("created_at", { ascending: false });
  return unwrapList(result, { op: "getPublicTrips" }).map((row) => ({
    ...mapPublicTripRow(row),
    traveler: mapProfileRow(row.traveler as Record<string, unknown>),
  }));
});

export async function createPublicTrip(
  travelerId: string,
  trip: { destination: string; arrivalDate: string; departureDate: string; numberOfGuests: number; description: string }
) {
  const supabase = await createClient();
  const result = await supabase
    .from("public_trips")
    .insert({
      traveler_id: travelerId,
      destination: trip.destination,
      arrival_date: trip.arrivalDate,
      departure_date: trip.departureDate,
      number_of_guests: trip.numberOfGuests,
      description: trip.description,
    })
    .select("*")
    .single();
  return mapPublicTripRow(unwrap(result, { op: "createPublicTrip", args: { travelerId, ...trip }, mutation: true }));
}

// ── Local events ──────────────────────────────

export const getLocalEvents = cache(async (): Promise<LocalEventWithCreator[]> => {
  const supabase = await createClient();
  const result = await supabase
    .from("local_events")
    .select(`*, creator:profiles!local_events_creator_id_fkey(${PROFILE_COLUMNS}), rsvps:local_event_rsvps(user_id)`)
    .order("event_date", { ascending: true });
  return unwrapList(result, { op: "getLocalEvents" }).map((row) => ({
    ...mapLocalEventRow(row as never),
    creator: mapProfileRow(row.creator as Record<string, unknown>),
  }));
});

export const getLocalEventById = cache(async (eventId: string): Promise<LocalEventWithCreator | null> => {
  const supabase = await createClient();
  const result = await supabase
    .from("local_events")
    .select(`*, creator:profiles!local_events_creator_id_fkey(${PROFILE_COLUMNS}), rsvps:local_event_rsvps(user_id)`)
    .eq("id", eventId)
    .maybeSingle();
  const row = unwrapMaybe(result, { op: "getLocalEventById", args: { eventId } });
  if (!row) return null;
  return { ...mapLocalEventRow(row as never), creator: mapProfileRow(row.creator as Record<string, unknown>) };
});

export async function createLocalEvent(
  creatorId: string,
  event: { title: string; description: string; locationName: string; eventDate: string; eventTime: string; maxParticipants: number }
) {
  const supabase = await createClient();
  const result = await supabase
    .from("local_events")
    .insert({
      creator_id: creatorId,
      title: event.title,
      description: event.description,
      location_name: event.locationName,
      event_date: event.eventDate,
      event_time: event.eventTime,
      max_participants: event.maxParticipants,
    })
    .select("*")
    .single();
  const created = mapLocalEventRow(unwrap(result, { op: "createLocalEvent", args: { creatorId, ...event }, mutation: true }) as never);

  // The mock behavior auto-RSVPs the creator. Mirrored here as a second
  // insert rather than a trigger, so the capacity-check trigger (which
  // reads local_event_rsvps) sees a consistent event row first.
  const rsvpResult = await supabase.from("local_event_rsvps").insert({ event_id: created.id, user_id: creatorId });
  unwrapVoid(rsvpResult, { op: "createLocalEvent.autoRsvp", args: { eventId: created.id, creatorId } });

  return { ...created, rsvps: [creatorId] };
}

/**
 * Replaces mock-data.ts toggleEventRsvp(). Capacity is enforced atomically
 * by the local_event_rsvps_capacity_check trigger (T16), not by a
 * read-then-write in application code, so two concurrent RSVPs cannot both
 * succeed past capacity.
 */
export async function toggleEventRsvp(eventId: string, userId: string) {
  const supabase = await createClient();

  const existing = await supabase.from("local_event_rsvps").select("event_id").eq("event_id", eventId).eq("user_id", userId).maybeSingle();

  if (existing.data) {
    const result = await supabase.from("local_event_rsvps").delete().eq("event_id", eventId).eq("user_id", userId);
    unwrapVoid(result, { op: "toggleEventRsvp.remove", args: { eventId, userId } });
    return { rsvped: false };
  }

  const result = await supabase.from("local_event_rsvps").insert({ event_id: eventId, user_id: userId });
  if (result.error?.code === "P0001") {
    throw new AppError("rate_limited", "This event is at capacity.", result.error);
  }
  unwrapVoid(result, { op: "toggleEventRsvp.add", args: { eventId, userId } });
  return { rsvped: true };
}
