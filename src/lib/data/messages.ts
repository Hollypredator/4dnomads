import { cache } from "react";
import { createClient } from "@/utils/supabase/server";
import { unwrap, unwrapList } from "@/lib/errors";
import { mapMessageRow, mapStayRequestRow, mapProfileRow, mapLocalEventRow } from "@/lib/data/mappers";
import type { MessageThread } from "@/types";

const PROFILE_COLUMNS =
  "id, first_name, last_name, email, avatar_url, bio, languages, interests, is_verified, is_banned, created_at";

export const getMessagesForRequest = cache(async (requestId: string) => {
  const supabase = await createClient();
  const result = await supabase.from("messages").select("*").eq("stay_request_id", requestId).order("created_at", { ascending: true });
  return unwrapList(result, { op: "getMessagesForRequest", args: { requestId } }).map(mapMessageRow);
});

/** RLS restricts this to RSVP'd participants (see the messages SELECT policy in 20260826000004_stay_requests_messages.sql). */
export const getMessagesForEventGroup = cache(async (eventId: string) => {
  const supabase = await createClient();
  const result = await supabase.from("messages").select("*").eq("event_group_id", eventId).order("created_at", { ascending: true });
  return unwrapList(result, { op: "getMessagesForEventGroup", args: { eventId } }).map(mapMessageRow);
});

/**
 * Replaces mock-data.ts getMessageThreads(). Unlike the mock version, this
 * does not silently drop requests with zero messages -- a freshly accepted
 * request with no messages yet should still show up as an empty thread the
 * user can open, not disappear (Section 4 gap).
 *
 * Covers both thread kinds: 1:1 stay-request threads AND group event chats
 * the user has RSVP'd to. Before this, an event chat (messages.event_group_id)
 * was only reachable from the event's own page -- MessageThread.eventGroup
 * was declared in the type but nothing ever populated it, so it never
 * appeared in the inbox at all. Short-circuits to one query when the user
 * has neither, rather than four no-op queries.
 */
export const getMessageThreads = cache(async (userId: string): Promise<MessageThread[]> => {
  const supabase = await createClient();

  const [requestsResult, rsvpResult] = await Promise.all([
    supabase
      .from("stay_requests")
      .select(`*, traveler:profiles!stay_requests_traveler_id_fkey(${PROFILE_COLUMNS}), host:profiles!stay_requests_host_id_fkey(${PROFILE_COLUMNS})`)
      .or(`traveler_id.eq.${userId},host_id.eq.${userId}`)
      .in("status", ["accepted", "completed"])
      .order("created_at", { ascending: false }),
    supabase.from("local_event_rsvps").select("event_id").eq("user_id", userId),
  ]);

  const requests = unwrapList(requestsResult, { op: "getMessageThreads.requests", args: { userId } });
  const eventIds = unwrapList(rsvpResult, { op: "getMessageThreads.rsvps", args: { userId } }).map((r) => r.event_id as string);

  if (requests.length === 0 && eventIds.length === 0) return [];

  const requestIds = requests.map((r) => r.id as string);
  const [requestMessagesResult, eventRowsResult, eventMessagesResult] = await Promise.all([
    supabase.from("messages").select("*").in("stay_request_id", requestIds).order("created_at", { ascending: true }),
    supabase.from("local_events").select("*").in("id", eventIds),
    supabase.from("messages").select("*").in("event_group_id", eventIds).order("created_at", { ascending: true }),
  ]);

  const allRequestMessages = unwrapList(requestMessagesResult, { op: "getMessageThreads.requestMessages", args: { userId } }).map(mapMessageRow);
  const events = unwrapList(eventRowsResult, { op: "getMessageThreads.events", args: { userId } }).map((row) => mapLocalEventRow(row as never));
  const allEventMessages = unwrapList(eventMessagesResult, { op: "getMessageThreads.eventMessages", args: { userId } }).map(mapMessageRow);

  const requestThreads: MessageThread[] = requests.map((row) => {
    const stayRequest = mapStayRequestRow(row);
    const traveler = mapProfileRow(row.traveler as Record<string, unknown>);
    const host = mapProfileRow(row.host as Record<string, unknown>);
    const otherUser = stayRequest.hostId === userId ? traveler : host;
    const messages = allRequestMessages.filter((m) => m.stayRequestId === stayRequest.id);

    return {
      stayRequest,
      otherUser,
      messages,
      lastMessage: messages[messages.length - 1] ?? {
        id: "",
        senderId: "",
        content: "Say hello to get started.",
        createdAt: stayRequest.createdAt,
        isRead: true,
      },
      unreadCount: messages.filter((m) => m.senderId !== userId && !m.isRead).length,
    };
  });

  const eventThreads: MessageThread[] = events.map((eventGroup) => {
    const messages = allEventMessages.filter((m) => m.eventGroupId === eventGroup.id);
    return {
      eventGroup,
      messages,
      lastMessage: messages[messages.length - 1] ?? {
        id: "",
        senderId: "",
        content: "Say hello to the group.",
        createdAt: eventGroup.createdAt,
        isRead: true,
      },
      unreadCount: messages.filter((m) => m.senderId !== userId && !m.isRead).length,
    };
  });

  return [...requestThreads, ...eventThreads];
});

/**
 * Membership in the thread is enforced by the messages INSERT policy
 * (20260826000004_stay_requests_messages.sql), not re-checked here -- but
 * senderId is always the caller's own id, never trusted from a form field,
 * per decision 2.
 */
export async function sendMessage(senderId: string, thread: { stayRequestId?: string; eventGroupId?: string }, content: string) {
  const supabase = await createClient();
  const result = await supabase
    .from("messages")
    .insert({
      sender_id: senderId,
      stay_request_id: thread.stayRequestId ?? null,
      event_group_id: thread.eventGroupId ?? null,
      content,
    })
    .select("*")
    .single();
  return mapMessageRow(unwrap(result, { op: "sendMessage", args: { senderId, thread }, mutation: true }));
}
