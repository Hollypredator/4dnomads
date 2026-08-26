"use server";

import { revalidatePath } from "next/cache";
import { requireSession } from "@/lib/session";
import { createPublicTrip, createLocalEvent, toggleEventRsvp } from "@/lib/data/community";
import { createForumTopic, addForumComment, toggleTopicUpvote, addVouch, createEmergencyAlert } from "@/lib/data/forum";
import { AppError } from "@/lib/errors";

function fail(err: unknown) {
  if (err instanceof AppError) return { ok: false as const, error: err.message };
  throw err;
}

export async function createPublicTripAction(trip: { destination: string; arrivalDate: string; departureDate: string; numberOfGuests: number; description: string }) {
  const session = await requireSession();
  try {
    const created = await createPublicTrip(session.authUserId, trip);
    revalidatePath("/public-trips");
    return { ok: true as const, trip: created };
  } catch (err) {
    return fail(err);
  }
}

export async function createLocalEventAction(event: { title: string; description: string; locationName: string; eventDate: string; eventTime: string; maxParticipants: number }) {
  const session = await requireSession();
  try {
    const created = await createLocalEvent(session.authUserId, event);
    revalidatePath("/events");
    return { ok: true as const, event: created };
  } catch (err) {
    return fail(err);
  }
}

export async function toggleEventRsvpAction(eventId: string) {
  const session = await requireSession();
  try {
    const result = await toggleEventRsvp(eventId, session.authUserId);
    revalidatePath(`/events/${eventId}`);
    revalidatePath("/events");
    return { ok: true as const, ...result };
  } catch (err) {
    return fail(err);
  }
}

export async function createForumTopicAction(data: { city: string; category: string; title: string; content: string }) {
  const session = await requireSession();
  try {
    const topic = await createForumTopic(session.authUserId, data);
    revalidatePath("/community");
    return { ok: true as const, topic };
  } catch (err) {
    return fail(err);
  }
}

export async function addForumCommentAction(topicId: string, content: string) {
  const session = await requireSession();
  try {
    const comment = await addForumComment(topicId, session.authUserId, content);
    revalidatePath(`/community/forum/${topicId}`);
    return { ok: true as const, comment };
  } catch (err) {
    return fail(err);
  }
}

export async function toggleTopicUpvoteAction(topicId: string) {
  const session = await requireSession();
  try {
    const result = await toggleTopicUpvote(topicId, session.authUserId);
    revalidatePath("/community");
    revalidatePath(`/community/forum/${topicId}`);
    return { ok: true as const, ...result };
  } catch (err) {
    return fail(err);
  }
}

export async function addVouchAction(targetId: string, text: string) {
  const session = await requireSession();
  try {
    const vouch = await addVouch(session.authUserId, targetId, text);
    revalidatePath(`/profile/${targetId}`);
    return { ok: true as const, vouch };
  } catch (err) {
    return fail(err);
  }
}

export async function createEmergencyAlertAction(data: { locationName: string; description: string; contactInfo: string }) {
  const session = await requireSession();
  try {
    const alert = await createEmergencyAlert(session.authUserId, data);
    revalidatePath("/community/emergency");
    return { ok: true as const, alert };
  } catch (err) {
    return fail(err);
  }
}
