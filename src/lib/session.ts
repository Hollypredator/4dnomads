import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { mapProfileRow } from "@/lib/data/mappers";
import type { User } from "@/types";

export type Role = "user" | "moderator" | "admin";

export interface Session {
  authUserId: string;
  role: Role;
  profile: User;
  /** NULL until the user finishes or skips onboarding. */
  onboardingCompletedAt: string | null;
}

// Decision 2 (docs/cutover-plan.md): the server is the only source of
// identity. There is no client-side auth context -- a client-supplied user
// id can be forged, so nothing in this codebase trusts one. cache() dedups
// this call within a single request, so the root layout and a page can both
// call it for the cost of one round trip.
export const getSession = cache(async (): Promise<Session | null> => {
  const supabase = await createClient();

  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();

  if (!authUser) return null;

  const { data: profile, error } = await supabase
    .from("profiles")
    .select(
      "id, first_name, last_name, email, avatar_url, bio, languages, interests, is_verified, is_banned, created_at, onboarding_completed_at"
    )
    .eq("id", authUser.id)
    .maybeSingle();

  if (error) {
    console.error("[session] failed to load profile", { userId: authUser.id, error });
    return null;
  }

  if (!profile) {
    // Auth user exists but the profiles row hasn't been created yet (or
    // handle_new_user() failed). Treat as logged-out rather than crash.
    console.error("[session] auth user has no profile row", { userId: authUser.id });
    return null;
  }

  // app_metadata is only writable by the service role (decision 1), so this
  // claim cannot be forged by the client even if a table policy were wrong.
  const role = (authUser.app_metadata?.role as Role | undefined) ?? "user";

  return {
    authUserId: authUser.id,
    role,
    onboardingCompletedAt: profile.onboarding_completed_at ?? null,
    // Delegates to the same mapper every other data/*.ts read uses, rather
    // than a second hand-written copy -- the two had drifted (this version
    // left bio as null instead of mapProfileRow's "" fallback).
    profile: mapProfileRow(profile),
  };
});

/** For pages that require a signed-in user. Redirects rather than rendering a broken page. */
export async function requireSession(): Promise<Session> {
  const session = await getSession();
  if (!session) redirect("/login");
  return session;
}

export async function requireModerator(): Promise<Session> {
  const session = await requireSession();
  if (session.role !== "moderator" && session.role !== "admin") {
    redirect("/");
  }
  return session;
}
