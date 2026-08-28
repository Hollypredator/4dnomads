import { SkeletonList } from "@/components/Skeleton";
import styles from "./community.module.css";

export default function CommunityLoading() {
  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <SkeletonList count={4} />
      </div>
    </div>
  );
}
