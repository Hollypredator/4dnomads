import { SkeletonDetail } from "@/components/Skeleton";
import styles from "./event-detail.module.css";

export default function EventDetailLoading() {
  return (
    <div className={styles.page} style={{ padding: 24 }}>
      <SkeletonDetail />
    </div>
  );
}
