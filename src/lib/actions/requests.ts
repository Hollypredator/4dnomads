"use server";

import { revalidatePath } from "next/cache";
import { requireSession } from "@/lib/session";
import { createStayRequest, updateStayRequestStatus, type CreateStayRequestInput, type StayRequestAction } from "@/lib/data/requests";
import { AppError } from "@/lib/errors";

export async function createStayRequestAction(input: CreateStayRequestInput) {
  // Decision 2: the traveler is ALWAYS the session's own id, never a value
  // read from a hidden form field. A Server Action is a public endpoint --
  // trusting client-supplied identity here is the direct-object-reference
  // vulnerability flagged as threat 7 in docs/cutover-plan.md.
  const session = await requireSession();

  try {
    const request = await createStayRequest(session.authUserId, input);
    revalidatePath("/dashboard");
    return { ok: true as const, request };
  } catch (err) {
    if (err instanceof AppError) return { ok: false as const, error: err.message };
    throw err;
  }
}

export async function updateStayRequestStatusAction(requestId: string, action: StayRequestAction) {
  await requireSession(); // caller identity re-derived; the DB trigger checks whether THIS caller may make THIS transition
  try {
    const request = await updateStayRequestStatus(requestId, action);
    revalidatePath("/dashboard");
    revalidatePath("/messages");
    return { ok: true as const, request };
  } catch (err) {
    if (err instanceof AppError) return { ok: false as const, error: err.message };
    throw err;
  }
}
