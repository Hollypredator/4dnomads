"use client";

import { createClient } from "@/utils/supabase/client";

/**
 * Deep-link target the system browser returns to after Google consent.
 * Registered as an intent filter in AndroidManifest.xml (and CFBundleURLTypes
 * on iOS), and must also be listed in Supabase's redirect allow-list --
 * additional_redirect_urls in supabase/config.toml.
 */
export const NATIVE_OAUTH_REDIRECT = "tr.com.fourdnomads.app://auth/callback";

/**
 * Starts Google sign-in from inside the packaged app.
 *
 * WHY THIS EXISTS AT ALL: Google refuses OAuth inside embedded web views
 * (error "disallowed_useragent"), so the plain web flow -- a server-side
 * redirect within the shell's own web view -- cannot work here. The consent
 * screen has to run in the real system browser (Chrome Custom Tabs /
 * SFSafariViewController), which then deep-links back.
 *
 * The exchange is deliberately done CLIENT-side rather than by /auth/callback:
 * PKCE stores its code verifier with whichever client began the flow, so the
 * same browser client that called signInWithOAuth must be the one to redeem
 * the code. createBrowserClient persists to cookies, so the server components
 * see the resulting session on the next refresh.
 */
export async function startNativeGoogleSignIn(): Promise<{ ok: boolean; error?: string }> {
  const [{ Browser }, supabase] = await Promise.all([
    import("@capacitor/browser"),
    Promise.resolve(createClient()),
  ]);

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: NATIVE_OAUTH_REDIRECT,
      // Without this the SDK navigates the web view itself, which is exactly
      // the thing Google blocks.
      skipBrowserRedirect: true,
      queryParams: { prompt: "select_account" },
    },
  });

  if (error || !data?.url) {
    return { ok: false, error: "Could not reach Google. Please try again." };
  }

  await Browser.open({ url: data.url, presentationStyle: "popover" });
  return { ok: true };
}

/**
 * Completes the flow when the deep link fires. Returns true if the URL was an
 * auth callback this module owns, so the caller knows whether to route.
 */
export async function completeNativeGoogleSignIn(url: string): Promise<boolean> {
  if (!url.startsWith(NATIVE_OAUTH_REDIRECT)) return false;

  const { Browser } = await import("@capacitor/browser");
  // The custom-scheme URL is not a valid base for URL(), so the query is
  // parsed off the raw string instead.
  const query = url.split("?")[1] ?? "";
  const params = new URLSearchParams(query);
  const code = params.get("code");

  // Close the Custom Tab regardless of outcome -- leaving it open strands the
  // user looking at a blank page on top of the app.
  await Browser.close().catch(() => {});

  if (!code) return true;

  const supabase = createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) {
    console.error("[oauth] native code exchange failed", error);
  }
  return true;
}
