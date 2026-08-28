import { describe, it, expect } from "vitest";
import {
  mapProfileRow,
  mapHomeRow,
  mapStayRequestRow,
  mapMessageRow,
  mapReviewRow,
  mapPublicTripRow,
  mapLocalEventRow,
} from "./mappers";

describe("mapProfileRow", () => {
  const base = {
    id: "u1",
    first_name: "Ada",
    last_name: "Lovelace",
    email: "ada@example.com",
    avatar_url: null,
    bio: null,
    languages: null,
    interests: null,
    is_verified: true,
    created_at: "2026-01-01T00:00:00Z",
    is_banned: false,
  };

  it("maps a fully-populated row", () => {
    const row = { ...base, bio: "hello", languages: ["en"], interests: ["hiking"], avatar_url: "https://x/y.png" };
    expect(mapProfileRow(row)).toEqual({
      id: "u1",
      firstName: "Ada",
      lastName: "Lovelace",
      email: "ada@example.com",
      avatarUrl: "https://x/y.png",
      bio: "hello",
      languages: ["en"],
      interests: ["hiking"],
      isVerified: true,
      createdAt: "2026-01-01T00:00:00Z",
      isBanned: false,
    });
  });

  it("falls back to empty string/array for null bio, languages, interests -- this is the contract getSession() must also honor", () => {
    const mapped = mapProfileRow(base);
    expect(mapped.bio).toBe("");
    expect(mapped.languages).toEqual([]);
    expect(mapped.interests).toEqual([]);
    expect(mapped.avatarUrl).toBeNull();
  });
});

describe("mapHomeRow", () => {
  const base = {
    id: "h1",
    host_id: "u1",
    sleeping_arrangement: "Private room",
    max_guests: 2,
    house_rules: null,
    location_name: "Lisbon, Portugal",
    approx_lat: null,
    approx_lng: null,
    smoking_policy: "Not allowed",
    pets_info: null,
    amenities: null,
    hosting_status: "accepting",
    gender_preference: "Any",
    kid_friendly: false,
    wheelchair_accessible: false,
    blockout_dates: null,
    wifi_mbps: null,
  };

  it("defaults missing lat/lng to 0 rather than throwing", () => {
    const mapped = mapHomeRow(base);
    expect(mapped.latitude).toBe(0);
    expect(mapped.longitude).toBe(0);
  });

  it("keeps wifiMbps as null instead of coercing to 0 -- null means 'no answer', 0 means 'measured and it's zero'", () => {
    expect(mapHomeRow(base).wifiMbps).toBeNull();
    expect(mapHomeRow({ ...base, wifi_mbps: 0 }).wifiMbps).toBe(0);
    expect(mapHomeRow({ ...base, wifi_mbps: 45 }).wifiMbps).toBe(45);
  });

  it("defaults houseRules/petsInfo to empty string and amenities/blockoutDates to empty array", () => {
    const mapped = mapHomeRow(base);
    expect(mapped.houseRules).toBe("");
    expect(mapped.petsInfo).toBe("");
    expect(mapped.amenities).toEqual([]);
    expect(mapped.blockoutDates).toEqual([]);
  });
});

describe("mapStayRequestRow", () => {
  it("maps inviteSent through as-is (including undefined)", () => {
    const row = {
      id: "r1",
      traveler_id: "t1",
      host_id: "h1",
      home_id: "home1",
      arrival_date: "2026-02-01",
      departure_date: "2026-02-05",
      number_of_guests: 1,
      status: "pending",
      initial_message: "hi",
      created_at: "2026-01-01T00:00:00Z",
      invite_sent: undefined,
    };
    expect(mapStayRequestRow(row).inviteSent).toBeUndefined();
    expect(mapStayRequestRow({ ...row, invite_sent: true }).inviteSent).toBe(true);
  });
});

describe("mapMessageRow", () => {
  it("coalesces null stay_request_id/event_group_id to undefined", () => {
    const row = {
      id: "m1",
      stay_request_id: null,
      event_group_id: null,
      sender_id: "u1",
      content: "hey",
      created_at: "2026-01-01T00:00:00Z",
      is_read: false,
    };
    const mapped = mapMessageRow(row);
    expect(mapped.stayRequestId).toBeUndefined();
    expect(mapped.eventGroupId).toBeUndefined();
  });
});

describe("mapReviewRow", () => {
  it("always sets isBlind to false regardless of input -- visibility is enforced by RLS before the row ever arrives here", () => {
    const row = {
      id: "rev1",
      author_id: "a1",
      target_id: "t1",
      stay_request_id: "sr1",
      rating: 5,
      text: "great host",
      created_at: "2026-01-01T00:00:00Z",
      is_blind: true, // even if a stale column value said otherwise
    };
    expect(mapReviewRow(row).isBlind).toBe(false);
  });
});

describe("mapPublicTripRow", () => {
  it("defaults description to empty string", () => {
    const row = {
      id: "pt1",
      traveler_id: "t1",
      destination: "Bali",
      arrival_date: "2026-03-01",
      departure_date: "2026-03-10",
      number_of_guests: 1,
      description: null,
      created_at: "2026-01-01T00:00:00Z",
    };
    expect(mapPublicTripRow(row).description).toBe("");
  });
});

describe("mapLocalEventRow", () => {
  it("maps rsvps relation to a plain array of user ids", () => {
    const row = {
      id: "e1",
      creator_id: "c1",
      title: "Coffee meetup",
      description: null,
      location_name: "Cafe X",
      event_date: "2026-04-01",
      event_time: "10:00:00",
      max_participants: 10,
      created_at: "2026-01-01T00:00:00Z",
      rsvps: [{ user_id: "u1" }, { user_id: "u2" }],
    };
    expect(mapLocalEventRow(row).rsvps).toEqual(["u1", "u2"]);
  });

  it("defaults rsvps to an empty array when the relation is absent", () => {
    const row = {
      id: "e1",
      creator_id: "c1",
      title: "Coffee meetup",
      description: null,
      location_name: "Cafe X",
      event_date: "2026-04-01",
      event_time: "10:00:00",
      max_participants: 10,
      created_at: "2026-01-01T00:00:00Z",
    };
    expect(mapLocalEventRow(row).rsvps).toEqual([]);
  });
});
