"use server";

import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { createClient } from "@/utils/supabase/server";

export interface AuthFormState {
  error?: string;
}

export async function loginAction(_prev: AuthFormState, formData: FormData): Promise<AuthFormState> {
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    return { error: "Email and password are required." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    // Do not distinguish "no such user" from "wrong password" -- that
    // distinction is a user-enumeration oracle.
    return { error: "Invalid email or password." };
  }

  revalidatePath("/", "layout");
  redirect("/dashboard");
}

export async function registerAction(_prev: AuthFormState, formData: FormData): Promise<AuthFormState> {
  const firstName = String(formData.get("firstName") ?? "").trim();
  const lastName = String(formData.get("lastName") ?? "").trim();
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");

  if (!firstName || !lastName || !email || !password) {
    return { error: "All fields are required." };
  }
  if (password.length < 8) {
    return { error: "Password must be at least 8 characters." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { first_name: firstName, last_name: lastName } },
  });

  if (error) {
    return { error: error.message };
  }

  // handle_new_user() (20260826000001_profiles.sql) creates the profiles
  // row from raw_user_meta_data automatically -- there is no separate
  // "create profile" step here, unlike the old mock register().
  revalidatePath("/", "layout");
  // Straight into onboarding: a brand-new account has no photo, bio or
  // interests, and the dashboard has nothing to show it.
  redirect("/onboarding");
}

/**
 * Starts the Google OAuth flow.
 *
 * Supabase returns the provider URL rather than redirecting itself, so the
 * redirect happens here. `redirectTo` must point at /auth/callback, which is
 * what exchanges the returned code for a session.
 *
 * NOTE FOR THE NATIVE SHELL: Google refuses OAuth inside an embedded web view
 * ("disallowed_useragent"), so the packaged app cannot simply follow this
 * redirect in-place -- it has to open the URL in the system browser and catch
 * the callback via a deep link. See NativeShell/T31.
 */
export async function signInWithGoogleAction(formData: FormData) {
  const requested = String(formData.get("next") ?? "/dashboard");
  const next = requested.startsWith("/") && !requested.startsWith("//") ? requested : "/dashboard";

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${await getOrigin()}/auth/callback?next=${encodeURIComponent(next)}`,
      queryParams: {
        // Without this Google silently reuses the previously granted account
        // and never offers the chooser, which reads as a broken button to
        // anyone with more than one Google account.
        prompt: "select_account",
      },
    },
  });

  if (error || !data?.url) {
    redirect(`/login?error=${encodeURIComponent("Could not reach Google. Please try again.")}`);
  }

  redirect(data.url);
}

/**
 * The public origin to build OAuth callback URLs from.
 *
 * Read from the request headers rather than hardcoded so local development,
 * Vercel previews, and production each send the user back to themselves. The
 * value only ever becomes a callback URL, and Supabase rejects any origin not
 * in its own redirect allow-list, so a spoofed Host header cannot redirect a
 * session somewhere else.
 */
async function getOrigin() {
  const h = await headers();
  const forwardedHost = h.get("x-forwarded-host") ?? h.get("host");
  const proto = h.get("x-forwarded-proto") ?? "https";
  return `${proto}://${forwardedHost}`;
}

export async function logoutAction() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/");
}
