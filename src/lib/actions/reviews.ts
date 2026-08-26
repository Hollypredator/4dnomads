"use server";

import { revalidatePath } from "next/cache";
import { requireSession } from "@/lib/session";
import { submitReview, type SubmitReviewInput } from "@/lib/data/reviews";
import { AppError } from "@/lib/errors";

export async function submitReviewAction(input: SubmitReviewInput) {
  const session = await requireSession();
  try {
    const review = await submitReview(session.authUserId, input);
    revalidatePath("/dashboard");
    revalidatePath(`/profile/${input.targetId}`);
    return { ok: true as const, review };
  } catch (err) {
    if (err instanceof AppError) return { ok: false as const, error: err.message };
    throw err;
  }
}
