import { createClient } from "@/utils/supabase/server";
import { unwrap, unwrapList, unwrapVoid, AppError } from "@/lib/errors";
import { mapProfileRow } from "@/lib/data/mappers";
import type {
  ForumTopicWithAuthor,
  ForumComment,
  CommunityVouchWithAuthor,
  EmergencyAlertWithAuthor,
} from "@/types";

const PROFILE_COLUMNS =
  "id, first_name, last_name, email, avatar_url, bio, languages, interests, is_verified, is_banned, created_at";

function mapTopicRow(row: Record<string, unknown>): ForumTopicWithAuthor {
  return {
    id: row.id as string,
    city: row.city as string,
    category: row.category as ForumTopicWithAuthor["category"],
    title: row.title as string,
    content: row.content as string,
    authorId: row.author_id as string,
    createdAt: row.created_at as string,
    upvotes: (row.upvotes as { count: number }[] | undefined)?.[0]?.count ?? 0,
    upvotedBy: [], // populated per-viewer only where needed (getForumTopics does not need it)
    author: mapProfileRow(row.author as Record<string, unknown>),
    commentCount: (row.comments as { count: number }[] | undefined)?.[0]?.count ?? 0,
  };
}

// ── Forum topics ──────────────────────────────

export async function getForumTopics(cityFilter?: string): Promise<ForumTopicWithAuthor[]> {
  const supabase = await createClient();
  let query = supabase
    .from("forum_topics")
    .select(
      `*, author:profiles!forum_topics_author_id_fkey(${PROFILE_COLUMNS}), upvotes:forum_upvotes(count), comments:forum_comments(count)`
    )
    .order("created_at", { ascending: false });

  if (cityFilter) query = query.eq("city", cityFilter);

  const result = await query;
  return unwrapList(result, { op: "getForumTopics", args: { cityFilter } }).map(mapTopicRow);
}

export async function getTopicById(topicId: string): Promise<ForumTopicWithAuthor | null> {
  const supabase = await createClient();
  const result = await supabase
    .from("forum_topics")
    .select(
      `*, author:profiles!forum_topics_author_id_fkey(${PROFILE_COLUMNS}), upvotes:forum_upvotes(count), comments:forum_comments(count)`
    )
    .eq("id", topicId)
    .maybeSingle();
  if (!result.data) return null;
  return mapTopicRow(unwrap(result, { op: "getTopicById", args: { topicId } }));
}

export async function getTopicComments(topicId: string): Promise<(ForumComment & { author: ReturnType<typeof mapProfileRow> })[]> {
  const supabase = await createClient();
  const result = await supabase
    .from("forum_comments")
    .select(`*, author:profiles!forum_comments_author_id_fkey(${PROFILE_COLUMNS})`)
    .eq("topic_id", topicId)
    .order("created_at", { ascending: true });

  return unwrapList(result, { op: "getTopicComments", args: { topicId } }).map((row) => ({
    id: row.id as string,
    topicId: row.topic_id as string,
    authorId: row.author_id as string,
    content: row.content as string,
    createdAt: row.created_at as string,
    author: mapProfileRow(row.author as Record<string, unknown>),
  }));
}

export async function createForumTopic(
  authorId: string,
  data: { city: string; category: string; title: string; content: string }
) {
  const supabase = await createClient();
  const result = await supabase
    .from("forum_topics")
    .insert({ author_id: authorId, city: data.city, category: data.category, title: data.title, content: data.content })
    .select("*")
    .single();
  const row = unwrap(result, { op: "createForumTopic", args: { authorId, ...data } });
  return { ...mapTopicRow(row), upvotes: 0, commentCount: 0 };
}

export async function addForumComment(topicId: string, authorId: string, content: string) {
  const supabase = await createClient();
  const result = await supabase.from("forum_comments").insert({ topic_id: topicId, author_id: authorId, content }).select("*").single();
  const row = unwrap(result, { op: "addForumComment", args: { topicId, authorId } });
  return { id: row.id as string, topicId: row.topic_id as string, authorId: row.author_id as string, content: row.content as string, createdAt: row.created_at as string };
}

