import { requireSession } from "@/lib/session";
import { AppBar } from "@/components/AppBar";
import { getMessageThreads } from "@/lib/data/messages";
import MessagesClient from "./MessagesClient";
import styles from "./messages.module.css";

export default async function MessagesPage() {
  const session = await requireSession();
  const threads = await getMessageThreads(session.authUserId);

  return (
    <>
      <AppBar />
      <div className={styles.page}>
        <MessagesClient threads={threads} currentUserId={session.authUserId} />
      </div>
    </>
  );
}
