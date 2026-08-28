"use client";

import { ErrorState } from "@/components/ErrorState";
import styles from "./review.module.css";

export default function ReviewError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className={styles.page}>
      <ErrorState error={error} reset={reset} title="Couldn't load this review form" />
    </div>
  );
}
