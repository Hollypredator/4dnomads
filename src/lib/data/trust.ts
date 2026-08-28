import { cache } from "react";
import { createClient } from "@/utils/supabase/server";

export interface TrustStats {
  vouchesReceived: number;
  vouchesGiven: number;
  staysHosted: number;
  staysAsGuest: number;
  memberSinceYear: number;
}

/**
 * The counters behind the trust panel on a profile.
 *
 * Every number here is a COUNT of real rows -- nothing is estimated, scaled,
 * or seeded. On a new account they are all legitimately zero, and the UI is
 * expected to say so rather than dress it up.
 *
 * Uses head:true + count:"exact" so Postgres returns only the tally; the rows
 * themselves are never shipped, which matters on a profile that could have
 * hundreds of vouches.
 */
export const getTrustStats = cache(async (userId: string, memberSince: string): Promise<TrustStats> => {
  const supabase = await createClient();

  const [received, given, hosted, guested] = await Promise.all([
    supabase.from("community_vouches").select("*", { count: "exact", head: true }).eq("target_id", userId),
    supabase.from("community_vouches").select("*", { count: "exact", head: true }).eq("author_id", userId),
    // Only 'completed' counts as a stay. 'accepted' is a plan, and counting
    // it would let anyone inflate their own history by arranging stays that
    // never happen.
    supabase.from("stay_requests").select("*", { count: "exact", head: true }).eq("host_id", userId).eq("status", "completed"),
    supabase.from("stay_requests").select("*", { count: "exact", head: true }).eq("traveler_id", userId).eq("status", "completed"),
  ]);

  // A failed count must not blank the whole profile -- these are decorative
  // relative to the page's real content, so a null count degrades to 0.
  return {
    vouchesReceived: received.count ?? 0,
    vouchesGiven: given.count ?? 0,
    staysHosted: hosted.count ?? 0,
    staysAsGuest: guested.count ?? 0,
    memberSinceYear: new Date(memberSince).getFullYear(),
  };
});
