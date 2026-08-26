import { createClient } from "@/utils/supabase/server";
import { unwrap, unwrapList, AppError } from "@/lib/errors";
import { mapReviewRow } from "@/lib/data/mappers";

/** RLS already filters to the visible set (decision 7) -- what comes back IS "not blind". */
export async function getReviewsForUser(userId: string) {
  const supabase = await createClient();
  const result = await supabase.from("reviews").select("*").eq("target_id", userId);
  return unwrapList(result, { op: "getReviewsForUser", args: { userId } }).map(mapReviewRow);
}

export interface SubmitReviewInput {
  stayRequestId: string;
  targetId: string;
  rating: number;
  text: string;
}

/**
 * Eligibility (stay must be 'completed', author/target must be the two
 * parties) is enforced by the reviews_check_eligibility trigger
 * (20260826000005_reviews.sql). authorId is always the caller, never a
 * client-supplied value.
 */
export async function submitReview(authorId: string, input: SubmitReviewInput) {
  const supabase = await createClient();
  const result = await supabase
    .from("reviews")
    .insert({
      author_id: authorId,
      target_id: input.targetId,
      stay_request_id: input.stayRequestId,
      rating: input.rating,
      text: input.text,
    })
    .select("*")
    .single();

  if (result.error?.code === "42501" || result.error?.code === "P0001") {
    throw new AppError("forbidden", result.error.message, result.error);
  }
  return mapReviewRow(unwrap(result, { op: "submitReview", args: { authorId, ...input } }));
}
