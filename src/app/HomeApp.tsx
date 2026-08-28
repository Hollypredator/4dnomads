import Link from "next/link";
import { Avatar } from "@/components/Avatar";
import { SearchIcon, ShieldCheckIcon, StarIcon, MapPinIcon, UserIcon, WifiIcon, SlidersIcon } from "@/components/Icons";
import { AppBar } from "@/components/AppBar";
import { WelcomeIllustration } from "@/components/WelcomeIllustration";
import type { HostProfile, CommunityVouchWithTarget } from "@/types";
import styles from "./home-app.module.css";

/**
 * Signed-in home, built to the NomadStay mobile "Home" screen: a hero with
 * the headline set over it, a search entry point, a horizontally snapping
 * carousel of hosts, and a recent-vouch card.
 *
 * Two deliberate departures from the design. The hero is the brand
 * illustration rather than a photograph -- there is no image storage in this
 * app yet, so a photo here would have to be stock. And the cards carry no
 * price: this is a free exchange, and the design's "$1,200 / month" belongs
 * to a paid rental product.
 */
export default function HomeApp({
  firstName,
  pendingCount,
  nearbyHosts,
  recentVouch,
}: {
  firstName: string;
  pendingCount: number;
  nearbyHosts: HostProfile[];
  recentVouch: CommunityVouchWithTarget | null;
}) {
  return (
    <>
      <AppBar />

      <div className={styles.screen}>
        <section className={styles.heroSection}>
          <div className={styles.hero}>
            <WelcomeIllustration className={styles.heroArt} />
            <div className={styles.heroScrim} />
            <div className={styles.heroCopy}>
              <h1 className={styles.heroTitle}>Belong anywhere you work</h1>
            </div>
          </div>

          <Link href="/explore" className={styles.searchBar}>
            <SearchIcon size={20} className={styles.searchIcon} />
            <span className={styles.searchText}>
              <span className={styles.searchLabel}>Where to next?</span>
              <span className={styles.searchValue}>Anywhere · Any week</span>
            </span>
            <span className={styles.searchTune} aria-hidden="true">
              <SlidersIcon size={15} />
            </span>
          </Link>
        </section>

        <section className={styles.section}>
          <div className={styles.sectionHead}>
            <h2 className={styles.sectionTitle}>Hosts near you</h2>
            <Link href="/explore" className={styles.seeAll}>See all</Link>
          </div>

          {nearbyHosts.length > 0 ? (
            <div className={styles.carousel}>
              {nearbyHosts.map((host) => (
                <Link href={`/profile/${host.id}`} key={host.id} className={`${styles.hostCard} press-card`}>
                  <div className={styles.hostCardTop}>
                    <Avatar src={host.avatarUrl} firstName={host.firstName} lastName={host.lastName} size="xl" className={styles.hostAvatar} />
                  </div>

                  <div className={styles.hostCardBody}>
                    <div className={styles.hostCardRow}>
                      <h3 className={styles.hostName}>
                        {host.firstName} {host.lastName[0]}.
                      </h3>
                      {host.reviewCount > 0 && (
                        <span className={styles.rating}>
                          <StarIcon size={13} fill="var(--primary)" /> {host.averageRating}
                        </span>
                      )}
                    </div>
                    <p className={styles.hostMeta}>
                      <MapPinIcon size={13} /> {host.home?.locationName}
                    </p>
                    {/* WiFi demoted to plain text alongside the other specs --
                        it is the host's own unverified claim, and a bright
                        chip in the top corner gave it the same visual weight
                        as Verified, which is an actually-checked signal. */}
                    <p className={styles.hostSub}>
                      {host.home?.sleepingArrangement}
                      {host.home?.wifiMbps != null && (
                        <span className={styles.wifiInline} title="Self-reported by the host">
                          <WifiIcon size={12} /> {host.home.wifiMbps} Mbps
                        </span>
                      )}
                      {host.isVerified && (
                        <span className={styles.verified}>
                          <ShieldCheckIcon size={12} /> Verified
                        </span>
                      )}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className={styles.emptyInline}>
              <UserIcon size={28} />
              <p>No hosts nearby yet. Be the first to open your door.</p>
              <Link href="/profile/edit/hosting" className="btn btn-secondary btn-sm">Become a host</Link>
            </div>
          )}
        </section>

        {recentVouch && (
          <section className={styles.section}>
            <div className={styles.sectionHead}>
              <h2 className={styles.sectionTitle}>Recent vouch</h2>
              <Link href="/community" className={styles.seeAll}>See all</Link>
            </div>
            <div className={styles.vouchCard}>
              <div className={styles.vouchHead}>
                <Avatar src={recentVouch.author.avatarUrl} firstName={recentVouch.author.firstName} lastName={recentVouch.author.lastName} size="md" />
                <div>
                  <p className={styles.vouchName}>
                    {recentVouch.author.firstName} {recentVouch.author.lastName[0]}.
                  </p>
                  <p className={styles.vouchFor}>vouched for {recentVouch.target.firstName}</p>
                </div>
              </div>
              <p className={styles.vouchText}>{recentVouch.text}</p>
            </div>
          </section>
        )}

        <section className={styles.ctaSection}>
          <Link href="/community" className="btn btn-primary btn-full btn-lg">
            Explore the community
          </Link>
          {pendingCount > 0 && (
            <Link href="/dashboard" className={styles.pending}>
              {pendingCount} {pendingCount === 1 ? "request needs" : "requests need"} your reply
            </Link>
          )}
          <p className={styles.greeting}>Good to see you, {firstName}.</p>
        </section>
      </div>
    </>
  );
}
