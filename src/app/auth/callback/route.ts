import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

/**
 * OAuth / email-confirmation landing point.
 *
 * Supabase redirects here with a one-time `code` after the provider (or the
 * confirmation link) succeeds; exchanging it is what actually writes the
 * session cookies. Without this route the provider redirect lands on a page
 * that has no session and silently bounces the user back to /login.
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");

  // Only same-origin relative paths are honoured. `next` arrives from the
  // query string, so treating it as a raw redirect target would be an open
  // redirect -- an attacker could send a "log in with Google" link that
  // bounces the authenticated user to their own site.
  const requested = url.searchParams.get("next") ?? "/dashboard";
  const next = requested.startsWith("/") && !requested.startsWith("//") ? requested : "/dashboard";

  if (!code) {
    // The provider itself can report a failure (consent denied, for example);
    // surface that rather than a generic error.
    const providerError = url.searchParams.get("error_description") ?? url.searchParams.get("error");
    return NextResponse.redirect(
      new URL(`/login?error=${encodeURIComponent(providerError ?? "Sign-in was cancelled.")}`, url.origin)
    );
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    return NextResponse.redirect(
      new URL(`/login?error=${encodeURIComponent("Could not complete sign-in. Please try again.")}`, url.origin)
    );
  }

  // A first-time Google sign-in lands here with a profile that has no photo,
  // bio or interests, exactly like an email signup -- so it goes through the
  // same onboarding rather than straight to the requested page.
  const { data: profile } = await supabase
    .from("profiles")
    .select("onboarding_completed_at")
    .eq("id", (await supabase.auth.getUser()).data.user?.id ?? "")
    .maybeSingle();

  if (profile && !profile.onboarding_completed_at) {
    return NextResponse.redirect(new URL("/onboarding", url.origin));
  }

  return NextResponse.redirect(new URL(next, url.origin));
}
