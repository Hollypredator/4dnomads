"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { HouseIcon, SearchIcon, CalendarIcon, MessageIcon, ListIcon, CloseIcon, GlobeIcon, UserIcon, UsersIcon } from "@/components/Icons";
import { logoutAction } from "@/lib/actions/auth";
import type { User } from "@/types";
import styles from "./mobile-tab-bar.module.css";

/**
 * Bottom tab bar, mobile only (hidden at >768px via CSS -- see
 * mobile-tab-bar.module.css). NavBar owns desktop nav and is fully hidden
 * on mobile, so the two never compete for the same job.
 */
export default function MobileTabBar({ user }: { user: User | null }) {
  const pathname = usePathname();
  const [moreOpen, setMoreOpen] = useState(false);

  // Auth screens are full-bleed in a native app -- no tab bar to escape into
  // before you have an account.
  if (pathname === "/login" || pathname === "/register") return null;

  const isActive = (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href));

  // Trips/Dashboard moved into the More sheet (still one tap away, as its
  // first link) to make room for Community as a primary tab -- it carries
  // the vouch feed now, the most social content this app produces, and the
  // NomadStay reference nav includes Community over a stay-requests screen.
  // Messages stays a primary tab regardless: it is the highest-frequency
  // surface in a hosting-exchange app and the reference nav is simply
  // designed for a different (rental-marketplace) product shape.
  const tabs = [
    { href: "/", label: "Home", icon: HouseIcon },
    { href: "/explore", label: "Explore", icon: SearchIcon },
    { href: "/community", label: "Community", icon: UsersIcon },
    { href: "/messages", label: "Messages", icon: MessageIcon },
  ];

  return (
    <>
      <nav className={styles.tabBar} aria-label="Primary">
        {tabs.map(({ href, label, icon: Icon }) => {
          const active = isActive(href);
          return (
            <Link key={href} href={href} className={styles.tab} aria-current={active ? "page" : undefined}>
              <span className={`${styles.iconWrap} ${active ? styles.iconWrapActive : ""}`}>
                <Icon size={22} active={active} />
              </span>
              <span className={active ? styles.labelActive : undefined}>{label}</span>
            </Link>
          );
        })}
        <button className={styles.tab} onClick={() => setMoreOpen(true)} aria-label="More" aria-expanded={moreOpen}>
          <span className={`${styles.iconWrap} ${moreOpen ? styles.iconWrapActive : ""}`}>
            <ListIcon size={22} />
          </span>
          <span className={moreOpen ? styles.labelActive : undefined}>More</span>
        </button>
      </nav>

      {moreOpen && (
        <div className={styles.sheetOverlay} onClick={() => setMoreOpen(false)}>
          <div className={styles.sheet} onClick={(e) => e.stopPropagation()}>
            <div className={styles.sheetHeader}>
              <span className="font-semibold">More</span>
              <button className={styles.sheetClose} onClick={() => setMoreOpen(false)} aria-label="Close">
                <CloseIcon size={20} />
              </button>
            </div>
            <div className={styles.sheetLinks}>
              {user && (
                <Link href="/dashboard" className={styles.sheetLink} onClick={() => setMoreOpen(false)}>
                  <CalendarIcon size={20} /> My Trips
                </Link>
              )}
              <Link href="/public-trips" className={styles.sheetLink} onClick={() => setMoreOpen(false)}>
                <CalendarIcon size={20} /> Public Trips
              </Link>
              <Link href="/events" className={styles.sheetLink} onClick={() => setMoreOpen(false)}>
                <CalendarIcon size={20} /> Events
              </Link>
              <Link href="/donate" className={styles.sheetLink} onClick={() => setMoreOpen(false)}>
                <GlobeIcon size={20} /> Support Us
              </Link>

              <hr className="divider" style={{ margin: "8px 0" }} />

              {user ? (
                <>
                  <Link href={`/profile/${user.id}`} className={styles.sheetLink} onClick={() => setMoreOpen(false)}>
                    <UserIcon size={20} /> My Profile
                  </Link>
                  <Link href="/profile/edit/hosting" className={styles.sheetLink} onClick={() => setMoreOpen(false)}>
                    <HouseIcon size={20} /> Host Settings
                  </Link>
                  <form action={logoutAction}>
                    <button type="submit" className={styles.sheetLink} style={{ width: "100%", border: "none", background: "none", textAlign: "left", cursor: "pointer" }}>
                      Log out
                    </button>
                  </form>
                </>
              ) : (
                <>
                  <Link href="/login" className={styles.sheetLink} onClick={() => setMoreOpen(false)}>
                    Log in
                  </Link>
                  <Link href="/register" className={styles.sheetLink} onClick={() => setMoreOpen(false)}>
                    Sign up
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
