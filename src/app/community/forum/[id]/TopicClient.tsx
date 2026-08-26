"use client";

import { useState, useTransition } from "react";
import { addForumCommentAction, toggleTopicUpvoteAction } from "@/lib/actions/community";
import { ShieldCheckIcon } from "@/components/Icons";
import type { ForumTopicWithAuthor, ForumComment, User } from "@/types";

type CommentWithAuthor = ForumComment & { author: User };

export default function TopicClient({ topic, initialComments }: { topic: ForumTopicWithAuthor; initialComments: CommentWithAuthor[] }) {
  const [comments, setComments] = useState(initialComments);
  const [upvotes, setUpvotes] = useState(topic.upvotes);
  const [newComment, setNewComment] = useState("");
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();

  function handleCommentSubmit(e: React.FormEvent) {
    e.preventDefault();
    const content = newComment.trim();
    if (!content) return;
    setError("");

    startTransition(async () => {
      const result = await addForumCommentAction(topic.id, content);
      if (result.ok) {
        setComments((prev) => [...prev, { ...result.comment, author: topic.author }]); // best-effort author display until refresh
        setNewComment("");
      } else {
        setError(result.error);
      }
    });
  }

  function handleUpvote() {
    startTransition(async () => {
      const result = await toggleTopicUpvoteAction(topic.id);
      if (result.ok) setUpvotes((prev) => prev + (result.upvoted ? 1 : -1));
    });
  }

  return (
    <>
      <div className="panel panel-padded" style={{ marginBottom: 32 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <span className="badge badge-info">{topic.category}</span>
          <span className="text-xs text-secondary">{topic.city}</span>
        </div>

        <h1 style={{ fontFamily: "var(--font-serif)", fontSize: "2rem", marginBottom: 16 }}>{topic.title}</h1>

        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24, paddingBottom: 16, borderBottom: "1px solid var(--border)" }}>
          <div className="avatar avatar-md">{topic.author.firstName[0]}</div>
          <div>
            <span className="font-semibold text-sm">
              {topic.author.firstName} {topic.author.lastName}
            </span>
            <span className="text-xs text-secondary" style={{ display: "block" }}>
              Posted on {new Date(topic.createdAt).toLocaleDateString()}
            </span>
          </div>
          {topic.author.isVerified && <ShieldCheckIcon size={16} style={{ color: "var(--olive-600)" }} />}

          <button className="btn btn-secondary btn-sm" onClick={handleUpvote} disabled={pending} style={{ marginLeft: "auto" }}>
            ▲ Upvote ({upvotes})
          </button>
        </div>

        <p style={{ fontSize: "1rem", lineHeight: "1.7", color: "var(--text-primary)", whiteSpace: "pre-line" }}>{topic.content}</p>
      </div>

      <h2 style={{ fontFamily: "var(--font-serif)", fontSize: "1.5rem", marginBottom: 16 }}>Replies ({comments.length})</h2>

      <div className="flex flex-col gap-4" style={{ marginBottom: 32 }}>
        {comments.map((comment) => (
          <div key={comment.id} className="panel panel-padded">
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
              <div className="avatar avatar-sm">{comment.author.firstName[0]}</div>
              <div>
                <span className="font-semibold text-sm">
                  {comment.author.firstName} {comment.author.lastName}
                </span>
                <span className="text-xs text-secondary" style={{ display: "block" }}>
                  {new Date(comment.createdAt).toLocaleDateString()}
                </span>
              </div>
            </div>
            <p className="text-sm" style={{ lineHeight: "1.6" }}>
              {comment.content}
            </p>
          </div>
        ))}
      </div>

      <form onSubmit={handleCommentSubmit} className="panel panel-padded">
        <h3 style={{ fontSize: "1.1rem", fontWeight: 600, marginBottom: 12 }}>Join the discussion</h3>
        <div className="form-group">
          <textarea
            className="form-textarea"
            placeholder="Share your advice or thoughts..."
            value={newComment}
            maxLength={3000}
            onChange={(e) => setNewComment(e.target.value)}
            required
            rows={4}
          />
        </div>
        {error && (
          <p role="alert" className="text-sm" style={{ color: "var(--color-danger, #d33)" }}>
            {error}
          </p>
        )}
        <button type="submit" className="btn btn-primary" style={{ marginTop: 12 }} disabled={pending}>
          {pending ? "Posting…" : "Post Reply"}
        </button>
      </form>
    </>
  );
}
