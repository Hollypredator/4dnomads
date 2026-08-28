import { SkeletonDetail } from "@/components/Skeleton";
import styles from "./request.module.css";

export default function RequestLoading() {
  return (
    <div className={styles.page}>
      <SkeletonDetail />
    </div>
  );
}
