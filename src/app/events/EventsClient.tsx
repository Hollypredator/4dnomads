"use client";

import { useState } from "react";
import Link from "next/link";
import { SearchIcon, MapPinIcon, CalendarIcon, UserIcon } from "@/components/Icons";
import type { LocalEventWithCreator } from "@/types";
import styles from "./events.module.css";

export default function EventsClient({ events }: { events: LocalEventWithCreator[] }) {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredEvents = events.filter(
    (event) => event.title.toLowerCase().includes(searchQuery.toLowerCase()) || event.locationName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Local Events & Hangouts</h1>
          <p className="text-secondary text-sm">Discover what&apos;s happening nearby and meet other travelers and locals.</p>
        </div>
        <Link href="/events/new" className="btn btn-primary">
          + Create Hangout
        </Link>
      </header>

      <div className={styles.searchBar}>
        <SearchIcon className={styles.searchIcon} size={20} />
        <input type="text" className={styles.searchInput} placeholder="Search events or locations..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} maxLength={120} />
      </div>

      {filteredEvents.length > 0 ? (
        <div className={styles.grid}>
          {filteredEvents.map((event) => {
            const initials = `${event.creator.firstName[0]}${event.creator.lastName[0]}`;
            return (
              <div key={event.id} className={`panel panel-hover ${styles.eventCard}`}>
                <div className={styles.cardHeader}>
                  <span className={styles.dateLabel} style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                    <CalendarIcon size={14} />
                    {new Date(event.eventDate).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
                  </span>
                  <span className="badge badge-info">{event.eventTime}</span>
                </div>

                <div className={styles.cardBody}>
                  <h3 className={styles.eventTitle}>{event.title}</h3>
                  <p className={styles.location} style={{ display: "flex", alignItems: "center", gap: 4 }}>
                    <MapPinIcon size={14} /> {event.locationName}
                  </p>
                  <p className={styles.description}>{event.description.slice(0, 120)}…</p>
                </div>

                <div className={styles.cardFooter}>
                  <div className={styles.attendees}>
                    <div className="avatar avatar-sm">{initials}</div>
                    <span className="text-secondary text-xs" style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                      <UserIcon size={12} /> {event.rsvps.length} attending · by {event.creator.firstName}
                    </span>
                  </div>

                  <Link href={`/events/${event.id}`} className="btn btn-secondary btn-sm">
                    View Hangout
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className={styles.empty}>
          <div style={{ color: "var(--terracotta-500)", marginBottom: 16 }}>
            <CalendarIcon size={48} />
          </div>
          <h3>No events found</h3>
          <p className="text-secondary text-sm">Be the first to host an event or hangout in your area!</p>
        </div>
      )}
    </>
  );
}
