"use server";

import { revalidatePath } from "next/cache";
import { requireSession } from "@/lib/session";
import { upsertHome, type UpsertHomeInput } from "@/lib/data/homes";
import { AppError } from "@/lib/errors";

export async function upsertHomeAction(input: UpsertHomeInput) {
  const session = await requireSession();
  try {
    const home = await upsertHome(input);
    revalidatePath("/profile/edit/hosting");
    revalidatePath(`/profile/${session.authUserId}`);
    revalidatePath("/explore");
    return { ok: true as const, home };
  } catch (err) {
    if (err instanceof AppError) return { ok: false as const, error: err.message };
    throw err;
  }
}
