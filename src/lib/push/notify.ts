import "server-only";
import { createServiceClient } from "@/utils/supabase/service";
import { sendPushToUser } from "./send";

/**
 * Works out who should be told about a new message, and pushes to them.
 *
 * Recipient resolution runs as service role: the sender has no RLS right to
 * read the other party's row on some threads, and an event group's attendee
 * list is only visible to attendees. Nothing user-supplied reaches a query
 * here beyond ids that were already authorised by the insert itself.
 */
export async function notifyNewMessage(input: {
  senderId: string;
  senderFirstName: string;
  thread: { stayRequestId?: string; eventGroupId?: string };
  content: string;
}) {
  const { senderId, senderFirstName, thread, content } = input;
  const supabase = createServiceClient();

  // Notification bodies are a preview, not the message: a lock-screen is
  // visible to anyone holding the phone.
  const preview = content.length > 120 ? `${content.slice(0, 119)}…` : content;

  if (thread.stayRequestId) {
    const { data } = await supabase
      .from("stay_requests")
      .select("traveler_id, host_id")
      .eq("id", thread.stayRequestId)
      .maybeSingle();
    if (!data) return;

    const recipientId = data.traveler_id === senderId ? data.host_id : data.traveler_id;
    await sendPushToUser(recipientId, {
      title: senderFirstName,
      body: preview,
      path: "/messages",
    });
    return;
  }

  if (thread.eventGroupId) {
    const [{ data: event }, { data: rsvps }] = await Promise.all([
      supabase.from("local_events").select("title").eq("id", thread.eventGroupId).maybeSingle(),
      // RSVPs live in their own table (local_event_rsvps), not as an array
      // column -- T16 split them out so concurrent RSVPs cannot race past the
      // capacity check.
      supabase.from("local_event_rsvps").select("user_id").eq("event_id", thread.eventGroupId),
    ]);
    if (!event || !rsvps?.length) return;

    const recipients = rsvps.map((r) => r.user_id as string).filter((id) => id !== senderId);
    await Promise.all(
      recipients.map((id) =>
        sendPushToUser(id, {
          title: event.title as string,
          body: `${senderFirstName}: ${preview}`,
          path: `/events/${thread.eventGroupId}`,
        })
      )
    );
  }
}

/** Tells a traveler their request was accepted or declined. */
export async function notifyRequestDecision(input: {
  travelerId: string;
  hostFirstName: string;
  accepted: boolean;
}) {
  await sendPushToUser(input.travelerId, {
    title: input.accepted ? "Request accepted" : "Request declined",
    body: input.accepted
      ? `${input.hostFirstName} accepted your request to stay.`
      : `${input.hostFirstName} can't host you this time.`,
    path: "/dashboard",
  });
}
