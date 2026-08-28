"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { submitReviewAction } from "@/lib/actions/reviews";
import { LockIcon, StarIcon } from "@/components/Icons";
import styles from "./review.module.css";

export default function ReviewForm({
  requestId,
  targetId,
  targetFirstName,
  targetName,
}: {
  requestId: string;
  targetId: string;
  targetFirstName: string;
  targetName: string;
}) {
  const router = useRouter();
  const [rating, setRating] = useState(5);
  const [text, setText] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    startTransition(async () => {
      const result = await submitReviewAction({ stayRequestId: requestId, targetId, rating, text });
      if (result.ok) {
        setSubmitted(true);
      } else {
        setError(result.error);
      }
    });
  }

  if (submitted) {
    return (
      <div className={`panel panel-padded ${styles.card}`} style={{ textAlign: "center" }}>
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 16, color: "var(--primary)" }}>
          <LockIcon size={40} />
        </div>
        <h2 className="font-semibold text-xl">Review Submitted!</h2>
        <p className="text-secondary text-sm" style={{ marginTop: 8, marginBottom: 24, lineHeight: 1.6 }}>
          Thank you! To ensure honesty, 4dnomads uses a <strong>Double-Blind Review system</strong>. Your review will
          remain hidden until {targetFirstName} submits their review of you, or until 14 days have passed.
        </p>
        <button className="btn btn-primary" onClick={() => router.push("/dashboard")}>
          Return to Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className={`panel panel-padded ${styles.card}`}>
      <h1 className={`${styles.title} desktop-only`}>Write a Reference</h1>
      <p className="text-secondary text-sm text-center" style={{ marginBottom: 24 }}>
        Share your experience staying with or hosting <strong>{targetName}</strong>.
      </p>

      <form onSubmit={handleSubmit} className={styles.form}>
        <div className="form-group flex-col items-center">
          <label className="form-label">How was your stay overall?</label>
          <div className={styles.stars}>
            {[1, 2, 3, 4, 5].map((star) => (
              <button type="button" key={star} onClick={() => setRating(star)} className={styles.starBtn} aria-label={`${star} star${star > 1 ? "s" : ""}`}>
                <StarIcon size={32} fill={star <= rating ? "var(--amber-500)" : "none"} />
              </button>
            ))}
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">Describe your experience</label>
          <textarea
            className="form-textarea"
            placeholder={`Would you host or stay with ${targetFirstName} again? What did you do together?`}
            value={text}
            onChange={(e) => setText(e.target.value)}
            required
            rows={6}
            maxLength={3000}
          />
        </div>

        {error && (
          <p role="alert" className="text-sm" style={{ color: "var(--color-danger, #d33)" }}>
            {error}
          </p>
        )}

        <button type="submit" className="btn btn-primary btn-full btn-lg" style={{ marginTop: 16 }} disabled={pending}>
          {pending ? "Submitting…" : "Submit Review"}
        </button>
      </form>
    </div>
  );
}
