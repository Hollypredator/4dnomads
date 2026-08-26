"use server";

import { revalidatePath } from "next/cache";
import { requireModerator } from "@/lib/session";
import { resolveReport } from "@/lib/data/moderation";
import { AppError } from "@/lib/errors";

/**
 * requireModerator() redirects a non-moderator away before this ever runs
 * (T6, decision 1) -- the resolve_report() database function checks
 * is_moderator() again independently, so this is defense in depth, not the
 * only gate. There is deliberately no verifyUser action here anymore: see
 * the note in src/lib/data/moderation.ts.
 */
export async function resolveReportAction(reportId: string, action: string) {
  await requireModerator();
  try {
    await resolveReport(reportId, action);
    revalidatePath("/admin");
    return { ok: true as const };
  } catch (err) {
    if (err instanceof AppError) return { ok: false as const, error: err.message };
    throw err;
  }
}
