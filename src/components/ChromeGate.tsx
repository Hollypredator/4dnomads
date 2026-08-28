"use client";

import { usePathname } from "next/navigation";

/**
 * Hides the persistent app chrome (nav, footer, tab bar) on full-screen
 * flows.
 *
 * Onboarding is a single-purpose screen with its own progress header and its
 * own back control -- a tab bar underneath it would let someone wander off
 * mid-flow, and a site footer under it would break the illusion entirely.
 *
 * A client component because the root layout is a Server Component and cannot
 * read the pathname. Route groups would be the framework-native answer, but
 * that means restructuring all 24 routes for one exception.
 */
const CHROMELESS = ["/onboarding"];

export function ChromeGate({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const hidden = CHROMELESS.some((p) => pathname === p || pathname.startsWith(`${p}/`));
  return hidden ? null : <>{children}</>;
}
