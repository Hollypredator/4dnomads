import { SkeletonDetail } from "@/components/Skeleton";
import styles from "./profile.module.css";

export default function ProfileLoading() {
  return (
    <div className={styles.page} style={{ padding: 24 }}>
      <SkeletonDetail />
    </div>
  );
}
