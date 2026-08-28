"use client";

import { useState, useMemo } from "react";
import { Avatar } from "@/components/Avatar";
import Link from "next/link";
import { MapPinIcon, BedIcon, StarIcon, ShieldCheckIcon, SearchIcon, WifiIcon } from "@/components/Icons";
import { Reveal } from "@/components/Reveal";
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
          {filteredHosts.map((host, i) => (
            <Reveal key={host.id} delay={Math.min(i, 6) * 50}>
              <Link href={`/profile/${host.id}`} className={`panel panel-hover press-card ${styles.card}`}>
                <div className={styles.cardTop}>
                  <Avatar src={host.avatarUrl} firstName={host.firstName} lastName={host.lastName} size="xl" className={styles.cardAvatar} />
                  {/* Verified is a real, checked trust signal and stays the
                      one thing badged up here. WiFi speed is a host's own
                      unverified claim -- it used to sit right next to
                      Verified as an equally loud pill, which visually
                      overstated it. Demoted into the plain metadata row
                      below, alongside sleeping arrangement and reviews. */}
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
                  <div className={styles.cardMeta} style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                      <BedIcon size={14} /> {host.home?.sleepingArrangement}
                    </span>
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                      <StarIcon size={14} fill="var(--terracotta-500)" /> {host.reviewCount} reviews
                    </span>
                    {host.home?.wifiMbps != null && (
                      <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }} title="Self-reported by the host">
                        <WifiIcon size={14} /> {host.home.wifiMbps} Mbps
                      </span>
                    )}
                  </div>
                  <p className={styles.cardBio}>
                    {host.bio.slice(0, 120)}
                    {host.bio.length > 120 ? "…" : ""}
                  </p>
                </div>
              </Link>
            </Reveal>
          ))}
        </div>
      ) : allHosts.length === 0 ? (
        <div className={styles.empty}>
          <div className={styles.emptyIcon}>
            <MapPinIcon size={48} />
          </div>
          <h3>No hosts here yet</h3>
          <p className="text-secondary">
            4dnomads is just getting started in this area. Be the first to <Link href="/profile/edit/hosting">open your door</Link>, or check
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
