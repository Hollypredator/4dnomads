import { SkeletonList } from "@/components/Skeleton";
import styles from "./admin.module.css";

export default function AdminLoading() {
  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <SkeletonList count={5} />
      </div>
    </div>
  );
}
