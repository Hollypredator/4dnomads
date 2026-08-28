"use client";

import { ErrorState } from "@/components/ErrorState";
import styles from "./request.module.css";

export default function RequestError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className={styles.page}>
      <ErrorState error={error} reset={reset} title="Couldn't load this host" />
    </div>
  );
}
