"use client";

import { useEffect, useState } from "react";
import { signInWithGoogleAction } from "@/lib/actions/auth";
import styles from "./google-button.module.css";

/**
 * Google's brand guidelines require their own mark, unmodified, and forbid
 * recolouring it -- so this is the official four-colour "G" rather than an
 * icon-library stand-in.
 */
function GoogleMark() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true" focusable="false">
      <path fill="#4285F4" d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.91c1.7-1.57 2.69-3.88 2.69-6.62Z" />
      <path fill="#34A853" d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.91-2.26c-.81.54-1.84.86-3.05.86-2.35 0-4.33-1.58-5.04-3.71H.96v2.33A9 9 0 0 0 9 18Z" />
      <path fill="#FBBC05" d="M3.96 10.71a5.41 5.41 0 0 1 0-3.42V4.96H.96a9 9 0 0 0 0 8.08l3-2.33Z" />
      <path fill="#EA4335" d="M9 3.58c1.32 0 2.51.45 3.44 1.35l2.58-2.59C13.46.89 11.43 0 9 0A9 9 0 0 0 .96 4.96l3 2.33C4.67 5.16 6.65 3.58 9 3.58Z" />
    </svg>
  );
}

export function GoogleSignInButton({ next, label }: { next?: string; label: string }) {
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  // Resolved up front rather than inside the submit handler: preventDefault()
  // has no effect once the handler has awaited anything, so the platform check
  // has to be synchronous at submit time or the native build would fire BOTH
  // the server action and the native flow.
  const [isNative, setIsNative] = useState(false);

  useEffect(() => {
    let active = true;
    import("@capacitor/core").then(({ Capacitor }) => {
      if (active) setIsNative(Capacitor.isNativePlatform());
    });
    return () => {
      active = false;
    };
  }, []);

  /**
   * Inside the packaged app the form POST is intercepted: Google rejects OAuth
   * in an embedded web view, so the consent screen has to be handed to the
   * system browser instead. On the web this returns immediately and the form
   * submits to the server action as normal.
   */
  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    if (!isNative) return;
    e.preventDefault();
    setError(null);
    setPending(true);

    void (async () => {
      const { startNativeGoogleSignIn } = await import("@/lib/native/oauth");
      const result = await startNativeGoogleSignIn();
      if (!result.ok) {
        setError(result.error ?? "Sign-in failed.");
        setPending(false);
        return;
      }
      // The deep-link return is handled by NativeShell, which refreshes and
      // routes once the session lands; this screen unmounts at that point, so
      // `pending` is deliberately left set.
    })();
  }

  return (
    <form action={signInWithGoogleAction} onSubmit={handleSubmit}>
      {next && <input type="hidden" name="next" value={next} />}
      <button type="submit" className={styles.button} disabled={pending}>
        <GoogleMark />
        <span>{pending ? "Opening Google…" : label}</span>
      </button>
      {error && (
        <p role="alert" className="text-sm" style={{ color: "var(--color-danger, #d33)", marginTop: 8 }}>
          {error}
        </p>
      )}
    </form>
  );
}
