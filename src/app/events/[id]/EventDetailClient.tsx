"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toggleEventRsvpAction } from "@/lib/actions/community";
import { sendMessageAction } from "@/lib/actions/messages";
import type { Message, User } from "@/types";
import styles from "./event-detail.module.css";

export function RsvpButton({ eventId, isAttending, loggedIn }: { eventId: string; isAttending: boolean; loggedIn: boolean }) {
  const router = useRouter();
  const [attending, setAttending] = useState(isAttending);
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();

  if (!loggedIn) {
    return (
      <button className="btn btn-primary" onClick={() => router.push("/login")}>
        Log in to Join
      </button>
    );
  }

  function toggle() {
    setError("");
    startTransition(async () => {
      const result = await toggleEventRsvpAction(eventId);
      if (result.ok) {
        setAttending(result.rsvped);
        router.refresh();
      } else {
        setError(result.error);
      }
    });
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4 }}>
      <button className={attending ? "btn btn-secondary" : "btn btn-primary"} onClick={toggle} disabled={pending}>
        {attending ? "Joined" : "Join Hangout"}
      </button>
      {error && (
        <span className="text-xs" style={{ color: "var(--color-danger, #d33)" }}>
          {error}
        </span>
      )}
    </div>
  );
}

export function EventChat({
  eventId,
  initialMessages,
  attendees,
  isAttending,
  currentUserId,
}: {
  eventId: string;
  initialMessages: Message[];
  attendees: User[];
  isAttending: boolean;
  currentUserId: string | null;
}) {
  const [messages, setMessages] = useState(initialMessages);
  const [text, setText] = useState("");
  const [pending, startTransition] = useTransition();
  const attendeeById = new Map(attendees.map((a) => [a.id, a]));

  function send() {
    const content = text.trim();
    if (!content) return;
    setText("");
    startTransition(async () => {
      const result = await sendMessageAction({ eventGroupId: eventId }, content);
      if (result.ok) setMessages((prev) => [...prev, result.message]);
    });
  }

  if (!isAttending) {
    return (
      <div className={styles.chatArea}>
        <p className="text-secondary text-sm" style={{ padding: 24, textAlign: "center" }}>
          RSVP to this hangout to see and join the group chat.
        </p>
      </div>
    );
  }

  return (
    <div className={styles.chatArea}>
      <div className={styles.messageList}>
        {messages.length === 0 && (
          <p className="text-secondary text-sm" style={{ textAlign: "center", padding: "16px 0" }}>
            No messages yet. Say hello!
          </p>
        )}
        {messages.map((msg) => {
          const sender = attendeeById.get(msg.senderId);
          const isMine = msg.senderId === currentUserId;
          return (
            <div key={msg.id} className={`${styles.bubble} ${isMine ? styles.sent : styles.received}`}>
              <span className={styles.senderName}>{sender?.firstName ?? "Someone"}</span>
              <p>{msg.content}</p>
            </div>
          );
        })}
      </div>
      <div className={styles.chatInput}>
        <input
          type="text"
          className="form-input"
          placeholder="Say hello to the group..."
          style={{ flex: 1 }}
          value={text}
          maxLength={5000}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && send()}
          disabled={pending}
        />
        <button className="btn btn-primary btn-sm" onClick={send} disabled={pending}>
          Send
        </button>
      </div>
    </div>
  );
}
