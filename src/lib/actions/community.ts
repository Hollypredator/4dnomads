"use server";

import { revalidatePath } from "next/cache";
import { requireSession } from "@/lib/session";
import { createPublicTrip, createLocalEvent, toggleEventRsvp } from "@/lib/data/community";
import { createForumTopic, addForumComment, toggleTopicUpvote, addVouch, createEmergencyAlert } from "@/lib/data/forum";
import { runAction } from "@/lib/errors";

export async function createPublicTripAction(trip: { destination: string; arrivalDate: string; departureDate: string; numberOfGuests: number; description: string }) {
  const session = await requireSession();
  const result = await runAction(async () => {
    const created = await createPublicTrip(session.authUserId, trip);
    revalidatePath("/public-trips");
    return created;
  });
  return result.ok ? { ok: true as const, trip: result.data } : result;
}

export async function createLocalEventAction(event: { title: string; description: string; locationName: string; eventDate: string; eventTime: string; maxParticipants: number }) {
  const session = await requireSession();
  const result = await runAction(async () => {
    const created = await createLocalEvent(session.authUserId, event);
    revalidatePath("/events");
    return created;
  });
  return result.ok ? { ok: true as const, event: result.data } : result;
}

export async function toggleEventRsvpAction(eventId: string) {
  const session = await requireSession();
  const result = await runAction(async () => {
    const outcome = await toggleEventRsvp(eventId, session.authUserId);
    revalidatePath(`/events/${eventId}`);
    revalidatePath("/events");
    return outcome;
  });
  return result.ok ? { ok: true as const, ...result.data } : result;
}

export async function createForumTopicAction(data: { city: string; category: string; title: string; content: string }) {
  const session = await requireSession();
  const result = await runAction(async () => {
    const topic = await createForumTopic(session.authUserId, data);
    revalidatePath("/community");
    return topic;
  });
  return result.ok ? { ok: true as const, topic: result.data } : result;
}

export async function addForumCommentAction(topicId: string, content: string) {
  const session = await requireSession();
  const result = await runAction(async () => {
    const comment = await addForumComment(topicId, session.authUserId, content);
    revalidatePath(`/community/forum/${topicId}`);
    return comment;
  });
  return result.ok ? { ok: true as const, comment: result.data } : result;
}

export async function toggleTopicUpvoteAction(topicId: string) {
  const session = await requireSession();
  const result = await runAction(async () => {
    const outcome = await toggleTopicUpvote(topicId, session.authUserId);
    revalidatePath("/community");
    revalidatePath(`/community/forum/${topicId}`);
    return outcome;
  });
  return result.ok ? { ok: true as const, ...result.data } : result;
}

export async function addVouchAction(targetId: string, text: string) {
  const session = await requireSession();
  const result = await runAction(async () => {
    const vouch = await addVouch(session.authUserId, targetId, text);
    revalidatePath(`/profile/${targetId}`);
    return vouch;
  });
  return result.ok ? { ok: true as const, vouch: result.data } : result;
}

export async function createEmergencyAlertAction(data: { locationName: string; description: string; contactInfo: string }) {
  const session = await requireSession();
  const result = await runAction(async () => {
    const alert = await createEmergencyAlert(session.authUserId, data);
    revalidatePath("/community/emergency");
    return alert;
  });
  return result.ok ? { ok: true as const, alert: result.data } : result;
}
