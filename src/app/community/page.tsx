import Link from "next/link";
import { getForumTopics, getEmergencyAlerts } from "@/lib/data/forum";
import { getRecentVouches } from "@/lib/data/forum";
import CommunityTopics from "./CommunityTopics";
import { GlobeIcon, MessageIcon, HeartIcon } from "@/components/Icons";
import styles from "./community.module.css";

const CITIES = ["Istanbul", "Berlin", "Lisbon", "Chiang Mai", "Tokyo", "Barcelona"];

export default async function CommunityPage() {
  const [topics, alerts, vouches] = await Promise.all([getForumTopics(), getEmergencyAlerts(), getRecentVouches(3)]);
  const emergencyAlerts = alerts.filter((a) => !a.isResolved);
  const topicCountByCity = new Map<string, number>();
  for (const t of topics) topicCountByCity.set(t.city, (topicCountByCity.get(t.city) ?? 0) + 1);

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <header className={styles.header}>
          <div>
            <h1 className={styles.title}>Community Hub</h1>
            <p className={styles.sub}>Connect with digital nomads, ask local advice in city forums, and support fellow travelers in need.</p>
          </div>
          <div style={{ display: "flex", gap: 12 }}>
            <Link href="/community/forum/new" className="btn btn-primary">
              + New Discussion
            </Link>
            <Link href="/community/emergency" className="btn btn-secondary">
              Emergency Couch Alerts ({emergencyAlerts.length})
            </Link>
          </div>
        </header>

        {emergencyAlerts.length > 0 && (
          <div className={styles.emergencyBanner}>
            <div className={styles.emergencyHeader}>
              <HeartIcon size={18} />
              <span>EMERGENCY HOSPITALITY ALERT IN {emergencyAlerts[0].locationName.toUpperCase()}</span>
            </div>
            <p className="text-sm" style={{ marginBottom: 12 }}>
              &quot;{emergencyAlerts[0].description}&quot; — <strong>Contact: {emergencyAlerts[0].contactInfo}</strong>
            </p>
            <Link href="/community/emergency" className="btn btn-danger btn-sm">
              View All Emergency Alerts
            </Link>
          </div>
        )}

        <div className={styles.grid}>
          <div>
            <div className={styles.sectionHeader}>
              <h2 className={styles.sectionTitle}>
                <GlobeIcon size={22} style={{ color: "var(--terracotta-500)" }} /> City Discussion Forums
              </h2>
            </div>

            <div className={styles.citiesGrid}>
              {CITIES.map((city) => (
                <Link href={`/community/forum?city=${city}`} key={city} className={styles.cityCard}>
                  <span className={styles.cityName}>{city}</span>
                  <span className={styles.cityCount}>{topicCountByCity.get(city) ?? 0} topics</span>
                </Link>
              ))}
            </div>

            <div className={styles.sectionHeader}>
              <h2 className={styles.sectionTitle}>
                <MessageIcon size={22} style={{ color: "var(--terracotta-500)" }} /> Recent Community Discussions
              </h2>
            </div>

            <CommunityTopics initialTopics={topics} />
          </div>

          <aside>
            <div className="panel panel-padded" style={{ marginBottom: 24 }}>
              <h3 style={{ fontFamily: "var(--font-serif)", fontSize: "1.25rem", marginBottom: 12 }}>Community Guidelines</h3>
              <ul style={{ paddingLeft: 18, fontSize: "0.875rem", lineHeight: "1.7", color: "var(--text-secondary)" }}>
                <li>Be respectful, tolerant, and welcoming to all cultures.</li>
                <li>Never post commercial ads or charging fees for hosts.</li>
                <li>Support emergency couch requests when you can!</li>
              </ul>
            </div>

            <div className="panel panel-padded">
              <h3 style={{ fontFamily: "var(--font-serif)", fontSize: "1.25rem", marginBottom: 12 }}>Active Local Vouches</h3>
              <p className="text-sm text-secondary" style={{ marginBottom: 16 }}>
                Members vouching for trustworthy hosts and guests.
              </p>
              {vouches.length > 0 ? (
                <div className="flex flex-col gap-3">
                  {vouches.map((v) => (
                    <div key={v.id} style={{ padding: 12, background: "var(--sand-50)", borderRadius: "var(--radius-md)" }}>
                      <p className="text-xs" style={{ fontStyle: "italic", marginBottom: 6 }}>
                        &quot;{v.text}&quot;
                      </p>
                      <span className="text-xs font-semibold">
                        — {v.author.firstName} {v.author.lastName[0]}. for {v.target.firstName}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-secondary text-sm">No vouches yet.</p>
              )}
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
