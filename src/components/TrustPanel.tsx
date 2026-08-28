import { ShieldCheckIcon, HeartIcon, HouseIcon, MapPinIcon } from "@/components/Icons";
import type { TrustStats } from "@/lib/data/trust";
import styles from "./trust-panel.module.css";

/**
 * Trust summary for a profile: how much this person has actually done on the
 * platform, surfaced instead of buried.
 *
 * Adapted from the "Trust Dashboard" idea in the Stitch NomadStay concept,
 * but with two deliberate departures. There is no invented tier ("Silver
 * Nomad") and no badge wall: with no real behaviour to reward yet, a tier
 * would be decoration that implies a system nobody designed. And every figure
 * below is a row count -- the concept's headline numbers (10,000+ stays, 50k
 * vouches, 100% verified) were placeholders, and shipping them would be
 * inventing a track record this platform has not earned.
 */
export function TrustPanel({
  stats,
  isVerified,
  firstName,
  responseRate,
}: {
  stats: TrustStats;
  isVerified: boolean;
  firstName: string;
  responseRate: number;
}) {
  const totalStays = stats.staysHosted + stats.staysAsGuest;
  // A brand-new profile has nothing to summarise. Rendering four zeroes reads
  // as failure; saying so plainly reads as honest.
  const isNewcomer = stats.vouchesReceived === 0 && totalStays === 0;

  return (
    <section className={styles.panel} aria-labelledby="trust-heading">
      <div className={styles.header}>
        <h3 id="trust-heading">Trust</h3>
        {isVerified && (
          <span className={styles.verified}>
            <ShieldCheckIcon size={14} /> Identity verified
          </span>
        )}
      </div>

      {isNewcomer ? (
        <p className={styles.newcomer}>
          {firstName} joined in {stats.memberSinceYear} and hasn&apos;t hosted or stayed yet. Vouches
          from people who meet them will show up here.
        </p>
      ) : (
        <>
          <div className={styles.primary}>
            <span className={styles.primaryValue}>{stats.vouchesReceived}</span>
            <span className={styles.primaryLabel}>
              {stats.vouchesReceived === 1 ? "vouch received" : "vouches received"}
            </span>
          </div>

          <div className={styles.grid}>
            <Stat icon={<HeartIcon size={16} />} value={stats.vouchesGiven} label="Vouches given" />
            <Stat icon={<HouseIcon size={16} />} value={stats.staysHosted} label="Stays hosted" />
            <Stat icon={<MapPinIcon size={16} />} value={stats.staysAsGuest} label="Stays as guest" />
          </div>
        </>
      )}

      <dl className={styles.meta}>
        <div className={styles.metaRow}>
          <dt>Member since</dt>
          <dd>{stats.memberSinceYear}</dd>
        </div>
        {totalStays > 0 && (
          <div className={styles.metaRow}>
            <dt>Response rate</dt>
            <dd>{responseRate}%</dd>
          </div>
        )}
      </dl>
    </section>
  );
}

function Stat({ icon, value, label }: { icon: React.ReactNode; value: number; label: string }) {
  return (
    <div className={styles.stat}>
      <span className={styles.statIcon} aria-hidden="true">
        {icon}
      </span>
      <span className={styles.statValue}>{value}</span>
      <span className={styles.statLabel}>{label}</span>
    </div>
  );
}
