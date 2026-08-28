"use server";

import { revalidatePath } from "next/cache";
import { requireSession } from "@/lib/session";
import { upsertHome, type UpsertHomeInput } from "@/lib/data/homes";
import { runAction } from "@/lib/errors";

export async function upsertHomeAction(input: UpsertHomeInput) {
  const session = await requireSession();

  const result = await runAction(async () => {
    const home = await upsertHome(session.authUserId, input);
    revalidatePath("/profile/edit/hosting");
    revalidatePath(`/profile/${session.authUserId}`);
    revalidatePath("/explore");
    return home;
  });
  return result.ok ? { ok: true as const, home: result.data } : result;
}
