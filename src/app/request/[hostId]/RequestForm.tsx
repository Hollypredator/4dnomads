"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createStayRequestAction } from "@/lib/actions/requests";
import styles from "./request.module.css";

export default function RequestForm({ hostId, homeId, maxGuests }: { hostId: string; homeId: string; maxGuests: number }) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    const formData = new FormData(e.currentTarget);

    startTransition(async () => {
      const result = await createStayRequestAction({
        hostId,
        homeId,
        arrivalDate: String(formData.get("arrivalDate")),
        departureDate: String(formData.get("departureDate")),
        numberOfGuests: Number(formData.get("numberOfGuests")),
        initialMessage: String(formData.get("initialMessage")),
      });
      if (result.ok) {
        router.push("/dashboard");
      } else {
        setError(result.error);
      }
    });
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      <div className={styles.dateRow}>
        <div className="form-group">
          <label className="form-label">Arrival Date</label>
          <input type="date" name="arrivalDate" className="form-input" required />
        </div>
        <div className="form-group">
          <label className="form-label">Departure Date</label>
          <input type="date" name="departureDate" className="form-input" required />
        </div>
      </div>

      <div className="form-group">
        <label className="form-label">Number of Guests</label>
        <select name="numberOfGuests" className="form-select" required>
          {Array.from({ length: maxGuests }, (_, i) => (
            <option key={i + 1} value={i + 1}>
              {i + 1} Guest{i > 0 ? "s" : ""}
            </option>
          ))}
        </select>
      </div>

      <div className="form-group">
        <label className="form-label">Message to Host</label>
        <textarea
          name="initialMessage"
          className="form-textarea"
          placeholder="Introduce yourself! Tell the host why you want to stay and what your plans are."
          required
          rows={5}
          maxLength={3000}
        />
        <span className="form-hint">Personal messages get 3x more acceptances than generic ones.</span>
      </div>

      {error && (
        <p role="alert" className="text-sm" style={{ color: "var(--color-danger, #d33)" }}>
          {error}
        </p>
      )}

      <button type="submit" className="btn btn-primary btn-full btn-lg" disabled={pending}>
        {pending ? "Sending…" : "Send Request"}
      </button>
    </form>
  );
}
