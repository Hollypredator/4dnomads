import { SkeletonCardGrid } from "@/components/Skeleton";
import styles from "./trips.module.css";

export default function PublicTripsLoading() {
  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <SkeletonCardGrid count={4} />
      </div>
    </div>
  );
}
