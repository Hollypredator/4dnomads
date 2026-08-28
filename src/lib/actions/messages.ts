"use server";

import { revalidatePath } from "next/cache";
import { after } from "next/server";
import { requireSession } from "@/lib/session";
import { sendMessage } from "@/lib/data/messages";
import { notifyNewMessage } from "@/lib/push/notify";
import { runAction } from "@/lib/errors";

export async function sendMessageAction(thread: { stayRequestId?: string; eventGroupId?: string }, content: string) {
  const session = await requireSession();

  const result = await runAction(async () => {
    const message = await sendMessage(session.authUserId, thread, content);

    // after() runs once the response is already on its way, so a slow or
    // failing FCM round trip never delays the sender's message appearing.
    after(async () => {
      try {
        await notifyNewMessage({
          senderId: session.authUserId,
          senderFirstName: session.profile.firstName,
          thread,
          content,
        });
      } catch (err) {
        // A push failure must never look like a send failure.
        console.error("[push] new-message notification failed", err);
      }
    });

    revalidatePath("/messages");
    return message;
  });
  return result.ok ? { ok: true as const, message: result.data } : result;
}
