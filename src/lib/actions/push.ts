"use server";

import { requireSession } from "@/lib/session";
import { createClient } from "@/utils/supabase/server";

export type PushPlatform = "ios" | "android" | "web";

/**
 * Stores (or re-points) this device's push token for the signed-in user.
 *
 * Goes through the upsert_device_token RPC rather than a plain insert so that
 * re-registering an existing token transfers it to the current user instead of
 * failing the unique constraint -- the OS reissues the same token to whoever
 * signs in on that handset, and a stale row would keep pushing one person's
 * messages to another person's phone.
 */
export async function registerDeviceTokenAction(token: string, platform: PushPlatform) {
  await requireSession();

  if (!token || token.length > 512) {
    return { ok: false as const, error: "Invalid device token." };
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("upsert_device_token", {
    p_token: token,
    p_platform: platform,
  });

  if (error) {
    // Never surfaced to the user: failing to register for push is not worth
    // interrupting them over, it just means this device stays silent.
    console.error("[push] failed to register device token", error);
    return { ok: false as const, error: "Could not register for notifications." };
  }

  return { ok: true as const };
}

/**
 * Drops this device's token. Called on sign-out so a shared or resold handset
 * stops receiving the previous account's notifications.
 */
export async function unregisterDeviceTokenAction(token: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("device_tokens").delete().eq("token", token);
  if (error) {
    console.error("[push] failed to unregister device token", error);
    return { ok: false as const };
  }
  return { ok: true as const };
}
