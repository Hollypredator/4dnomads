"use client";

import { useState, useTransition } from "react";
import { Avatar } from "@/components/Avatar";
import Link from "next/link";
import { toggleTopicUpvoteAction } from "@/lib/actions/community";
import { Reveal } from "@/components/Reveal";
import { ShieldCheckIcon, MessageIcon } from "@/components/Icons";
import type { ForumTopicWithAuthor } from "@/types";
import styles from "./community.module.css";

export default function CommunityTopics({ initialTopics, city }: { initialTopics: ForumTopicWithAuthor[]; city?: string }) {
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
      {topics.length === 0 && (
        <div className="empty-state">
          <div className="empty-state-icon">
            <MessageIcon size={40} />
          </div>
          <h3>{city ? `No discussions in ${city} yet` : "No discussions yet"}</h3>
          <p>Ask for local advice, share what you have learned, or find people to travel with.</p>
          <Link href="/community/forum/new" className="btn btn-primary" style={{ marginTop: 16 }}>
            Start a discussion
          </Link>
        </div>
      )}
      {topics.map((topic, i) => (
        <Reveal key={topic.id} delay={Math.min(i, 6) * 50}>
        <div className={`${styles.topicCard} press-card`}>
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
              <Avatar src={topic.author.avatarUrl} firstName={topic.author.firstName} lastName={topic.author.lastName} size="sm" />
              <span>
                {topic.author.firstName} {topic.author.lastName}
              </span>
              {topic.author.isVerified && <ShieldCheckIcon size={14} style={{ color: "var(--olive-600)" }} />}
            </div>

            <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 12 }}>
              <button className={styles.upvoteBtn} onClick={() => handleUpvote(topic.id)} disabled={pending}>
                ▲ {topic.upvotes}
              </button>
              <Link href={`/community/forum/${topic.id}`} className="text-xs text-secondary" style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                <MessageIcon size={13} /> {topic.commentCount} replies
              </Link>
            </div>
          </div>
        </div>
        </Reveal>
      ))}
    </div>
  );
}
