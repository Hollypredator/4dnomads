"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createPublicTripAction } from "@/lib/actions/community";
import { MobileHeader } from "@/components/MobileHeader";
import styles from "../../request/[hostId]/request.module.css";

export default function NewPublicTripPage() {
  const router = useRouter();
  const [destination, setDestination] = useState("");
  const [arrivalDate, setArrivalDate] = useState("");
  const [departureDate, setDepartureDate] = useState("");
  const [numberOfGuests, setNumberOfGuests] = useState(1);
  const [description, setDescription] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setPending(true);
    const result = await createPublicTripAction({ destination, arrivalDate, departureDate, numberOfGuests, description });
    setPending(false);
    if (result.ok) {
      router.push("/public-trips");
    } else {
      setError(result.error);
    }
  };

  return (
    <>
      <MobileHeader title="Create Travel Plan" backHref="/public-trips" />
      <div className={styles.page}>
      <div className={`panel panel-padded ${styles.card}`}>
        <h1 className={`${styles.title} desktop-only`} style={{ marginBottom: 24 }}>
          Create Travel Plan
        </h1>
        <p className="text-secondary text-sm text-center" style={{ marginBottom: 32 }}>
          Post your trip publicly so local hosts can browse and send you hosting invites!
        </p>

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className="form-group">
            <label className="form-label">Where are you going?</label>
            <input type="text" className="form-input" placeholder="e.g. Istanbul, Turkey" value={destination} maxLength={120} onChange={(e) => setDestination(e.target.value)} required />
          </div>

          <div className={styles.dateRow}>
            <div className="form-group">
              <label className="form-label">Arrival Date</label>
              <input type="date" className="form-input" value={arrivalDate} onChange={(e) => setArrivalDate(e.target.value)} required />
            </div>
            <div className="form-group">
              <label className="form-label">Departure Date</label>
              <input type="date" className="form-input" value={departureDate} onChange={(e) => setDepartureDate(e.target.value)} required />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Number of Guests</label>
            <select className="form-select" value={numberOfGuests} onChange={(e) => setNumberOfGuests(Number(e.target.value))} required>
              <option value={1}>1 Guest</option>
              <option value={2}>2 Guests</option>
              <option value={3}>3 Guests</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Tell hosts about your plans</label>
            <textarea
              className="form-textarea"
              placeholder="What are you excited to do? Tell potential hosts about yourself, what you are planning to explore, and what makes you a great guest!"
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
            {pending ? "Publishing…" : "Publish Trip"}
          </button>
        </form>
      </div>
      </div>
    </>
  );
}
