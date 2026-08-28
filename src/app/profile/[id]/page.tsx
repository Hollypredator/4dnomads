import type { Metadata } from "next";
import Link from "next/link";
import { Avatar } from "@/components/Avatar";
import { getHostProfile, getUserById } from "@/lib/data/profiles";
import { getVouchesForUser } from "@/lib/data/forum";
import { getTrustStats } from "@/lib/data/trust";
import { getSession } from "@/lib/session";
import { ShieldCheckIcon, StarIcon } from "@/components/Icons";
import { TrustPanel } from "@/components/TrustPanel";
import { MobileHeader } from "@/components/MobileHeader";
import styles from "./profile.module.css";

// A second fetch alongside the page component's own -- getHostProfile isn't
// wrapped in React's cache() (nothing in this data layer is yet), so this is
// a real extra round trip per request rather than a deduped one. Acceptable
// for a detail page at current traffic; worth revisiting with cache() across
// src/lib/data if profile pages become a hot path.
export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const profile = await getHostProfile(id);
  if (!profile) return { title: "Profile not found" };

  const name = `${profile.firstName} ${profile.lastName}`;
  const place = profile.home?.locationName;
  return {
    title: name,
    description: profile.bio
      ? profile.bio.slice(0, 155)
      : place
        ? `${profile.firstName} hosts travellers in ${place} through 4dnomads, a free hospitality exchange.`
        : `${profile.firstName}'s profile on 4dnomads.`,
    openGraph: { title: name, description: profile.bio?.slice(0, 155) },
  };
}

