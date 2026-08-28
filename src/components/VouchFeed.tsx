import Link from "next/link";
import { Avatar } from "@/components/Avatar";
import { ShieldCheckIcon } from "@/components/Icons";
import styles from "./vouch-feed.module.css";

interface FeedVouch {
  id: string;
  text: string;
  createdAt: string;
  author: { id: string; firstName: string; lastName: string; isVerified: boolean; avatarUrl: string | null };
  target: { id: string; firstName: string; lastName: string };
}

/**
 * Recent vouches as the community's primary content.
 *
 * Adapted from the Stitch "Recent Vouches" feed. What that concept got right
 * is that a vouch is the most social thing this platform produces: it names
 * two real people and an actual stay, which a forum topic list does not. What
 * it is missing here is the concept's engagement furniture (like counts,
 * photo attachments, "2h ago" on seeded rows) -- none of that exists in the
 * schema, and inventing it would be inventing activity.
 */
export function VouchFeed({ vouches }: { vouches: FeedVouch[] }) {
  if (vouches.length === 0) {
    return (
      <div className={styles.empty}>
        <p className={styles.emptyTitle}>No vouches yet</p>
        <p className={styles.emptyBody}>
          A vouch is how members say they&apos;d trust someone again. They appear here as people
          host and travel.
        </p>
      </div>
    );
  }

  return (
    <ul className={styles.list}>
      {vouches.map((v) => (
        <li key={v.id} className={styles.card}>
          <div className={styles.head}>
            <Link href={`/profile/${v.author.id}`} className={styles.avatarLink} aria-label={`${v.author.firstName}'s profile`}>
              <Avatar src={v.author.avatarUrl} firstName={v.author.firstName} lastName={v.author.lastName} size="md" />
            </Link>
            <div className={styles.headText}>
              <p className={styles.line}>
                <Link href={`/profile/${v.author.id}`} className={styles.name}>
                  {v.author.firstName} {v.author.lastName[0]}.
                </Link>
                {v.author.isVerified && (
                  <ShieldCheckIcon size={13} className={styles.verified} aria-label="Verified member" />
                )}
                <span className={styles.muted}> vouched for </span>
                <Link href={`/profile/${v.target.id}`} className={styles.name}>
                  {v.target.firstName} {v.target.lastName[0]}.
                </Link>
              </p>
              <time className={styles.time} dateTime={v.createdAt}>
                {formatRelative(v.createdAt)}
              </time>
            </div>
          </div>
          <blockquote className={styles.quote}>{v.text}</blockquote>
        </li>
      ))}
    </ul>
  );
}

/**
 * Coarse relative time. Rendered on the server, so it is the time at request,
 * not a live ticker -- which is why it stops at "d" and hands off to a date
 * rather than claiming a precision it cannot keep.
 */
function formatRelative(iso: string): string {
  const then = new Date(iso).getTime();
  const diffMin = Math.floor((Date.now() - then) / 60000);

  if (diffMin < 1) return "just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffH = Math.floor(diffMin / 60);
  if (diffH < 24) return `${diffH}h ago`;
  const diffD = Math.floor(diffH / 24);
  if (diffD < 7) return `${diffD}d ago`;
  return new Date(iso).toLocaleDateString("en-US", { month: "short", year: "numeric" });
}
