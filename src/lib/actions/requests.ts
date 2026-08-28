"use server";

import { revalidatePath } from "next/cache";
import { after } from "next/server";
import { requireSession } from "@/lib/session";
import { createStayRequest, updateStayRequestStatus, type CreateStayRequestInput, type StayRequestAction } from "@/lib/data/requests";
import { notifyRequestDecision } from "@/lib/push/notify";
import { runAction } from "@/lib/errors";

export async function createStayRequestAction(input: CreateStayRequestInput) {
  // Decision 2: the traveler is ALWAYS the session's own id, never a value
  // read from a hidden form field. A Server Action is a public endpoint --
  // trusting client-supplied identity here is the direct-object-reference
  // vulnerability flagged as threat 7 in docs/cutover-plan.md.
  const session = await requireSession();

  const result = await runAction(async () => {
    const request = await createStayRequest(session.authUserId, input);
    revalidatePath("/dashboard");
    return request;
  });
  return result.ok ? { ok: true as const, request: result.data } : result;
}

export async function updateStayRequestStatusAction(requestId: string, action: StayRequestAction) {
  const session = await requireSession(); // caller identity re-derived; the DB trigger checks whether THIS caller may make THIS transition

  const result = await runAction(async () => {
    const request = await updateStayRequestStatus(requestId, action);

    // Only the host's accept/decline is worth waking a phone for; the other
    // transitions (cancel, complete) are initiated by the person who would
    // be notified.
    if (action === "accept" || action === "decline") {
      after(async () => {
        try {
          await notifyRequestDecision({
            travelerId: request.travelerId,
            hostFirstName: session.profile.firstName,
            accepted: action === "accept",
          });
        } catch (err) {
          console.error("[push] request-decision notification failed", err);
        }
      });
    }

    revalidatePath("/dashboard");
    revalidatePath("/messages");
    return request;
  });
  return result.ok ? { ok: true as const, request: result.data } : result;
}
