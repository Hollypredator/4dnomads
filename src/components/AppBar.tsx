import Link from "next/link";
import { SearchIcon, MessageIcon, UserIcon } from "@/components/Icons";
import { getSession } from "@/lib/session";
import { getMessageThreads } from "@/lib/data/messages";
import styles from "./app-bar.module.css";

/**
 * The fixed top bar on top-level screens, per the NomadStay mobile designs:
 * an action on the left, the wordmark centred in the brand colour, an action
 * on the right, over a translucent blurred surface.
 *
 * This is NOT the desktop NavBar (hidden below 769px) and NOT MobileHeader
 * (the back-arrow bar on pushed screens). Top-level screens get this; pushed
 * screens get MobileHeader; the two are mutually exclusive by design, which
 * is what keeps the app from ever showing two stacked headers.
 *
 * Reads the session itself rather than taking it as a prop -- getSession() is
 * cache()d per request, so every screen that already resolved a session pays
 * nothing, and screens that do not are spared threading it through.
 */
export async function AppBar() {
  const session = await getSession();

  // Only signed-in users have a message thread to count, and the query is
  // skipped entirely otherwise rather than returning an empty list.
  let unreadCount = 0;
  if (session) {
    const threads = await getMessageThreads(session.authUserId);
    unreadCount = threads.reduce((sum, t) => sum + t.unreadCount, 0);
  }

  return (
    <header className={styles.bar}>
      <Link href="/explore" className={styles.action} aria-label="Search hosts">
        <SearchIcon size={22} />
      </Link>

      <Link href="/" className={styles.brand}>
        4dnomads
      </Link>

      {session ? (
        <Link
          href="/messages"
          className={styles.action}
          aria-label={unreadCount > 0 ? `Messages, ${unreadCount} unread` : "Messages"}
        >
          <MessageIcon size={22} />
          {unreadCount > 0 && <span className={styles.dot} />}
        </Link>
      ) : (
        /* Pointing an anonymous visitor at /messages would bounce them
           through a redirect to reach a sign-in form anyway. */
        <Link href="/login" className={styles.action} aria-label="Log in">
          <UserIcon size={22} />
        </Link>
      )}
    </header>
  );
}
