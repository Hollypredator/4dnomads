"use server";

import { revalidatePath } from "next/cache";
import { requireSession } from "@/lib/session";
import { sendMessage } from "@/lib/data/messages";
import { AppError } from "@/lib/errors";

export async function sendMessageAction(thread: { stayRequestId?: string; eventGroupId?: string }, content: string) {
  const session = await requireSession();
  try {
    const message = await sendMessage(session.authUserId, thread, content);
    revalidatePath("/messages");
    return { ok: true as const, message };
  } catch (err) {
    if (err instanceof AppError) return { ok: false as const, error: err.message };
    throw err;
  }
}