export default async function ProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const profile = await getHostProfile(id);

  if (!profile) {
    return (
      <div className={styles.page}>
        <MobileHeader title="Profile" backHref="/explore" />
        <div className={styles.empty}>
          <h2>User not found</h2>
          <p className="text-secondary">This profile doesn&apos;t exist or has been removed.</p>
          <Link href="/explore" className="btn btn-primary" style={{ marginTop: 16 }}>
            Back to Explore
          </Link>
        </div>
      </div>
    );
  }

  const session = await getSession();
  const isOwnProfile = profile.id === session?.authUserId;
  const [vouches, trustStats] = await Promise.all([
    getVouchesForUser(profile.id),
    getTrustStats(profile.id, profile.createdAt),
  ]);

  const reviewAuthors = new Map(
    (await Promise.all(profile.reviews.map((r) => getUserById(r.authorId)))).map((u, i) => [profile.reviews[i].authorId, u])
  );

  return (
    <>
      <MobileHeader title={`${profile.firstName} ${profile.lastName}`} backHref="/explore" />
      <div className={styles.page}>
      <div className={styles.layout}>
        {/* ── Sidebar ── */}
        <aside className={styles.sidebar}>
          <div className={`panel panel-padded ${styles.avatarPanel}`}>
            <Avatar src={profile.avatarUrl} firstName={profile.firstName} lastName={profile.lastName} size="2xl" className={styles.mainAvatar} />
            <h1 className={styles.name}>{profile.firstName} {profile.lastName}</h1>
            <p className={`text-secondary text-sm`}>{profile.home?.locationName}</p>

            {profile.isVerified && (
              <span className={`badge badge-verified ${styles.verifiedBadge}`} style={{ display: "inline-flex", alignItems: "center", gap: 4, marginTop: 8 }}>
                <ShieldCheckIcon size={14} /> Identity Verified
              </span>
            )}

            {!isOwnProfile && (
              <Link href={`/request/${profile.id}`} className="btn btn-primary btn-full" style={{ marginTop: 16 }}>
                Request to Stay
              </Link>
            )}

            {isOwnProfile && (
              <Link href="/profile/edit" className="btn btn-secondary btn-full" style={{ marginTop: 16 }}>
                Edit Profile
              </Link>
            )}
          </div>

          <TrustPanel
            stats={trustStats}
            isVerified={profile.isVerified}
            firstName={profile.firstName}
            responseRate={profile.responseRate}
          />

          {(profile.languages.length > 0 || profile.averageRating > 0) && (
            <div className="panel">
              <div className="panel-header"><h3>Quick Info</h3></div>
              <div className="panel-body">
                {profile.languages.length > 0 && (
                  <div className={styles.statRow}>
                    <span className="text-secondary text-sm">Languages</span>
                    <span className="font-semibold text-sm">{profile.languages.join(", ")}</span>
                  </div>
                )}
                {profile.averageRating > 0 && (
                  <>
                    {profile.languages.length > 0 && <hr className="divider" />}
                    <div className={styles.statRow}>
                      <span className="text-secondary text-sm">Rating</span>
                      <span className="font-semibold text-sm" style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                        <StarIcon size={14} fill="var(--terracotta-500)" /> {profile.averageRating} / 5
                      </span>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}
        </aside>

        {/* ── Main Content ── */}
        <div className={styles.main}>
          {/* About */}
          <div className="panel">
            <div className="panel-header"><h3>About Me</h3></div>
            <div className="panel-body">
              <p className={styles.bio}>{profile.bio}</p>
              {profile.interests.length > 0 && (
                <div className={styles.interests}>
                  {profile.interests.map((i) => (
                    <span key={i} className="badge badge-info">{i}</span>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Home */}
          {profile.home && (
            <div className="panel">
              <div className="panel-header"><h3>My Home</h3></div>
              <div className="panel-body">
                <div className={styles.homeGrid}>
                  <div className={styles.homeItem}>
                    <span className="text-secondary text-xs">Sleeping Arrangement</span>
                    <span className="font-medium">{profile.home.sleepingArrangement}</span>
                  </div>
                  <div className={styles.homeItem}>
                    <span className="text-secondary text-xs">Max Guests</span>
                    <span className="font-medium">{profile.home.maxGuests}</span>
                  </div>
                  <div className={styles.homeItem}>
                    <span className="text-secondary text-xs">Internet</span>
                    <span className="font-medium">
                      {profile.home.wifiMbps != null ? `${profile.home.wifiMbps} Mbps (self-reported)` : "Not specified"}
                    </span>
                  </div>
                  <div className={styles.homeItem}>
                    <span className="text-secondary text-xs">Smoking</span>
                    <span className="font-medium">{profile.home.smokingPolicy}</span>
                  </div>
                  <div className={styles.homeItem}>
                    <span className="text-secondary text-xs">Pets</span>
                    <span className="font-medium">{profile.home.petsInfo}</span>
                  </div>
                </div>

                {profile.home.amenities.length > 0 && (
                  <>
                    <hr className="divider" />
                    <div>
                      <span className="text-secondary text-sm font-medium">Amenities</span>
                      <div className={styles.amenities}>
                        {profile.home.amenities.map((a) => (
                          <span key={a} className={styles.amenityTag}>{a}</span>
                        ))}
                      </div>
                    </div>
                  </>
                )}

                {profile.home.houseRules && (
                  <>
                    <hr className="divider" />
                    <div>
                      <span className="text-secondary text-sm font-medium">House Rules</span>
                      <p className={styles.rules}>{profile.home.houseRules}</p>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          {/* Reviews */}
          <div className="panel">
            <div className="panel-header">
              <h3>Reviews ({profile.reviewCount})</h3>
            </div>
            <div className="panel-body">
              {profile.reviews.length > 0 ? (
                <div className={styles.reviewsList}>
                  {profile.reviews.map((review) => {
                    const author = reviewAuthors.get(review.authorId);
                    return (
                      <div key={review.id} className={styles.reviewItem}>
                        <div className={styles.reviewHeader}>
                          <div className={styles.reviewAuthor}>
                            <Avatar src={author?.avatarUrl} firstName={author?.firstName ?? "?"} lastName={author?.lastName} size="sm" />
                            <div>
                              <span className="font-semibold text-sm">
                                {author?.firstName} {author?.lastName}
                              </span>
                              <span className="text-xs text-secondary" style={{ display: "block" }}>
                                {new Date(review.createdAt).toLocaleDateString("en-US", { month: "long", year: "numeric" })}
                              </span>
                            </div>
                          </div>
                          <span className="text-sm" style={{ display: "inline-flex", gap: 2 }}>
                            {Array.from({ length: review.rating }, (_, i) => (
                              <StarIcon key={i} size={14} fill="var(--terracotta-500)" />
                            ))}
                          </span>
                        </div>
                        <p className={styles.reviewText}>{review.text}</p>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className={styles.noReviews}>
                  <p className="text-secondary">No reviews yet.</p>
                </div>
              )}
            </div>
          </div>

          {/* Community Vouches */}
          <div className="panel">
            <div className="panel-header">
              <h3>Community Vouches</h3>
            </div>
            <div className="panel-body">
              <p className="text-sm text-secondary" style={{ marginBottom: 16 }}>
                Peer vouches from community members who have met {profile.firstName} at hangouts or during travel.
              </p>
              {vouches.length > 0 ? (
                <div className="flex flex-col gap-3">
                  {vouches.map((v) => (
                    <div key={v.id} style={{ padding: 14, background: "var(--sand-50)", border: "1px solid var(--border)", borderRadius: "var(--radius-md)" }}>
                      <p className="text-sm" style={{ fontStyle: "italic", marginBottom: 8 }}>
                        &quot;{v.text}&quot;
                      </p>
                      <span className="text-xs font-semibold text-secondary">
                        Vouched by {v.author.firstName} {v.author.lastName[0]}.
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-secondary text-sm">No vouches yet.</p>
              )}
            </div>
          </div>
        </div>
      </div>
      </div>
    </>
  );
}
