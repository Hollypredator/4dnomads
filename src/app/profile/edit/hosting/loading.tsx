import { SkeletonDetail } from "@/components/Skeleton";
import styles from "./hosting.module.css";

export default function EditHostingLoading() {
  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <SkeletonDetail />
      </div>
    </div>
  );
}
