"use client";

import { useState, useTransition } from "react";
import { Avatar } from "@/components/Avatar";
import Link from "next/link";
import { createEmergencyAlertAction } from "@/lib/actions/community";
import { HeartIcon, ShieldCheckIcon, AlertIcon, MapPinIcon } from "@/components/Icons";
import { MobileHeader } from "@/components/MobileHeader";
import type { EmergencyAlertWithAuthor } from "@/types";

export default function EmergencyClient({ initialAlerts }: { initialAlerts: EmergencyAlertWithAuthor[] }) {
  const [alerts, setAlerts] = useState(initialAlerts);
  const [showForm, setShowForm] = useState(false);
  const [locationName, setLocationName] = useState("");
  const [description, setDescription] = useState("");
  const [contactInfo, setContactInfo] = useState("");
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    startTransition(async () => {
      const result = await createEmergencyAlertAction({ locationName, description, contactInfo });
      if (result.ok) {
        setAlerts((prev) => [{ ...result.alert, author: alerts[0]?.author ?? result.alert }, ...prev]);
        setShowForm(false);
        setLocationName("");
        setDescription("");
        setContactInfo("");
      } else {
        setError(result.error);
      }
    });
  }

  return (
    <>
      <MobileHeader title="Emergency Network" backHref="/community" />
      <div className="page-padding">
      <div className="container container-md">
        <Link href="/community" className="btn btn-ghost btn-sm desktop-only" style={{ marginBottom: 24 }}>
          ← Back to Community
        </Link>

        {/* Icon stacked above the title rather than beside it: at 32px the
            heading wraps to three lines on a phone, and a side-by-side icon
            ends up floating against the middle of that block. */}
        <header style={{ marginBottom: 32 }}>
          <div style={{ color: "var(--error)", marginBottom: 12 }}>
            <HeartIcon size={36} />
          </div>
          <h1 style={{ fontSize: "var(--font-size-3xl)", marginBottom: 8 }}>Emergency Hospitality Network</h1>
          <p className="text-secondary text-sm" style={{ maxWidth: 640 }}>
            Facing a flight cancellation, sudden eviction, or safety emergency? Post an urgent 24-hour stay alert. Local hosts will reach out
            immediately.
          </p>
        </header>

        <button className="btn btn-danger btn-lg" style={{ marginBottom: 32, display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 8 }} onClick={() => setShowForm(!showForm)}>
          {!showForm && <AlertIcon size={18} />} {showForm ? "Cancel Alert Request" : "Send Urgent Emergency Stay Alert"}
        </button>

        {showForm && (
          <form onSubmit={handleSubmit} className="panel panel-padded flex flex-col gap-4" style={{ marginBottom: 32, borderColor: "var(--m3-error-container)", background: "var(--error-light)" }}>
            <h3 style={{ color: "var(--m3-on-error-container)" }}>Emergency Stay Form</h3>
            <div className="form-group">
              <label className="form-label">Location (City & Area)</label>
              <input type="text" className="form-input" placeholder="e.g. Barcelona, El Prat Airport" value={locationName} maxLength={120} onChange={(e) => setLocationName(e.target.value)} required />
            </div>
            <div className="form-group">
              <label className="form-label">What is your emergency situation?</label>
              <textarea
                className="form-textarea"
                placeholder="Describe your situation clearly (e.g. flight cancelled overnight, luggage lost, need sofa for 1 night)..."
                value={description}
                maxLength={2000}
                onChange={(e) => setDescription(e.target.value)}
                required
                rows={4}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Direct Contact Info (WhatsApp / Phone / Telegram)</label>
              <input type="text" className="form-input" placeholder="e.g. +34 612 345 678" value={contactInfo} maxLength={300} onChange={(e) => setContactInfo(e.target.value)} required />
            </div>
            {error && (
              <p role="alert" className="text-sm" style={{ color: "var(--color-danger, #d33)" }}>
                {error}
              </p>
            )}
            <button type="submit" className="btn btn-danger btn-full" disabled={pending}>
              {pending ? "Posting…" : "Post Emergency Alert Now"}
            </button>
          </form>
        )}

        <div className="flex flex-col gap-4">
          {alerts.length === 0 && (
            <div className="empty-state">
              <div className="empty-state-icon">
                <HeartIcon size={40} />
              </div>
              <h3>No active alerts</h3>
              <p>
                Nobody needs emergency hosting right now. If that changes, alerts appear here and stay
                up for 24 hours.
              </p>
            </div>
          )}
          {alerts.map((alert) => (
            <div key={alert.id} className="panel panel-padded" style={{ borderLeft: "4px solid var(--error)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <Avatar src={alert.author.avatarUrl} firstName={alert.author.firstName} lastName={alert.author.lastName} size="md" />
                  <div>
                    <span className="font-semibold">
                      {alert.author.firstName} {alert.author.lastName}
                    </span>
                    {alert.author.isVerified && <ShieldCheckIcon size={14} style={{ color: "var(--olive-600)", marginLeft: 6 }} />}
                    <span className="text-xs text-secondary" style={{ display: "block" }}>
                      Posted {new Date(alert.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>
                </div>

                <span className="badge badge-declined" style={{ background: "var(--error-light)", color: "var(--m3-on-error-container)", display: "inline-flex", alignItems: "center", gap: 4 }}>
                  <MapPinIcon size={13} /> {alert.locationName}
                </span>
              </div>

              <p style={{ fontSize: "0.95rem", lineHeight: "1.6", marginBottom: 16 }}>&quot;{alert.description}&quot;</p>

              <div style={{ padding: 12, background: "var(--sand-50)", borderRadius: "var(--radius-md)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span className="text-xs font-semibold">Contact Host Directly: {alert.contactInfo}</span>
                <a href={`https://wa.me/${alert.contactInfo.replace(/[^0-9]/g, "")}`} target="_blank" rel="noopener noreferrer" className="btn btn-success btn-sm">
                  Contact on WhatsApp
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
    </>
  );
}
