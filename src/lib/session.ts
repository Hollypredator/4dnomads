import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import type { User } from "@/types";

export type Role = "user" | "moderator" | "admin";

export interface Session {
  authUserId: string;
  role: Role;
  profile: User;
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
      "id, first_name, last_name, email, avatar_url, bio, languages, interests, is_verified, is_banned, created_at"
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
    profile: {
      id: profile.id,
      firstName: profile.first_name,
      lastName: profile.last_name,
      email: profile.email,
      avatarUrl: profile.avatar_url,
      bio: profile.bio,
      languages: profile.languages ?? [],
      interests: profile.interests ?? [],
      isVerified: profile.is_verified,
      createdAt: profile.created_at,
      isBanned: profile.is_banned,
    },
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
