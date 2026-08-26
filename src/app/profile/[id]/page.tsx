import Link from "next/link";
import { getHostProfile, getUserById } from "@/lib/data/profiles";
import { getVouchesForUser } from "@/lib/data/forum";
import { getSession } from "@/lib/session";
import { ShieldCheckIcon, StarIcon } from "@/components/Icons";
import styles from "./profile.module.css";

export default async function ProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const profile = await getHostProfile(id);

  if (!profile) {
    return (
      <div className={styles.page}>
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
  const vouches = await getVouchesForUser(profile.id);
  const initials = `${profile.firstName[0]}${profile.lastName[0]}`;

  const reviewAuthors = new Map(
    (await Promise.all(profile.reviews.map((r) => getUserById(r.authorId)))).map((u, i) => [profile.reviews[i].authorId, u])
  );

  return (
    <div className={styles.page}>
      <div className={styles.layout}>
        {/* ── Sidebar ── */}
        <aside className={styles.sidebar}>
          <div className={`panel panel-padded ${styles.avatarPanel}`}>
            <div className={`avatar avatar-2xl ${styles.mainAvatar}`}>{initials}</div>
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

          <div className="panel">
            <div className="panel-header"><h3>Quick Info</h3></div>
            <div className="panel-body">
              <div className={styles.statRow}>
                <span className="text-secondary text-sm">Response Rate</span>
                <span className="font-semibold text-sm">{profile.responseRate}%</span>
              </div>
              <hr className="divider" />
              <div className={styles.statRow}>
                <span className="text-secondary text-sm">Languages</span>
                <span className="font-semibold text-sm">{profile.languages.join(", ")}</span>
              </div>
              <hr className="divider" />
              <div className={styles.statRow}>
                <span className="text-secondary text-sm">Member Since</span>
                <span className="font-semibold text-sm">{new Date(profile.createdAt).getFullYear()}</span>
              </div>
              {profile.averageRating > 0 && (
                <>
                  <hr className="divider" />
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
                            <div className="avatar avatar-sm">
                              {author ? `${author.firstName[0]}${author.lastName[0]}` : "?"}
                            </div>
                            <div>
                              <span className="font-semibold text-sm">
                                {author?.firstName} {author?.lastName}
                              </span>
                              <span className="text-xs text-secondary" style={{ display: "block" }}>
                                {new Date(review.createdAt).toLocaleDateString("en-US", { month: "long", year: "numeric" })}
                              </span>
                            </div>
                          </div>
                          <span className="text-sm">{"⭐".repeat(review.rating)}</span>
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
                        — Vouched by {v.author.firstName} {v.author.lastName[0]}.
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
  );
}
