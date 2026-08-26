// Postgres/PostgREST columns are snake_case; src/types/index.ts is
// camelCase. These mappers are the single seam between them so a schema
// column rename doesn't ripple across every data/*.ts file.
import type { User, Home, StayRequest, Message, Review, PublicTrip, LocalEvent } from "@/types";

export function mapProfileRow(row: Record<string, unknown>): User {
  return {
    id: row.id as string,
    firstName: row.first_name as string,
    lastName: row.last_name as string,
    email: row.email as string,
    avatarUrl: (row.avatar_url as string | null) ?? null,
    bio: (row.bio as string) ?? "",
    languages: (row.languages as string[]) ?? [],
    interests: (row.interests as string[]) ?? [],
    isVerified: row.is_verified as boolean,
    createdAt: row.created_at as string,
    isBanned: row.is_banned as boolean | undefined,
  };
}

export function mapHomeRow(row: Record<string, unknown>): Home {
  // approx_lat/approx_lng are Postgres "computed fields" (see
  // 20260826000002_homes.sql) -- the only way this fuzzed point is exposed
  // to clients. The raw approx_coordinates geography column is never
  // selected directly, so there is no WKB to parse here.
  const lat = (row.approx_lat as number | null) ?? 0;
  const lng = (row.approx_lng as number | null) ?? 0;

  return {
    id: row.id as string,
    hostId: row.host_id as string,
    sleepingArrangement: row.sleeping_arrangement as string,
    maxGuests: row.max_guests as number,
    houseRules: (row.house_rules as string) ?? "",
    locationName: row.location_name as string,
    latitude: lat,
    longitude: lng,
    smokingPolicy: row.smoking_policy as Home["smokingPolicy"],
    petsInfo: (row.pets_info as string) ?? "",
    amenities: (row.amenities as string[]) ?? [],
    hostingStatus: row.hosting_status as Home["hostingStatus"],
    genderPreference: row.gender_preference as Home["genderPreference"],
    kidFriendly: row.kid_friendly as boolean,
    wheelchairAccessible: row.wheelchair_accessible as boolean,
    blockoutDates: (row.blockout_dates as string[]) ?? [],
  };
}

export function mapStayRequestRow(row: Record<string, unknown>): StayRequest {
  return {
    id: row.id as string,
    travelerId: row.traveler_id as string,
    hostId: row.host_id as string,
    homeId: row.home_id as string,
    arrivalDate: row.arrival_date as string,
    departureDate: row.departure_date as string,
    numberOfGuests: row.number_of_guests as number,
    status: row.status as StayRequest["status"],
    initialMessage: row.initial_message as string,
    createdAt: row.created_at as string,
    inviteSent: row.invite_sent as boolean | undefined,
  };
}

export function mapMessageRow(row: Record<string, unknown>): Message {
  return {
    id: row.id as string,
    stayRequestId: (row.stay_request_id as string | null) ?? undefined,
    eventGroupId: (row.event_group_id as string | null) ?? undefined,
    senderId: row.sender_id as string,
    content: row.content as string,
    createdAt: row.created_at as string,
    isRead: row.is_read as boolean,
  };
}

export function mapReviewRow(row: Record<string, unknown>): Review {
  return {
    id: row.id as string,
    authorId: row.author_id as string,
    targetId: row.target_id as string,
    stayRequestId: row.stay_request_id as string,
    rating: row.rating as number,
    text: row.text as string,
    createdAt: row.created_at as string,
    // isBlind no longer exists as stored state (decision 7): visibility is
    // derived by the RLS policy itself, so if a row reached the client it
    // is, by definition, visible.
    isBlind: false,
  };
}

export function mapPublicTripRow(row: Record<string, unknown>): PublicTrip {
  return {
    id: row.id as string,
    travelerId: row.traveler_id as string,
    destination: row.destination as string,
    arrivalDate: row.arrival_date as string,
    departureDate: row.departure_date as string,
    numberOfGuests: row.number_of_guests as number,
    description: (row.description as string) ?? "",
    createdAt: row.created_at as string,
  };
}

export function mapLocalEventRow(row: Record<string, unknown> & { rsvps?: { user_id: string }[] }): LocalEvent {
  return {
    id: row.id as string,
    creatorId: row.creator_id as string,
    title: row.title as string,
    description: (row.description as string) ?? "",
    locationName: row.location_name as string,
    eventDate: row.event_date as string,
    eventTime: row.event_time as string,
    maxParticipants: row.max_participants as number,
    rsvps: (row.rsvps ?? []).map((r) => r.user_id),
    createdAt: row.created_at as string,
  };
}
