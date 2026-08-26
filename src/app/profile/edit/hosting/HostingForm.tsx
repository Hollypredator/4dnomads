"use client";

import { useState, useTransition } from "react";
import { upsertHomeAction } from "@/lib/actions/homes";
import type { Home, HostingStatus } from "@/types";
import styles from "./hosting.module.css";

type HomeInput = Omit<Home, "id" | "hostId">;

export default function HostingForm({ home }: { home: HomeInput }) {
  const [hostingStatus, setHostingStatus] = useState<HostingStatus>(home.hostingStatus);
  const [maxGuests, setMaxGuests] = useState(home.maxGuests);
  const [sleepingArrangement, setSleepingArrangement] = useState(home.sleepingArrangement);
  const [smokingPolicy, setSmokingPolicy] = useState<Home["smokingPolicy"]>(home.smokingPolicy);
  const [petsInfo, setPetsInfo] = useState(home.petsInfo);
  const [genderPreference, setGenderPreference] = useState<Home["genderPreference"]>(home.genderPreference);
  const [kidFriendly, setKidFriendly] = useState(home.kidFriendly);
  const [wheelchairAccessible, setWheelchairAccessible] = useState(home.wheelchairAccessible);
  const [houseRules, setHouseRules] = useState(home.houseRules);
  const [locationName, setLocationName] = useState(home.locationName);
  const [latitude, setLatitude] = useState(home.latitude);
  const [longitude, setLongitude] = useState(home.longitude);
  const [blockoutDates, setBlockoutDates] = useState<string[]>(home.blockoutDates);
  const [successMsg, setSuccessMsg] = useState(false);
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();

  const toggleBlockoutDate = (date: string) => {
    setBlockoutDates((prev) => (prev.includes(date) ? prev.filter((d) => d !== date) : [...prev, date]));
  };

  function handleSave() {
    setError("");
    startTransition(async () => {
      const result = await upsertHomeAction({
        sleepingArrangement,
        maxGuests,
        houseRules,
        locationName,
        latitude,
        longitude,
        smokingPolicy,
        petsInfo,
        amenities: home.amenities,
        hostingStatus,
        genderPreference,
        kidFriendly,
        wheelchairAccessible,
        blockoutDates,
      });
      if (result.ok) {
        setSuccessMsg(true);
        setTimeout(() => setSuccessMsg(false), 3000);
      } else {
        setError(result.error);
      }
    });
  }

  const calendarDays = Array.from({ length: 30 }, (_, i) => {
    const dayNum = i + 1;
    const dateStr = `2026-09-${dayNum < 10 ? `0${dayNum}` : dayNum}`;
    return { dayNum, dateStr };
  });

  return (
    <>
      {successMsg && (
        <div className="badge badge-accepted btn-full" style={{ padding: 12, marginBottom: 24, fontSize: 14 }}>
          ✓ Hosting preferences and calendar saved successfully!
        </div>
      )}
      {error && (
        <p role="alert" className="text-sm" style={{ color: "var(--color-danger, #d33)", marginBottom: 16 }}>
          {error}
        </p>
      )}

      <div className={styles.grid}>
        <div className="panel panel-padded flex flex-col gap-5">
          <h2 className="font-semibold text-lg">Hosting Preferences</h2>
          <hr className="divider" />

          <div className="form-group">
            <label className="form-label">Neighborhood / Area Name</label>
            <input type="text" className="form-input" value={locationName} maxLength={120} onChange={(e) => setLocationName(e.target.value)} placeholder="e.g. Kadikoy, Istanbul" required />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <div className="form-group">
              <label className="form-label">Latitude</label>
              <input type="number" step="any" className="form-input" value={latitude} onChange={(e) => setLatitude(Number(e.target.value))} required />
            </div>
            <div className="form-group">
              <label className="form-label">Longitude</label>
              <input type="number" step="any" className="form-input" value={longitude} onChange={(e) => setLongitude(Number(e.target.value))} required />
            </div>
          </div>
          <p className="text-secondary text-xs" style={{ marginTop: -12 }}>
            Only an approximate area is ever shown publicly -- your exact location is never stored. See the privacy note in the platform
            rules.
          </p>

          <div className="form-group">
            <label className="form-label">Hosting Availability Status</label>
            <select className="form-select" value={hostingStatus} onChange={(e) => setHostingStatus(e.target.value as HostingStatus)}>
              <option value="accepting">Accepting Guests</option>
              <option value="maybe">Maybe Accepting Guests</option>
              <option value="not_accepting">Not Accepting Guests</option>
              <option value="wants_to_meet">Wants to Meet Up Only</option>
            </select>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <div className="form-group">
              <label className="form-label">Max Guests Allowed</label>
              <input type="number" className="form-input" value={maxGuests} onChange={(e) => setMaxGuests(Number(e.target.value))} min={1} max={20} />
            </div>
            <div className="form-group">
              <label className="form-label">Sleeping Arrangement</label>
              <input
                type="text"
                className="form-input"
                value={sleepingArrangement}
                maxLength={200}
                onChange={(e) => setSleepingArrangement(e.target.value)}
                placeholder="e.g. Private Room, Shared Couch"
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Gender Preference</label>
            <select className="form-select" value={genderPreference} onChange={(e) => setGenderPreference(e.target.value as Home["genderPreference"])}>
              <option value="Any">Any Gender</option>
              <option value="Males only">Males only</option>
              <option value="Females only">Females only</option>
            </select>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <div className="form-group">
              <label className="form-label">Smoking Policy</label>
              <select className="form-select" value={smokingPolicy} onChange={(e) => setSmokingPolicy(e.target.value as Home["smokingPolicy"])}>
                <option value="Not allowed">Not allowed inside</option>
                <option value="Outside only">Outside only</option>
                <option value="Allowed">Allowed anywhere</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Pets Description</label>
              <input type="text" className="form-input" value={petsInfo} maxLength={500} onChange={(e) => setPetsInfo(e.target.value)} placeholder="e.g. Dog, Cat, or None" />
            </div>
          </div>

          <div className="flex gap-4">
            <label className="flex items-center gap-2" style={{ cursor: "pointer" }}>
              <input type="checkbox" checked={kidFriendly} onChange={(e) => setKidFriendly(e.target.checked)} />
              <span className="text-sm font-medium">Kid Friendly</span>
            </label>
            <label className="flex items-center gap-2" style={{ cursor: "pointer" }}>
              <input type="checkbox" checked={wheelchairAccessible} onChange={(e) => setWheelchairAccessible(e.target.checked)} />
              <span className="text-sm font-medium">Wheelchair Accessible</span>
            </label>
          </div>

          <div className="form-group">
            <label className="form-label">House Rules</label>
            <textarea className="form-textarea" value={houseRules} maxLength={2000} onChange={(e) => setHouseRules(e.target.value)} placeholder="Write your home guidelines..." rows={4} />
          </div>

          <button className="btn btn-primary" onClick={handleSave} disabled={pending}>
            {pending ? "Saving…" : "Save Preferences"}
          </button>
        </div>

        <div className="panel panel-padded flex flex-col gap-4">
          <h2 className="font-semibold text-lg">Calendar Blockouts</h2>
          <p className="text-secondary text-sm">Click on dates to block them out. Surfers won&apos;t be able to request stays on blocked dates.</p>
          <hr className="divider" />

          <div className={styles.calendarHeader}>
            <span className="font-bold text-sm">September 2026</span>
          </div>

          <div className={styles.calendarGrid}>
            {calendarDays.map(({ dayNum, dateStr }) => {
              const isBlocked = blockoutDates.includes(dateStr);
              return (
                <button key={dateStr} onClick={() => toggleBlockoutDate(dateStr)} className={`${styles.calendarDay} ${isBlocked ? styles.dayBlocked : ""}`}>
                  <span>{dayNum}</span>
                  {isBlocked && <span className={styles.blockedBadge}>Blocked</span>}
                </button>
              );
            })}
          </div>
          <button className="btn btn-secondary btn-full" onClick={handleSave} disabled={pending} style={{ marginTop: "auto" }}>
            {pending ? "Saving…" : "Save Blockout Calendar"}
          </button>
        </div>
      </div>
    </>
  );
}
