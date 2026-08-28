"use client";



import { useState } from "react";
import { useRouter } from "next/navigation";
import { createLocalEventAction } from "@/lib/actions/community";
import { MobileHeader } from "@/components/MobileHeader";
import styles from "../../request/[hostId]/request.module.css";

export default function NewEventPage() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [locationName, setLocationName] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [eventTime, setEventTime] = useState("");
  const [maxParticipants, setMaxParticipants] = useState(15);
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setPending(true);
    const result = await createLocalEventAction({ title, description, locationName, eventDate, eventTime, maxParticipants });
    setPending(false);
    if (result.ok) {
      router.push("/events");
    } else {
      setError(result.error);
    }
  };

  return (
    <>
      <MobileHeader title="Create Hangout" backHref="/events" />
      <div className={styles.page}>
      <div className={`panel panel-padded ${styles.card}`}>
        <h1 className={`${styles.title} desktop-only`} style={{ marginBottom: 24 }}>Create Hangout</h1>
        <p className="text-secondary text-sm text-center" style={{ marginBottom: 32 }}>
          Organize a coffee meetup, a city walk, or a group dinner and connect with travelers nearby!
        </p>

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className="form-group">
            <label className="form-label">Event Title</label>
            <input
              type="text"
              className="form-input"
              placeholder="e.g. Traditional Turkish Tea & Chats"
              value={title}
              maxLength={150}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Where is it happening?</label>
            <input
              type="text"
              className="form-input"
              placeholder="e.g. Kadikoy Ferry Station Bull Statue"
              value={locationName}
              maxLength={120}
              onChange={(e) => setLocationName(e.target.value)}
              required
            />
          </div>

          <div className={styles.dateRow}>
            <div className="form-group">
              <label className="form-label">Date</label>
              <input
                type="date"
                className="form-input"
                value={eventDate}
                onChange={(e) => setEventDate(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Time</label>
              <input
                type="time"
                className="form-input"
                value={eventTime}
                onChange={(e) => setEventTime(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Maximum Participants</label>
            <input
              type="number"
              className="form-input"
              value={maxParticipants}
              onChange={(e) => setMaxParticipants(Number(e.target.value))}
              required
              min={2}
              max={500}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Description</label>
            <textarea
              className="form-textarea"
              placeholder="What will you do? What should attendees bring? Be descriptive!"
              value={description}
              maxLength={2000}
              onChange={(e) => setDescription(e.target.value)}
              required
              rows={6}
            />
          </div>

          {error && (
            <p role="alert" className="text-sm" style={{ color: "var(--color-danger, #d33)" }}>
              {error}
            </p>
          )}

          <button type="submit" className="btn btn-primary btn-full btn-lg" style={{ marginTop: 16 }} disabled={pending}>
            {pending ? "Publishing…" : "Publish Event"}
          </button>
        </form>
      </div>
      </div>
    </>
  );
}
