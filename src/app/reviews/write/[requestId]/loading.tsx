import { SkeletonDetail } from "@/components/Skeleton";
import styles from "./review.module.css";

export default function ReviewLoading() {
  return (
    <div className={styles.page}>
      <SkeletonDetail />
    </div>
  );
}
