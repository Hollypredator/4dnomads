import { createClient } from "@/utils/supabase/server";
import { unwrap, unwrapList } from "@/lib/errors";
import { mapMessageRow, mapStayRequestRow, mapProfileRow } from "@/lib/data/mappers";
import type { MessageThread } from "@/types";

const PROFILE_COLUMNS =
  "id, first_name, last_name, email, avatar_url, bio, languages, interests, is_verified, is_banned, created_at";

export async function getMessagesForRequest(requestId: string) {
  const supabase = await createClient();
  const result = await supabase.from("messages").select("*").eq("stay_request_id", requestId).order("created_at", { ascending: true });
  return unwrapList(result, { op: "getMessagesForRequest", args: { requestId } }).map(mapMessageRow);
}

/** RLS restricts this to RSVP'd participants (see the messages SELECT policy in 20260826000004_stay_requests_messages.sql). */
export async function getMessagesForEventGroup(eventId: string) {
  const supabase = await createClient();
  const result = await supabase.from("messages").select("*").eq("event_group_id", eventId).order("created_at", { ascending: true });
  return unwrapList(result, { op: "getMessagesForEventGroup", args: { eventId } }).map(mapMessageRow);
}

/**
 * Replaces mock-data.ts getMessageThreads(). Unlike the mock version, this
 * does not silently drop requests with zero messages -- a freshly accepted
 * request with no messages yet should still show up as an empty thread the
 * user can open, not disappear (Section 4 gap).
 */
export async function getMessageThreads(userId: string): Promise<MessageThread[]> {
  const supabase = await createClient();

  const requestsResult = await supabase
    .from("stay_requests")
    .select(`*, traveler:profiles!stay_requests_traveler_id_fkey(${PROFILE_COLUMNS}), host:profiles!stay_requests_host_id_fkey(${PROFILE_COLUMNS})`)
    .or(`traveler_id.eq.${userId},host_id.eq.${userId}`)
    .in("status", ["accepted", "completed"])
    .order("created_at", { ascending: false });

  const requests = unwrapList(requestsResult, { op: "getMessageThreads.requests", args: { userId } });
  if (requests.length === 0) return [];

  const requestIds = requests.map((r) => r.id as string);
  const messagesResult = await supabase
    .from("messages")
    .select("*")
    .in("stay_request_id", requestIds)
    .order("created_at", { ascending: true });
  const allMessages = unwrapList(messagesResult, { op: "getMessageThreads.messages", args: { userId } }).map(mapMessageRow);

  return requests.map((row) => {
    const stayRequest = mapStayRequestRow(row);
    const traveler = mapProfileRow(row.traveler as Record<string, unknown>);
    const host = mapProfileRow(row.host as Record<string, unknown>);
    const otherUser = stayRequest.hostId === userId ? traveler : host;
    const messages = allMessages.filter((m) => m.stayRequestId === stayRequest.id);

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
}

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
  return mapMessageRow(unwrap(result, { op: "sendMessage", args: { senderId, thread } }));
}
