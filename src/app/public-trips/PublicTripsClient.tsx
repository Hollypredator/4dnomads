"use client";

import { useState } from "react";
import Link from "next/link";
import { SearchIcon, MapPinIcon, CalendarIcon, UserIcon, ShieldCheckIcon, GlobeIcon } from "@/components/Icons";
import { Reveal } from "@/components/Reveal";
import type { PublicTripWithUser } from "@/types";
import styles from "./trips.module.css";

export default function PublicTripsClient({ trips }: { trips: PublicTripWithUser[] }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [invitesSent, setInvitesSent] = useState<Record<string, boolean>>({});

  const filteredTrips = trips.filter((trip) => trip.destination.toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Public Trips</h1>
          <p className="text-secondary text-sm">See who is coming to your city and invite them to stay.</p>
        </div>
        <Link href="/public-trips/new" className="btn btn-primary">
          + Create Travel Plan
        </Link>
      </header>

      <div className={styles.searchBar}>
        <SearchIcon className={styles.searchIcon} size={20} />
        <input type="text" className={styles.searchInput} placeholder="Search destination city..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} maxLength={120} />
      </div>

      {filteredTrips.length > 0 ? (
        <div className={styles.grid}>
          {filteredTrips.map((trip, i) => {
            const initials = `${trip.traveler.firstName[0]}${trip.traveler.lastName[0]}`;
            const isInvited = invitesSent[trip.id];
            return (
              <Reveal key={trip.id} delay={Math.min(i, 6) * 50}>
              <div className="panel panel-hover panel-padded press-card flex flex-col justify-between">
                <div>
                  <div className={styles.userSection}>
                    <div className="avatar avatar-md">{initials}</div>
                    <div>
                      <Link href={`/profile/${trip.traveler.id}`} className={styles.userName}>
                        {trip.traveler.firstName} {trip.traveler.lastName}
                      </Link>
                      {trip.traveler.isVerified && (
                        <span className="badge badge-verified" style={{ marginLeft: 8 }}>
                          <ShieldCheckIcon size={12} /> Verified
                        </span>
                      )}
                      <span className={styles.dateText}>Posted {new Date(trip.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>

                  <div className={styles.tripMeta} style={{ marginTop: 12 }}>
                    <h3 style={{ display: "flex", alignItems: "center", gap: 6, fontSize: "1.25rem" }}>
                      <MapPinIcon size={18} style={{ color: "var(--terracotta-500)" }} /> {trip.destination}
                    </h3>
                    <p className="text-secondary text-sm" style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 4 }}>
                      <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                        <CalendarIcon size={14} /> {trip.arrivalDate} → {trip.departureDate}
                      </span>
                      <span>·</span>
                      <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                        <UserIcon size={14} /> {trip.numberOfGuests} Traveler{trip.numberOfGuests > 1 ? "s" : ""}
                      </span>
                    </p>
                  </div>

                  <p className={styles.description} style={{ marginTop: 12 }}>
                    &quot;{trip.description}&quot;
                  </p>
                </div>

                <div className={styles.actions} style={{ marginTop: 16 }}>
                  {isInvited ? (
                    <span className="badge badge-accepted">
                      <ShieldCheckIcon size={14} /> Invite Sent
                    </span>
                  ) : (
                    <button className="btn btn-secondary btn-sm" onClick={() => setInvitesSent((prev) => ({ ...prev, [trip.id]: true }))}>
                      Invite to Stay
                    </button>
                  )}
                  <Link href={`/profile/${trip.traveler.id}`} className="btn btn-ghost btn-sm">
                    View Profile
                  </Link>
                </div>
              </div>
              </Reveal>
            );
          })}
        </div>
      ) : (
        <div className={styles.empty}>
          <div style={{ color: "var(--terracotta-500)", marginBottom: 16 }}>
            <GlobeIcon size={48} />
          </div>
          <h3>No trips found</h3>
          <p className="text-secondary text-sm">Be the first to post a trip for this destination!</p>
        </div>
      )}
    </>
  );
}
