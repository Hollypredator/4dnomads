import Link from "next/link";
import { ArrowLeftIcon } from "@/components/Icons";
import styles from "./mobile-header.module.css";

/**
 * The nav bar for "detail" screens on mobile -- back arrow + title, the way
 * a pushed screen in a native app works. Root tab screens (Explore,
 * Dashboard, Messages, Community, Events, Public Trips) don't use this:
 * they're reached from the bottom tab bar, not pushed, and already render
 * their own h1. This is for screens reached BY TAPPING something (a host
 * card, an event, a forum topic, "Request to Stay") -- see the design
 * pass, 2026-08-27. Desktop never sees this (see mobile-header.module.css);
 * NavBar covers desktop navigation instead.
 *
 * backHref is an explicit route, not router.back() -- a screen reached via
 * a deep link (shared URL, browser refresh) has no meaningful history to
 * go back to, so "back" here always means "up to the logical parent
 * screen," which is predictable regardless of how the user arrived.
 */
export function MobileHeader({ title, backHref }: { title: string; backHref: string }) {
  return (
    <div className={styles.header}>
      <Link href={backHref} className={styles.back} aria-label="Back">
        <ArrowLeftIcon size={20} />
      </Link>
      <span className={styles.title}>{title}</span>
      <span className={styles.spacer} />
    </div>
  );
}
