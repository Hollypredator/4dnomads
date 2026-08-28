import { SkeletonList } from "@/components/Skeleton";
import styles from "./messages.module.css";

export default function MessagesLoading() {
  return (
    <div className={styles.page}>
      <div className={styles.layout}>
        <aside className={styles.sidebar}>
          <div className={styles.sidebarHeader}>
            <h2>Messages</h2>
          </div>
          <div style={{ padding: 16 }}>
            <SkeletonList count={5} />
          </div>
        </aside>
        <div className={styles.chat} />
      </div>
    </div>
  );
}
