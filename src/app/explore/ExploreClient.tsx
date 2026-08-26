"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { MapPinIcon, BedIcon, StarIcon, ShieldCheckIcon, SearchIcon } from "@/components/Icons";
import type { HostProfile } from "@/types";
import styles from "./explore.module.css";

type FilterType = "all" | "verified" | "private" | "has-reviews";

export default function ExploreClient({ hosts: allHosts }: { hosts: HostProfile[] }) {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<FilterType>("all");

  const filteredHosts = useMemo(() => {
    let results = allHosts;

    if (search.trim()) {
      const q = search.toLowerCase();
      results = results.filter(
        (h) => h.home?.locationName.toLowerCase().includes(q) || h.firstName.toLowerCase().includes(q) || h.lastName.toLowerCase().includes(q)
      );
    }

    switch (filter) {
      case "verified":
        results = results.filter((h) => h.isVerified);
        break;
      case "private":
        results = results.filter((h) => h.home?.sleepingArrangement === "Private Room");
        break;
      case "has-reviews":
        results = results.filter((h) => h.reviewCount > 0);
        break;
    }

    return results;
  }, [search, filter, allHosts]);

  const initials = (h: HostProfile) => `${h.firstName[0]}${h.lastName[0]}`;

  return (
    <>
      <header className={styles.header}>
        <h1 className={styles.title}>Find Your Next Host</h1>
        <div className={styles.searchBar}>
          <SearchIcon className={styles.searchIcon} size={20} />
          <input
            type="text"
            className={styles.searchInput}
            placeholder="Search by city or host name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            aria-label="Search hosts"
            maxLength={120}
          />
        </div>
        <div className={styles.filters}>
          {(
            [
              ["all", "All Hosts"],
              ["verified", "Verified"],
              ["private", "Private Room"],
              ["has-reviews", "Has Reviews"],
            ] as [FilterType, string][]
          ).map(([key, label]) => (
            <button key={key} className={`${styles.chip} ${filter === key ? styles.chipActive : ""}`} onClick={() => setFilter(key)}>
              {key === "verified" && <ShieldCheckIcon size={14} style={{ marginRight: 4 }} />}
              {label}
            </button>
          ))}
        </div>
      </header>

      <p className={styles.resultCount}>
        {filteredHosts.length} host{filteredHosts.length !== 1 ? "s" : ""} found
      </p>

      {filteredHosts.length > 0 ? (
        <div className={styles.grid}>
          {filteredHosts.map((host) => (
            <Link href={`/profile/${host.id}`} key={host.id} className={`panel panel-hover ${styles.card}`}>
              <div className={styles.cardTop}>
                <div className={`avatar avatar-xl ${styles.cardAvatar}`}>{initials(host)}</div>
                {host.isVerified && (
                  <span className="badge badge-verified">
                    <ShieldCheckIcon size={14} /> Verified
                  </span>
                )}
              </div>
              <div className={styles.cardBody}>
                <h3 className={styles.cardName}>
                  {host.firstName} {host.lastName}
                </h3>
                <p className={styles.cardLocation} style={{ display: "flex", alignItems: "center", gap: 4 }}>
                  <MapPinIcon size={14} /> {host.home?.locationName}
                </p>
                <div className={styles.cardMeta} style={{ display: "flex", gap: 12 }}>
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                    <BedIcon size={14} /> {host.home?.sleepingArrangement}
                  </span>
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                    <StarIcon size={14} fill="var(--terracotta-500)" /> {host.reviewCount} reviews
                  </span>
                </div>
                <p className={styles.cardBio}>
                  {host.bio.slice(0, 120)}
                  {host.bio.length > 120 ? "…" : ""}
                </p>
              </div>
            </Link>
          ))}
        </div>
      ) : allHosts.length === 0 ? (
        <div className={styles.empty}>
          <div className={styles.emptyIcon}>
            <MapPinIcon size={48} />
          </div>
          <h3>No hosts here yet</h3>
          <p className="text-secondary">
            Nomads is just getting started in this area. Be the first to <Link href="/profile/edit/hosting">open your door</Link>, or check
            back soon.
          </p>
        </div>
      ) : (
        <div className={styles.empty}>
          <div className={styles.emptyIcon}>
            <SearchIcon size={48} />
          </div>
          <h3>No hosts found</h3>
          <p className="text-secondary">Try a different search term or adjust your filters.</p>
        </div>
      )}
    </>
  );
}
