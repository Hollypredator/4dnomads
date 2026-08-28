"use server";

import { revalidatePath } from "next/cache";
import { requireSession } from "@/lib/session";
import { updateOwnProfile } from "@/lib/data/profiles";
import { createClient } from "@/utils/supabase/server";
import { AppError } from "@/lib/errors";

const MAX_AVATAR_BYTES = 5 * 1024 * 1024;
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;

export interface ProfileFormState {
  error?: string;
  ok?: boolean;
}

/**
 * Saves the signed-in user's own profile, optionally replacing their avatar.
 *
 * Note there is no `id` field anywhere in here: the row written is always the
 * session's own, and the storage path is always keyed to the session's own
 * user id. Both the RLS policies and the storage policies enforce the same
 * thing independently, so a bug here cannot let one account write another's.
 */
export async function updateProfileAction(
  _prev: ProfileFormState,
  formData: FormData
): Promise<ProfileFormState> {
  const session = await requireSession();

  const firstName = String(formData.get("firstName") ?? "").trim();
  const lastName = String(formData.get("lastName") ?? "").trim();
  const bio = String(formData.get("bio") ?? "").trim();

  if (!firstName || !lastName) {
    return { error: "First and last name are required." };
  }
  // Mirrors the CHECK constraints on profiles, so the user gets a readable
  // message instead of a Postgres violation.
  if (firstName.length > 80 || lastName.length > 80) {
    return { error: "Names must be 80 characters or fewer." };
  }
  if (bio.length > 2000) {
    return { error: "Bio must be 2000 characters or fewer." };
  }

  const languages = parseTags(formData.get("languages"));
  const interests = parseTags(formData.get("interests"));

  let avatarUrl = session.profile.avatarUrl ?? null;

  const file = formData.get("avatar");
  if (file instanceof File && file.size > 0) {
    if (!ALLOWED_TYPES.includes(file.type as (typeof ALLOWED_TYPES)[number])) {
      return { error: "Photo must be a JPEG, PNG or WebP image." };
    }
    if (file.size > MAX_AVATAR_BYTES) {
      return { error: "Photo must be smaller than 5 MB." };
    }

    const supabase = await createClient();
    const ext = file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg";
    // Timestamped filename rather than a fixed one: the public URL is served
    // through a CDN, and reusing the same path leaves the old image cached
    // for everyone who has already seen it.
    const path = `${session.authUserId}/avatar-${Date.now()}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from("avatars")
      .upload(path, file, { contentType: file.type, upsert: false });

    if (uploadError) {
      console.error("[profile] avatar upload failed", uploadError);
      return { error: "Could not upload that photo. Please try again." };
    }

    const { data } = supabase.storage.from("avatars").getPublicUrl(path);
    const previous = avatarUrl;
    avatarUrl = data.publicUrl;

    // Best-effort cleanup of the replaced file. A failure here leaves an
    // orphan object, which is preferable to failing the whole save.
    if (previous) {
      const oldPath = pathFromPublicUrl(previous);
      if (oldPath) await supabase.storage.from("avatars").remove([oldPath]);
    }
  }

  try {
    await updateOwnProfile(session.authUserId, { firstName, lastName, bio, languages, interests, avatarUrl });
  } catch (err) {
    if (err instanceof AppError) return { error: err.message };
    throw err;
  }

  // The avatar and name appear in the nav, tab bar and every card, so the
  // whole tree is revalidated rather than just this route.
  revalidatePath("/", "layout");
  return { ok: true };
}

/** Comma-separated input to a clean, de-duplicated, bounded list. */
function parseTags(value: FormDataEntryValue | null): string[] {
  return String(value ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
    .map((s) => s.slice(0, 40))
    // 20 is well past any real answer and stops a pasted essay becoming
    // hundreds of array entries.
    .slice(0, 20)
    .filter((s, i, arr) => arr.indexOf(s) === i);
}

/**
 * Recovers the storage object path from a public URL so an old avatar can be
 * deleted. Returns null if the URL is not one of ours -- a Google account
 * photo, for instance, which must not be passed to storage.remove().
 */
function pathFromPublicUrl(url: string): string | null {
  const marker = "/storage/v1/object/public/avatars/";
  const i = url.indexOf(marker);
  return i === -1 ? null : url.slice(i + marker.length);
}

export interface OnboardingInput {
  bio: string;
  languages: string[];
  interests: string[];
  wantsToHost: boolean;
}

/**
 * Finishes onboarding: saves whatever the user filled in and stamps the
 * completion time so they are not asked again.
 *
 * The stamp is written even when every field was skipped. Onboarding is a
 * one-time invitation, not a gate -- re-prompting someone who already said
 * "not now" on every launch is how an app gets deleted.
 */
export async function completeOnboardingAction(input: OnboardingInput) {
  const session = await requireSession();
  const supabase = await createClient();

  const { error } = await supabase
    .from("profiles")
    .update({
      bio: input.bio.slice(0, 2000),
      languages: input.languages.slice(0, 20),
      interests: input.interests.slice(0, 20),
      onboarding_completed_at: new Date().toISOString(),
    })
    .eq("id", session.authUserId);

  if (error) {
    console.error("[onboarding] failed to save", error);
    return { ok: false as const, error: "Could not save. Please try again." };
  }

  revalidatePath("/", "layout");
  return { ok: true as const };
}

/** Uploads an avatar on its own, for the onboarding photo step. */
export async function uploadAvatarAction(formData: FormData) {
  const session = await requireSession();
  const file = formData.get("avatar");

  if (!(file instanceof File) || file.size === 0) {
    return { ok: false as const, error: "No photo selected." };
  }
  if (!ALLOWED_TYPES.includes(file.type as (typeof ALLOWED_TYPES)[number])) {
    return { ok: false as const, error: "Photo must be a JPEG, PNG or WebP image." };
  }
  if (file.size > MAX_AVATAR_BYTES) {
    return { ok: false as const, error: "Photo must be smaller than 5 MB." };
  }

  const supabase = await createClient();
  const ext = file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg";
  const path = `${session.authUserId}/avatar-${Date.now()}.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from("avatars")
    .upload(path, file, { contentType: file.type, upsert: false });

  if (uploadError) {
    console.error("[onboarding] avatar upload failed", uploadError);
    return { ok: false as const, error: "Could not upload that photo." };
  }

  const { data } = supabase.storage.from("avatars").getPublicUrl(path);

  const { error: saveError } = await supabase
    .from("profiles")
    .update({ avatar_url: data.publicUrl })
    .eq("id", session.authUserId);

  if (saveError) {
    console.error("[onboarding] avatar save failed", saveError);
    return { ok: false as const, error: "Could not save that photo." };
  }

  revalidatePath("/", "layout");
  return { ok: true as const, url: data.publicUrl };
}
