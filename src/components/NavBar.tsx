import Link from "next/link";
import type { User } from "@/types";
import { logoutAction } from "@/lib/actions/auth";
import styles from "./navbar.module.css";

// Desktop navigation only. On mobile (<=768px) this drops to logo-only via
// CSS -- navigation lives in the bottom tab bar (MobileTabBar.tsx) instead,
// which is how real mobile apps navigate, not a slide-out drawer reskinning
// a desktop nav (design pass, 2026-08-27). No client-side interactivity
// left here, so this is a plain Server Component now.
export default function NavBar({ user }: { user: User | null }) {
  const initials = user ? `${user.firstName[0]}${user.lastName[0]}` : "U";

  return (
    <nav className={styles.navbar} role="navigation" aria-label="Main navigation">
      <div className={styles.inner}>
        <Link href="/" className={styles.logo}>4dnomads.</Link>

        <div className={styles.nav}>
          <Link href="/explore" className={styles.navLink}>Explore Hosts</Link>
          <Link href="/community" className={styles.navLink}>Community Hub</Link>
          <Link href="/public-trips" className={styles.navLink}>Public Trips</Link>
          <Link href="/events" className={styles.navLink}>Events</Link>
          <Link href="/dashboard" className={styles.navLink}>Dashboard</Link>
          <Link href="/messages" className={styles.navLink}>Messages</Link>
        </div>

        <div className={styles.right}>
          {user ? (
            <div className={styles.authBtns}>
              <Link href={`/profile/${user.id}`} className={styles.userBtn} aria-label="Your profile">
                <span className={styles.userAvatar}>{initials}</span>
                <span className={styles.userName}>{user.firstName}</span>
              </Link>
              <form action={logoutAction}>
                <button type="submit" className="btn btn-ghost btn-sm">Log out</button>
              </form>
            </div>
          ) : (
            <div className={styles.authBtns}>
              <Link href="/login" className="btn btn-ghost btn-sm">Log in</Link>
              <Link href="/register" className="btn btn-primary btn-sm">Sign up</Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
