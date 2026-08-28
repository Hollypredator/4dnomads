/**
 * Removes the demo personas created by seed-demo-data.mjs, via each
 * account's own delete_own_account() RPC -- the same soft-delete path a
 * real user's "Delete Account" button calls. No service-role key needed.
 *
 * This anonymizes and soft-deletes the profile (deleted_at set), which is
 * why every query in the app already filters `.is("deleted_at", null)` --
 * the demo accounts stop appearing everywhere immediately. It does not hard-
 * delete the auth.users row (that needs the Auth admin API and a
 * service-role key, deliberately out of scope for an authenticated-role
 * action -- see src/lib/actions/account.ts). A handful of stray,
 * password-protected, profile-less auth accounts left behind is harmless:
 * nothing in the app can reach them.
 *
 * Run: node scripts/clear-demo-data.mjs
 */
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { PERSONAS } from "./seed-demo-data.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");

function loadEnv() {
  const text = readFileSync(join(ROOT, ".env.local"), "utf8");
  for (const line of text.split("\n")) {
    const m = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/);
    if (m) process.env[m[1]] ??= m[2].trim();
  }
}
loadEnv();

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const PASSWORD = "Demo-Seed-4dnomads-2026!";
const EMAIL_DOMAIN = "seed.4dnomads.internal";

async function main() {
  console.log(`Removing ${PERSONAS.length} demo personas from ${URL}\n`);

  for (const persona of PERSONAS) {
    const email = `${persona.key}@${EMAIL_DOMAIN}`;
    const sb = createClient(URL, ANON_KEY, { auth: { persistSession: false, autoRefreshToken: false } });

    const { error: signInErr } = await sb.auth.signInWithPassword({ email, password: PASSWORD });
    if (signInErr) {
      console.log(`  ${persona.firstName}: skip (${signInErr.message})`);
      continue;
    }

    const { error } = await sb.rpc("delete_own_account");
    if (error) {
      console.log(`  ${persona.firstName}: FAILED (${error.message})`);
    } else {
      console.log(`  ${persona.firstName}: removed`);
    }
    await sb.auth.signOut();
  }

  console.log("\nDone.");
}

main().catch((err) => {
  console.error("Cleanup failed:", err.message);
  process.exit(1);
});
