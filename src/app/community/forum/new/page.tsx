"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createForumTopicAction } from "@/lib/actions/community";
import type { ForumTopicWithAuthor } from "@/types";

const CATEGORIES: ForumTopicWithAuthor["category"][] = ["Hosting Q&A", "Meetups & Coffee", "Visa & Nomad Tips", "Travel Buddies"];

export default function NewTopicPage() {
  const router = useRouter();
  const [city, setCity] = useState("Istanbul");
  const [category, setCategory] = useState<ForumTopicWithAuthor["category"]>("Hosting Q&A");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setPending(true);
    const result = await createForumTopicAction({ city, category, title, content });
    setPending(false);
    if (result.ok) {
      router.push(`/community/forum/${result.topic.id}`);
    } else {
      setError(result.error);
    }
  };

  return (
    <div className="page-padding">
      <div className="container container-sm">
        <div className="panel panel-padded">
          <h1 style={{ fontFamily: "var(--font-serif)", fontSize: "2rem", marginBottom: 8 }}>Start a Community Discussion</h1>
          <p className="text-secondary text-sm" style={{ marginBottom: 24 }}>
            Ask for local advice, share nomad tips, or organize a hangout.
          </p>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="form-group">
              <label className="form-label">City</label>
              <select className="form-select" value={city} onChange={(e) => setCity(e.target.value)}>
                <option value="Istanbul">Istanbul</option>
                <option value="Berlin">Berlin</option>
                <option value="Lisbon">Lisbon</option>
                <option value="Chiang Mai">Chiang Mai</option>
                <option value="Tokyo">Tokyo</option>
                <option value="Barcelona">Barcelona</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Category</label>
              <select
                className="form-select"
                value={category}
                onChange={(e) => setCategory(e.target.value as ForumTopicWithAuthor["category"])}
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Title</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. Recommended SIM card & mobile data plans in Istanbul?"
                value={title}
                maxLength={200}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Discussion Details</label>
              <textarea
                className="form-textarea"
                placeholder="Provide context or specific questions..."
                value={content}
                maxLength={5000}
                onChange={(e) => setContent(e.target.value)}
                required
                rows={6}
              />
            </div>

            {error && (
              <p role="alert" className="text-sm" style={{ color: "var(--color-danger, #d33)" }}>
                {error}
              </p>
            )}

            <button type="submit" className="btn btn-primary btn-full btn-lg" style={{ marginTop: 12 }} disabled={pending}>
              {pending ? "Publishing…" : "Publish Discussion"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
