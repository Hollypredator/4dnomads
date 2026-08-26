"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { toggleTopicUpvoteAction } from "@/lib/actions/community";
import { ShieldCheckIcon } from "@/components/Icons";
import type { ForumTopicWithAuthor } from "@/types";
import styles from "./community.module.css";

export default function CommunityTopics({ initialTopics }: { initialTopics: ForumTopicWithAuthor[] }) {
  const [topics, setTopics] = useState(initialTopics);
  const [pending, startTransition] = useTransition();

  function handleUpvote(topicId: string) {
    startTransition(async () => {
      const result = await toggleTopicUpvoteAction(topicId);
      if (result.ok) {
        setTopics((prev) => prev.map((t) => (t.id === topicId ? { ...t, upvotes: t.upvotes + (result.upvoted ? 1 : -1) } : t)));
      }
    });
  }

  return (
    <div className={styles.topicsList}>
      {topics.length === 0 && <p className="text-secondary text-sm">No discussions yet. Start one!</p>}
      {topics.map((topic) => (
        <div key={topic.id} className={styles.topicCard}>
          <div className={styles.topicTop}>
            <span className="badge badge-info">{topic.category}</span>
            <span className="text-xs text-secondary">{topic.city}</span>
          </div>

          <Link href={`/community/forum/${topic.id}`} className={styles.topicTitle}>
            {topic.title}
          </Link>
          <p className="text-secondary text-sm">{topic.content.slice(0, 140)}…</p>

          <div className={styles.topicMeta}>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <div className="avatar avatar-sm">{topic.author.firstName[0]}</div>
              <span>
                {topic.author.firstName} {topic.author.lastName}
              </span>
              {topic.author.isVerified && <ShieldCheckIcon size={14} style={{ color: "var(--olive-600)" }} />}
            </div>

            <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 12 }}>
              <button className={styles.upvoteBtn} onClick={() => handleUpvote(topic.id)} disabled={pending}>
                ▲ {topic.upvotes}
              </button>
              <Link href={`/community/forum/${topic.id}`} className="text-xs text-secondary">
                💬 {topic.commentCount} replies
              </Link>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
