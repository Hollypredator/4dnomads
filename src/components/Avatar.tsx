import styles from "./avatar.module.css";

type Size = "sm" | "md" | "lg" | "xl" | "2xl";

/**
 * A person's photo, falling back to their initials.
 *
 * Replaces the `<span className="avatar avatar-md">JD</span>` pattern that was
 * repeated across ~15 files and could only ever show initials. The initials
 * path is kept as the fallback rather than a generic silhouette: a real
 * person's initials read as a specific person, a grey bust reads as an error.
 *
 * Plain <img> rather than next/image on purpose -- avatars come from
 * Supabase Storage and Google, and next/image would need every one of those
 * hosts allow-listed in next.config.ts, with no real benefit at 32-96px.
 */
export function Avatar({
  src,
  firstName,
  lastName,
  size = "md",
  className = "",
}: {
  src?: string | null;
  firstName: string;
  lastName?: string;
  size?: Size;
  className?: string;
}) {
  const initials = `${firstName[0] ?? ""}${lastName?.[0] ?? ""}`.toUpperCase();
  const cls = `avatar avatar-${size} ${styles.avatar} ${className}`.trim();

  if (src) {
    return (
      <span className={cls}>
        {/* eslint-disable-next-line @next/next/no-img-element -- avatars
            come from Supabase Storage and Google; next/image would need
            every such host allow-listed for no gain at <=96px. */}
        <img
          src={src}
          alt=""
          className={styles.image}
          loading="lazy"
          decoding="async"
          // The initials stay underneath, so a broken or expired photo URL
          // degrades to them instead of leaving an empty circle.
          referrerPolicy="no-referrer"
        />
        <span className={styles.fallback} aria-hidden="true">{initials}</span>
      </span>
    );
  }

  return <span className={cls}>{initials}</span>;
}
