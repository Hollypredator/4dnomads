"use client";

import { useState } from "react";
import Link from "next/link";
import type { User } from "@/types";
import { logoutAction } from "@/lib/actions/auth";
import styles from "./navbar.module.css";

export default function NavBar({ user }: { user: User | null }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const initials = user ? `${user.firstName[0]}${user.lastName[0]}` : "U";

  return (
    <nav className={styles.navbar} role="navigation" aria-label="Main navigation">
      <div className={styles.inner}>
        <Link href="/" className={styles.logo}>Nomads.</Link>

        {/* Desktop nav */}
        <div className={styles.nav}>
          <Link href="/explore" className={styles.navLink}>Explore Hosts</Link>
          <Link href="/community" className={styles.navLink}>Community Hub</Link>
          <Link href="/public-trips" className={styles.navLink}>Public Trips</Link>
          <Link href="/events" className={styles.navLink}>Events</Link>
          <Link href="/dashboard" className={styles.navLink}>Dashboard</Link>
          <Link href="/messages" className={styles.navLink}>Messages</Link>
        </div>

        {/* Right section */}
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

          {/* Mobile hamburger */}
          <button
            className={styles.hamburger}
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Toggle menu"
            aria-expanded={mobileOpen}
          >
            <span className={`${styles.hamburgerLine} ${mobileOpen ? styles.open : ""}`} />
            <span className={`${styles.hamburgerLine} ${mobileOpen ? styles.open : ""}`} />
            <span className={`${styles.hamburgerLine} ${mobileOpen ? styles.open : ""}`} />
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className={styles.mobileMenu}>
          <Link href="/explore" className={styles.mobileLink} onClick={() => setMobileOpen(false)}>Explore Hosts</Link>
          <Link href="/community" className={styles.mobileLink} onClick={() => setMobileOpen(false)}>Community Hub</Link>
          <Link href="/public-trips" className={styles.mobileLink} onClick={() => setMobileOpen(false)}>Public Trips</Link>
          <Link href="/events" className={styles.mobileLink} onClick={() => setMobileOpen(false)}>Events</Link>
          <Link href="/dashboard" className={styles.mobileLink} onClick={() => setMobileOpen(false)}>Dashboard</Link>
          <Link href="/messages" className={styles.mobileLink} onClick={() => setMobileOpen(false)}>Messages</Link>
          <Link href="/donate" className={styles.mobileLink} onClick={() => setMobileOpen(false)}>Support Us</Link>
          <hr className="divider" />
          {user ? (
            <>
              <Link href={`/profile/${user.id}`} className={styles.mobileLink} onClick={() => setMobileOpen(false)}>My Profile</Link>
              <form action={logoutAction}>
                <button type="submit" className={styles.mobileLink} style={{ background: "none", border: "none", textAlign: "left", width: "100%", cursor: "pointer" }}>
                  Log out
                </button>
              </form>
            </>
          ) : (
            <>
              <Link href="/login" className={styles.mobileLink} onClick={() => setMobileOpen(false)}>Log in</Link>
              <Link href="/register" className={styles.mobileLink} onClick={() => setMobileOpen(false)}>Sign up</Link>
            </>
          )}
        </div>
      )}
    </nav>
  );
}
