"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { sendMessageAction } from "@/lib/actions/messages";
import type { MessageThread, Message } from "@/types";
import styles from "./messages.module.css";

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

export default function MessagesClient({ threads, currentUserId }: { threads: MessageThread[]; currentUserId: string }) {
  const [activeThreadId, setActiveThreadId] = useState<string | null>(threads[0]?.stayRequest?.id ?? null);
  const [newMessage, setNewMessage] = useState("");
  const [optimistic, setOptimistic] = useState<Message[]>([]);
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();

  const activeThread = threads.find((t) => t.stayRequest?.id === activeThreadId);
  const allMessages = activeThread
    ? [...activeThread.messages, ...optimistic.filter((m) => m.stayRequestId === activeThreadId)]
    : [];

  function send() {
    const content = newMessage.trim();
    if (!content || !activeThreadId) return;
    setError("");
    setNewMessage("");

    startTransition(async () => {
      const result = await sendMessageAction({ stayRequestId: activeThreadId }, content);
      if (result.ok) {
        setOptimistic((prev) => [...prev, result.message]);
      } else {
        setError(result.error);
      }
    });
  }

  return (
    <div className={styles.layout}>
      {/* Thread List */}
      <aside className={styles.sidebar}>
        <div className={styles.sidebarHeader}>
          <h2>Messages</h2>
        </div>
        <div className={styles.threadList}>
          {threads.length > 0 ? (
            threads.map((thread) => {
              const otherUser = thread.otherUser;
              const requestId = thread.stayRequest?.id ?? `thread-${thread.lastMessage.id}`;
              const firstName = otherUser?.firstName ?? "User";
              const lastName = otherUser?.lastName ?? "";
              const initials = `${firstName[0] || "U"}${lastName[0] || ""}`;
              const isActive = requestId === activeThreadId;
              return (
                <button key={requestId} className={`${styles.threadItem} ${isActive ? styles.threadActive : ""}`} onClick={() => setActiveThreadId(requestId)}>
                  <div className="avatar avatar-md">{initials}</div>
                  <div className={styles.threadInfo}>
                    <div className={styles.threadTop}>
                      <span className="font-semibold text-sm">{firstName}</span>
                      <span className="text-xs text-secondary">{timeAgo(thread.lastMessage.createdAt)}</span>
                    </div>
                    <p className={styles.threadPreview}>{thread.lastMessage.content.slice(0, 50)}…</p>
                  </div>
                  {thread.unreadCount > 0 && <span className={styles.unreadBadge}>{thread.unreadCount}</span>}
                </button>
              );
            })
          ) : (
            <div className={styles.emptyThreads}>
              <p className="text-secondary text-sm">No conversations yet. Once a stay request is accepted, you can message here.</p>
            </div>
          )}
        </div>
      </aside>

      {/* Chat Area */}
      <div className={styles.chat}>
        {activeThread && activeThread.otherUser ? (
          <>
            <div className={styles.chatHeader}>
              <div className={styles.chatHeaderInfo}>
                <div className="avatar avatar-md">
                  {activeThread.otherUser.firstName[0]}
                  {activeThread.otherUser.lastName[0]}
                </div>
                <div>
                  <span className="font-semibold">
                    {activeThread.otherUser.firstName} {activeThread.otherUser.lastName}
                  </span>
                  {activeThread.stayRequest && (
                    <span className="text-xs text-secondary" style={{ display: "block" }}>
                      {activeThread.stayRequest.arrivalDate} → {activeThread.stayRequest.departureDate}
                    </span>
                  )}
                </div>
              </div>
              <Link href={`/profile/${activeThread.otherUser.id}`} className="btn btn-ghost btn-sm">
                View Profile
              </Link>
            </div>

            <div className={styles.messageList}>
              {allMessages.length === 0 && (
                <p className="text-secondary text-sm" style={{ textAlign: "center", padding: "24px 0" }}>
                  Say hello to get started.
                </p>
              )}
              {allMessages.map((msg) => {
                const isMine = msg.senderId === currentUserId;
                return (
                  <div key={msg.id} className={`${styles.bubble} ${isMine ? styles.sent : styles.received}`}>
                    <p>{msg.content}</p>
                    <span className={styles.bubbleTime}>{timeAgo(msg.createdAt)}</span>
                  </div>
                );
              })}
            </div>

            {error && (
              <p role="alert" className="text-sm" style={{ color: "var(--color-danger, #d33)", padding: "0 16px" }}>
                {error}
              </p>
            )}

            <div className={styles.chatInput}>
              <input
                type="text"
                className="form-input"
                placeholder="Type a message..."
                value={newMessage}
                maxLength={5000}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && send()}
                style={{ flex: 1, borderRadius: "var(--radius-full)" }}
                disabled={pending}
              />
              <button className="btn btn-primary" onClick={send} disabled={pending}>
                Send
              </button>
            </div>
          </>
        ) : (
          <div className={styles.emptyChatState}>
            <div style={{ fontSize: "3rem", marginBottom: 16 }}>💬</div>
            <h3>Select a conversation</h3>
            <p className="text-secondary text-sm">Choose a thread from the sidebar to start chatting.</p>
          </div>
        )}
      </div>
    </div>
  );
}