/** Join-table toggle, not an array push -- see T16 in docs/cutover-plan.md. */
export async function toggleTopicUpvote(topicId: string, userId: string) {
  const supabase = await createClient();
  const existing = await supabase.from("forum_upvotes").select("topic_id").eq("topic_id", topicId).eq("user_id", userId).maybeSingle();

  if (existing.data) {
    const result = await supabase.from("forum_upvotes").delete().eq("topic_id", topicId).eq("user_id", userId);
    unwrapVoid(result, { op: "toggleTopicUpvote.remove", args: { topicId, userId } });
    return { upvoted: false };
  }

  const result = await supabase.from("forum_upvotes").insert({ topic_id: topicId, user_id: userId });
  unwrapVoid(result, { op: "toggleTopicUpvote.add", args: { topicId, userId } });
  return { upvoted: true };
}

// ── Community vouches ──────────────────────────────

export async function getVouchesForUser(userId: string): Promise<CommunityVouchWithAuthor[]> {
  const supabase = await createClient();
  const result = await supabase
    .from("community_vouches")
    .select(`*, author:profiles!community_vouches_author_id_fkey(${PROFILE_COLUMNS})`)
    .eq("target_id", userId)
    .order("created_at", { ascending: false });

  return unwrapList(result, { op: "getVouchesForUser", args: { userId } }).map((row) => ({
    id: row.id as string,
    authorId: row.author_id as string,
    targetId: row.target_id as string,
    text: row.text as string,
    createdAt: row.created_at as string,
    author: mapProfileRow(row.author as Record<string, unknown>),
  }));
}

/** Newest vouches platform-wide, for the community hub sidebar. */
export async function getRecentVouches(limit = 3) {
  const supabase = await createClient();
  const result = await supabase
    .from("community_vouches")
    .select(`*, author:profiles!community_vouches_author_id_fkey(${PROFILE_COLUMNS}), target:profiles!community_vouches_target_id_fkey(${PROFILE_COLUMNS})`)
    .order("created_at", { ascending: false })
    .limit(limit);

  return unwrapList(result, { op: "getRecentVouches" }).map((row) => ({
    id: row.id as string,
    authorId: row.author_id as string,
    targetId: row.target_id as string,
    text: row.text as string,
    createdAt: row.created_at as string,
    author: mapProfileRow(row.author as Record<string, unknown>),
    target: mapProfileRow(row.target as Record<string, unknown>),
  }));
}

export async function addVouch(authorId: string, targetId: string, text: string) {
  const supabase = await createClient();
  const result = await supabase.from("community_vouches").insert({ author_id: authorId, target_id: targetId, text }).select("*").single();
  if (result.error?.code === "23505") {
    throw new AppError("conflict", "You have already vouched for this person.", result.error);
  }
  const row = unwrap(result, { op: "addVouch", args: { authorId, targetId } });
  return { id: row.id as string, authorId: row.author_id as string, targetId: row.target_id as string, text: row.text as string, createdAt: row.created_at as string };
}

// ── Emergency alerts ──────────────────────────────

export async function getEmergencyAlerts(): Promise<EmergencyAlertWithAuthor[]> {
  const supabase = await createClient();
  const result = await supabase
    .from("emergency_alerts")
    .select(`*, author:profiles!emergency_alerts_author_id_fkey(${PROFILE_COLUMNS})`)
    .order("created_at", { ascending: false });

  return unwrapList(result, { op: "getEmergencyAlerts" }).map((row) => ({
    id: row.id as string,
    authorId: row.author_id as string,
    locationName: row.location_name as string,
    description: row.description as string,
    contactInfo: row.contact_info as string,
    createdAt: row.created_at as string,
    isResolved: row.is_resolved as boolean,
    author: mapProfileRow(row.author as Record<string, unknown>),
  }));
}

export async function createEmergencyAlert(
  authorId: string,
  data: { locationName: string; description: string; contactInfo: string }
) {
  const supabase = await createClient();
  const result = await supabase
    .from("emergency_alerts")
    .insert({ author_id: authorId, location_name: data.locationName, description: data.description, contact_info: data.contactInfo })
    .select("*")
    .single();
  const row = unwrap(result, { op: "createEmergencyAlert", args: { authorId, ...data } });
  return { id: row.id as string, authorId: row.author_id as string, locationName: row.location_name as string, description: row.description as string, contactInfo: row.contact_info as string, createdAt: row.created_at as string, isResolved: row.is_resolved as boolean };
}
