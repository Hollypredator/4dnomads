"use server";

import { revalidatePath } from "next/cache";
import { requireSession } from "@/lib/session";
import { submitReview, type SubmitReviewInput } from "@/lib/data/reviews";
import { runAction } from "@/lib/errors";

export async function submitReviewAction(input: SubmitReviewInput) {
  const session = await requireSession();

  const result = await runAction(async () => {
    const review = await submitReview(session.authUserId, input);
    revalidatePath("/dashboard");
    revalidatePath(`/profile/${input.targetId}`);
    return review;
  });
  return result.ok ? { ok: true as const, review: result.data } : result;
}
