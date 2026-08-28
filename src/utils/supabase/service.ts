import "server-only";
import { createClient } from "@supabase/supabase-js";

/**
 * Service-role Supabase client. BYPASSES ROW LEVEL SECURITY ENTIRELY.
 *
 * Only for server-side work that legitimately cannot be expressed as the
 * signed-in user -- currently just reading a *recipient's* device tokens in
 * order to push to them (src/lib/push/send.ts), which no RLS policy grants
 * and none should.
 *
 * Never import this into anything that runs in the browser, and never pass a
 * user-supplied filter to it without checking authorisation first: every
 * query made through this client is unconditionally trusted by Postgres.
 *
 * `server-only` above turns an accidental client import into a build error
 * rather than a leaked service key.
 */
export function createServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY (and NEXT_PUBLIC_SUPABASE_URL) must be set to use the service-role client."
    );
  }

  return createClient(url, serviceKey, {
    auth: {
      // No cookie/session handling: this client is never acting on behalf of
      // a browser session, and persisting one would risk it leaking across
      // requests in a warm serverless instance.
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}
