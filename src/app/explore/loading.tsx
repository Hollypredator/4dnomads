import { SkeletonCardGrid } from "@/components/Skeleton";
import styles from "./explore.module.css";

export default function ExploreLoading() {
  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <SkeletonCardGrid count={6} />
      </div>
    </div>
  );
}
