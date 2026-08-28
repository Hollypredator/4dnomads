import { cache } from "react";
import { createClient } from "@/utils/supabase/server";
import { unwrap, unwrapList, AppError } from "@/lib/errors";
import { mapProfileRow } from "@/lib/data/mappers";
import type { UserReportWithUsers } from "@/types";

const PROFILE_COLUMNS =
  "id, first_name, last_name, email, avatar_url, bio, languages, interests, is_verified, is_banned, created_at";

/** Gated by the "reporters view own; moderators view all" SELECT policy -- a non-moderator caller simply gets their own reports back, never a 403. */
export const getReportsWithUsers = cache(async (): Promise<UserReportWithUsers[]> => {
  const supabase = await createClient();
  const result = await supabase
    .from("user_reports")
    .select(`*, reporter:profiles!user_reports_reporter_id_fkey(${PROFILE_COLUMNS}), target:profiles!user_reports_target_id_fkey(${PROFILE_COLUMNS})`)
    .order("created_at", { ascending: false });

  return unwrapList(result, { op: "getReportsWithUsers" }).map((row) => ({
    id: row.id as string,
    reporterId: row.reporter_id as string,
    targetId: row.target_id as string,
    reason: row.reason as string,
    status: row.status as "pending" | "resolved",
    actionTaken: (row.action_taken as string | null) ?? undefined,
    createdAt: row.created_at as string,
    reporter: mapProfileRow(row.reporter as Record<string, unknown>),
    target: mapProfileRow(row.target as Record<string, unknown>),
  }));
});

/**
 * Replaces mock-data.ts resolveReport(). The database function checks
 * is_moderator() itself and writes the audit log entry atomically with the
 * ban -- this is not re-checked here, because a Server Action must never
 * be the only place an authorization decision is made (Section 3, threat 7).
 */
export async function resolveReport(reportId: string, action: string) {
  const supabase = await createClient();
  const result = await supabase.rpc("resolve_report", { p_report_id: reportId, p_action: action });
  if (result.error?.code === "42501") {
    throw new AppError("forbidden", "Only moderators can resolve reports.", result.error);
  }
  unwrap(result, { op: "resolveReport", args: { reportId, action } });
}

/**
 * NOTE: this intentionally has no client-callable equivalent of the old
 * mock-data.ts verifyUser(). Verification is service-role-only (T24, the
 * Stripe Identity webhook) -- there is no "moderator manually verifies a
 * user" button anymore, on purpose. See decision 5, docs/cutover-plan.md.
 */
export const getPlatformStats = cache(async () => {
  const supabase = await createClient();

  const [profiles, homes, requests, reviews, messages, reports] = await Promise.all([
    supabase.from("profiles").select("id, is_verified, is_banned").is("deleted_at", null),
    supabase.from("homes").select("id", { count: "exact", head: true }),
    supabase.from("stay_requests").select("id, status"),
    supabase.from("reviews").select("id", { count: "exact", head: true }),
    supabase.from("messages").select("id", { count: "exact", head: true }),
    supabase.from("user_reports").select("id, status"),
  ]);

  const profileRows = unwrapList(profiles, { op: "getPlatformStats.profiles" });
  const requestRows = unwrapList(requests, { op: "getPlatformStats.requests" });
  const reportRows = unwrapList(reports, { op: "getPlatformStats.reports" });

  return {
    totalUsers: profileRows.filter((u) => !u.is_banned).length,
    verifiedUsers: profileRows.filter((u) => u.is_verified && !u.is_banned).length,
    totalHomes: homes.count ?? 0,
    totalRequests: requestRows.length,
    pendingRequests: requestRows.filter((r) => r.status === "pending").length,
    totalReviews: reviews.count ?? 0,
    totalMessages: messages.count ?? 0,
    activeReports: reportRows.filter((r) => r.status === "pending").length,
  };
});
