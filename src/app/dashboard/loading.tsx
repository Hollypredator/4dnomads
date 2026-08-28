import { SkeletonList } from "@/components/Skeleton";
import styles from "./dashboard.module.css";

export default function DashboardLoading() {
  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <SkeletonList count={3} />
      </div>
    </div>
  );
}
