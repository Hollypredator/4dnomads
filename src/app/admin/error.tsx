"use client";

import { ErrorState } from "@/components/ErrorState";
import styles from "./admin.module.css";

export default function AdminError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <ErrorState error={error} reset={reset} title="Couldn't load the admin panel" />
      </div>
    </div>
  );
}
