"use client";

import { WarningIcon } from "@/components/Icons";

/**
 * Shared body for every route's error.tsx. Next.js only forwards `message`
 * and `digest` across the server/client boundary in production (custom
 * fields like AppError.kind do not survive serialization) -- which is fine
 * here, because unwrap() (src/lib/errors.ts) already sets `message` to
 * user-safe copy and logs the full context server-side via console.error.
 * The digest is what you search server logs for.
 */
export function ErrorState({ error, reset, title = "Something went wrong" }: { error: Error & { digest?: string }; reset: () => void; title?: string }) {
  return (
    <div className="error-state">
      <div className="error-state-icon">
        <WarningIcon size={40} />
      </div>
      <h2 style={{ marginBottom: 8 }}>{title}</h2>
      <p className="text-secondary text-sm" style={{ marginBottom: 24 }}>
        {error.message || "An unexpected error occurred. Please try again."}
      </p>
      {error.digest && <p className="text-xs text-secondary" style={{ marginBottom: 16 }}>Reference: {error.digest}</p>}
      <button className="btn btn-primary" onClick={reset}>
        Try Again
      </button>
    </div>
  );
}
