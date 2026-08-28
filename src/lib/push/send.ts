import "server-only";
import { createServiceClient } from "@/utils/supabase/service";

/**
 * Firebase Cloud Messaging HTTP v1 sender.
 *
 * FCM handles Android directly and relays to APNs for iOS, so one credential
 * covers both platforms. Auth is a short-lived OAuth token minted from the
 * service-account key -- the legacy server key is deprecated and rejected.
 *
 * Requires FCM_SERVICE_ACCOUNT: the service-account JSON from the Firebase
 * console, as a single-line string. Absent that, every call here no-ops with
 * a warning rather than throwing, so a missing credential can never take down
 * message sending itself.
 */

interface ServiceAccount {
  project_id: string;
  client_email: string;
  private_key: string;
}

function readServiceAccount(): ServiceAccount | null {
  const raw = process.env.FCM_SERVICE_ACCOUNT;
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as ServiceAccount;
    if (!parsed.project_id || !parsed.client_email || !parsed.private_key) return null;
    // Env vars flatten newlines; the PEM parser needs them back.
    parsed.private_key = parsed.private_key.replace(/\\n/g, "\n");
    return parsed;
  } catch {
    return null;
  }
}

// Access tokens last an hour; minting one per notification would add a round
// trip to every send.
let cachedToken: { value: string; expiresAt: number } | null = null;

async function getAccessToken(sa: ServiceAccount): Promise<string> {
  if (cachedToken && cachedToken.expiresAt > Date.now() + 60_000) {
    return cachedToken.value;
  }

  const now = Math.floor(Date.now() / 1000);
  const claim = {
    iss: sa.client_email,
    scope: "https://www.googleapis.com/auth/firebase.messaging",
    aud: "https://oauth2.googleapis.com/token",
    iat: now,
    exp: now + 3600,
  };

  const jwt = await signJwt(claim, sa.private_key);

  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: jwt,
    }),
  });

  if (!res.ok) {
    throw new Error(`FCM token exchange failed: ${res.status} ${await res.text()}`);
  }

  const json = (await res.json()) as { access_token: string; expires_in: number };
  cachedToken = { value: json.access_token, expiresAt: Date.now() + json.expires_in * 1000 };
  return json.access_token;
}

/** RS256 JWT via WebCrypto -- avoids pulling a JWT library in for one call. */
async function signJwt(claim: object, pem: string): Promise<string> {
  const enc = (obj: object) => base64Url(new TextEncoder().encode(JSON.stringify(obj)));
  const header = enc({ alg: "RS256", typ: "JWT" });
  const payload = enc(claim);
  const data = new TextEncoder().encode(`${header}.${payload}`);

  const key = await crypto.subtle.importKey(
    "pkcs8",
    pemToArrayBuffer(pem),
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign("RSASSA-PKCS1-v1_5", key, data);
  return `${header}.${payload}.${base64Url(new Uint8Array(sig))}`;
}

function base64Url(bytes: Uint8Array): string {
  return Buffer.from(bytes).toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function pemToArrayBuffer(pem: string): ArrayBuffer {
  const body = pem.replace(/-----(BEGIN|END) PRIVATE KEY-----/g, "").replace(/\s/g, "");
  return Uint8Array.from(Buffer.from(body, "base64")).buffer as ArrayBuffer;
}

export interface PushPayload {
  title: string;
  body: string;
  /** Deep-link path the notification opens, e.g. "/messages". */
  path?: string;
}

/**
 * Sends a notification to every device registered to `userId`.
 *
 * Fire-and-forget by design: callers await it only to keep the serverless
 * invocation alive, and a failure here must never fail the user action that
 * triggered it (sending a message must succeed even if the push does not).
 */
export async function sendPushToUser(userId: string, payload: PushPayload): Promise<void> {
  const sa = readServiceAccount();
  if (!sa) {
    console.warn("[push] FCM_SERVICE_ACCOUNT is not set -- skipping notification");
    return;
  }

  // Service role: device_tokens has no SELECT policy for other users by
  // design, and the sender legitimately needs to read the recipient's rows.
  const supabase = createServiceClient();
  const { data: tokens, error } = await supabase
    .from("device_tokens")
    .select("token")
    .eq("user_id", userId);

  if (error || !tokens?.length) return;

  const accessToken = await getAccessToken(sa);
  const endpoint = `https://fcm.googleapis.com/v1/projects/${sa.project_id}/messages:send`;

  const stale: string[] = [];

  await Promise.all(
    tokens.map(async ({ token }) => {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: {
            token,
            notification: { title: payload.title, body: payload.body },
            // Mirrored into data so the app can route the tap even when the
            // OS delivers the notification without the notification block.
            data: { path: payload.path ?? "/messages" },
            android: { priority: "HIGH", notification: { sound: "default" } },
            apns: { payload: { aps: { sound: "default" } } },
          },
        }),
      });

      if (res.ok) return;

      // UNREGISTERED/INVALID_ARGUMENT mean the app was uninstalled or the
      // token rotated. Left in place they accumulate forever and every future
      // send wastes a request on them.
      if (res.status === 404 || res.status === 400) {
        stale.push(token);
      } else {
        console.error("[push] send failed", res.status, await res.text());
      }
    })
  );

  if (stale.length) {
    await supabase.from("device_tokens").delete().in("token", stale);
  }
}
