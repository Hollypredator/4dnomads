"use client";

import { useState, useTransition } from "react";
import { Avatar } from "@/components/Avatar";
import Link from "next/link";
import { sendMessageAction } from "@/lib/actions/messages";
import { ArrowLeftIcon, MessageIcon } from "@/components/Icons";
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
  // Starts with nothing selected (rather than auto-opening threads[0]) so
  // mobile, which shows only one pane at a time, opens on the thread list
  // instead of dropping straight into a chat the user never chose.
  const [activeThreadId, setActiveThreadId] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState("");
  const [optimistic, setOptimistic] = useState<Message[]>([]);
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();

  // A thread is keyed by whichever side it has -- a 1:1 stay request or a
  // group event chat -- so the two thread kinds can share one selection/send
  // path instead of the UI only ever knowing about stay requests.
  const threadKey = (t: MessageThread) => t.stayRequest?.id ?? t.eventGroup?.id ?? `thread-${t.lastMessage.id}`;
  const activeThread = threads.find((t) => threadKey(t) === activeThreadId);
  const allMessages = activeThread
    ? [
        ...activeThread.messages,
        ...optimistic.filter((m) => m.stayRequestId === activeThreadId || m.eventGroupId === activeThreadId),
      ]
    : [];

  function send() {
    const content = newMessage.trim();
    if (!content || !activeThreadId || !activeThread) return;
    setError("");
    setNewMessage("");

    const target = activeThread.stayRequest ? { stayRequestId: activeThreadId } : { eventGroupId: activeThreadId };

    startTransition(async () => {
      const result = await sendMessageAction(target, content);
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
      <aside className={`${styles.sidebar} ${activeThreadId ? styles.mobileHidden : ""}`}>
        <div className={styles.sidebarHeader}>
          <h2>Messages</h2>
        </div>
        <div className={styles.threadList}>
          {threads.length > 0 ? (
            threads.map((thread) => {
              const otherUser = thread.otherUser;
              const threadId = threadKey(thread);
              const displayName = otherUser ? otherUser.firstName : (thread.eventGroup?.title ?? "Group chat");
              const initials = otherUser
                ? `${otherUser.firstName[0] || "U"}${otherUser.lastName[0] || ""}`
                : (thread.eventGroup?.title[0] ?? "G");
              const isActive = threadId === activeThreadId;
              return (
                <button key={threadId} className={`${styles.threadItem} ${isActive ? styles.threadActive : ""}`} onClick={() => setActiveThreadId(threadId)}>
                  <div className="avatar avatar-md">{initials}</div>
                  <div className={styles.threadInfo}>
                    <div className={styles.threadTop}>
                      <span className="font-semibold text-sm">{displayName}</span>
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
              <p className="text-secondary text-sm">No conversations yet. Once a stay request is accepted or you RSVP to an event, you can message here.</p>
            </div>
          )}
        </div>
      </aside>

      {/* Chat Area */}
      <div className={`${styles.chat} ${!activeThreadId ? styles.mobileHidden : ""}`}>
        {activeThread && (activeThread.otherUser || activeThread.eventGroup) ? (
          <>
            <div className={styles.chatHeader}>
              <div className={styles.chatHeaderInfo}>
                <button className={styles.backButton} onClick={() => setActiveThreadId(null)} aria-label="Back to conversations">
                  <ArrowLeftIcon size={20} />
                </button>
                {activeThread.otherUser ? (
                  <>
                    <Avatar src={activeThread.otherUser.avatarUrl} firstName={activeThread.otherUser.firstName} lastName={activeThread.otherUser.lastName} size="md" />
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
                  </>
                ) : (
                  <div className="avatar avatar-md">{activeThread.eventGroup!.title[0] ?? "G"}</div>
                )}
                {!activeThread.otherUser && activeThread.eventGroup && (
                  <div>
                    <span className="font-semibold">{activeThread.eventGroup.title}</span>
                    <span className="text-xs text-secondary" style={{ display: "block" }}>
                      {activeThread.eventGroup.eventDate} · Group chat
                    </span>
                  </div>
                )}
              </div>
              {activeThread.otherUser ? (
                <Link href={`/profile/${activeThread.otherUser.id}`} className="btn btn-ghost btn-sm">
                  View Profile
                </Link>
              ) : (
                activeThread.eventGroup && (
                  <Link href={`/events/${activeThread.eventGroup.id}`} className="btn btn-ghost btn-sm">
                    View Event
                  </Link>
                )
              )}
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
            <div style={{ marginBottom: 16, color: "var(--text-tertiary)" }}>
              <MessageIcon size={40} />
            </div>
            <h3>Select a conversation</h3>
            <p className="text-secondary text-sm">Choose a thread from the sidebar to start chatting.</p>
          </div>
        )}
      </div>
    </div>
  );
}
