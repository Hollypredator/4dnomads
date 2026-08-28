"use client";

import { ErrorState } from "@/components/ErrorState";

// Root safety net: catches any error not caught by a more specific
// error.tsx further down the tree. Renders inside layout.tsx, so NavBar
// and Footer stay on screen -- only the page content is replaced.
export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div style={{ padding: "80px 24px" }}>
      <ErrorState error={error} reset={reset} />
    </div>
  );
}
