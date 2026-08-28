import { SkeletonList } from "@/components/Skeleton";
import styles from "../../dashboard/dashboard.module.css";

export default function EditProfileLoading() {
  return (
    <div className={styles.page}>
      <div className={styles.container} style={{ maxWidth: 640 }}>
        <SkeletonList count={3} />
      </div>
    </div>
  );
}
