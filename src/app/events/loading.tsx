import { SkeletonCardGrid } from "@/components/Skeleton";
import styles from "./events.module.css";

export default function EventsLoading() {
  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <SkeletonCardGrid count={6} />
      </div>
    </div>
  );
}
