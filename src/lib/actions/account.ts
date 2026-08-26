"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireSession } from "@/lib/session";
import { createClient } from "@/utils/supabase/server";

/**
 * T18: step one of account deletion. delete_own_account() anonymizes and
 * soft-deletes the profiles row (referential integrity for past stay
 * requests/messages/reviews survives). It does NOT delete the auth.users
 * row -- that needs the Supabase Auth admin API with the service-role key,
 * which only a server-side admin client may call, never this
 * authenticated-role Server Action. See the comment in the migration for
 * the deliberate scope boundary.
 */
export async function deleteAccountAction() {
  await requireSession();
  const supabase = await createClient();

  const { error } = await supabase.rpc("delete_own_account");
  if (error) {
    console.error("[deleteAccountAction] failed", error);
    return { ok: false as const, error: "Could not delete your account. Please try again." };
  }

  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/");
}
