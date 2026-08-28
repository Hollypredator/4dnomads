# Nomads TODOs

Deferred work, with enough context to pick up cold. Created 2026-08-26 by
`/plan-ceo-review`. Full reasoning lives in [docs/cutover-plan.md](docs/cutover-plan.md).

---

## T24 — Stripe Identity webhook with signature and replay verification

**Priority:** P3 · **Effort:** human ~2d / CC ~1h · **Depends on:** T5, T6

**What:** Build the webhook endpoint that flips `profiles.is_verified` after a
successful Stripe Identity session.

**Why:** `is_verified` is the platform's core trust signal, and the schema
comment at `initial_schema.sql:15` already claims it is "Controlled by Stripe
Identity webhook." Nothing implements that today, and `register()` currently
hardcodes `isVerified: true`, so the badge is a lie by default.

**Pros:** Makes the verified badge mean something, which is the difference
between a trust signal and decoration.
**Cons:** An unverified webhook endpoint is a direct write path to that same
signal, so this task is only safe if done carefully.

**Context:** After T5, `is_verified` is protected by a column GRANT and a
`BEFORE UPDATE` trigger, so the webhook must run as service role. Signature
verification and replay protection are not optional here: a forged or replayed
event grants a verified badge. The T5 trigger is also where the audit-log write
for a legitimate grant belongs.

**Start at:** `src/app/api/webhooks/stripe-identity/route.ts` (does not exist yet).

---

## T27 — Require email confirmation ✅ DONE (2026-08-28)

`RESEND_API_KEY` set locally, `supabase config push` run, diff reviewed
(`enable_confirmations: false → true`, real SMTP pass, correct `admin_email`/
`sender_name`/`site_url`). User confirmed a real signup received the
confirmation email and logged in successfully. Production no longer lets
anyone register with an email address they don't own.

**Follow-on found during this test:** the app had no "forgot password" flow
at all -- fixed the same day. See `/forgot-password`, `/reset-password`,
`requestPasswordResetAction`/`updatePasswordAction` in
`src/lib/actions/auth.ts`, and the `/auth/callback` fix so a recovery link
lands on `/reset-password` instead of being redirected to `/onboarding` for
an account that hasn't finished it.

---

## T25 — Realtime messaging via Supabase Realtime

**Priority:** P3 · **Effort:** human ~1d / CC ~45m · **Depends on:** T3, T11

**What:** Subscribe the messages thread to Supabase Realtime so new messages
appear without a refresh.

**Why:** Section 4 flagged that a thread opened while a new message arrives shows
stale content, with no realtime and no polling. On a platform where a host and a
traveler are coordinating an arrival time, message latency is felt.

**Pros:** Makes the product feel alive; messaging is the highest-frequency
surface in the app.
**Cons:** Realtime respects RLS, so it depends on T3 being correct first.
Deferring costs nothing at launch scale, where a refresh is adequate.

**Context:** Deliberately excluded from the cutover so the security fixes land
first. Revisit once there is a real conversation happening.

---

## T26 — Assert-nonempty guards for the RLS-denial-silent class

**Priority:** P3 · **Effort:** human ~4h / CC ~20m · **Depends on:** T11, T14

**What:** At call sites where an empty result is definitionally impossible, assert
non-empty and log loudly when the assertion fails.

**Why:** This is the one critical gap with no clean fix. A PostgREST RLS SELECT
denial returns `{ data: [], error: null }`. The `unwrap()` helper from decision 4
sees no error and logs nothing, so a policy that wrongly filters a host out of
search is invisible to every layer of monitoring.

**Pros:** Converts the single silent failure mode the architecture cannot
otherwise surface into a loud one.
**Cons:** Only works where emptiness is genuinely impossible, so coverage is
partial by nature. Over-applying it produces false alarms on legitimately empty
lists.

**Context:** Good candidates: a stay request's own thread (always has at least the
initial message), a profile page for an id that resolved (the profile must exist),
a dashboard for an authenticated user. Bad candidates: explore results, forum
lists, any user-filtered collection.

---

## Open strategic question — differentiation

**Priority:** P2 (decide, do not build) · **Effort:** thinking, not code

The built feature set closely mirrors Couchsurfing's. The post-Couchsurfing space
is held by nonprofit, member-governed platforms (Couchers.org, BeWelcome,
Trustroots) competing on governance rather than features, and Couchers.org
inherited a community rather than winning one on product.

No differentiator for Nomads is stated anywhere in the repo. This does not block
the cutover, but it determines whether the cutover is worth finishing.

Two contrarian directions surfaced during review:
1. Pick a vertical where reputation transfers from an adjacent context, so trust
   does not need years to compound.
2. Make verification portable, so a new entrant is not structurally locked out by
   the incumbent's accumulated reputation.

Worth answering before P2 work starts.

---

## T28 — Scaffold and build the iOS shell (needs macOS)

**Priority:** P1 (blocks App Store) · **Effort:** ~1h on a Mac · **Depends on:** none

**What:** On a machine with macOS + Xcode + CocoaPods: `npx cap add ios`, then
`node scripts/generate-icons.mjs` to write the brand assets into the generated
`ios/App/App/Assets.xcassets`, then open in Xcode and archive.

**Why:** `capacitor.config.ts` already covers both platforms and Android
scaffolds and builds fine, but `cap add ios` shells out to CocoaPods and the
Xcode toolchain, neither of which exists on Windows. Set up 2026-08-27.

**Context:** `scripts/generate-icons.mjs` currently only writes Android native
assets (it no-ops when `android/` is absent); an iOS branch needs adding
alongside `androidAssets()` for `Assets.xcassets/AppIcon.appiconset` (a single
1024×1024 is enough for Xcode 14+) and the splash image set.

---

## T29 — Native camera/avatars to de-risk App Store guideline 4.2

**Priority:** P1 (rejection risk) · **Effort:** human ~2d / CC ~2h · **Depends on:** T28

**UPDATE 2026-08-27:** The push-notification half of this is built — see T32,
which only awaits Firebase credentials. What remains here is native camera
capture and avatar storage.

**What:** Native camera capture for profile photos, plus somewhere to put them.

**Why:** The store build is a Capacitor shell over `server.url`, so from
Apple's side it is a website in an app. Guideline 4.2 ("Minimum Functionality")
is the standard rejection for exactly this shape. Real device capabilities the
web site cannot provide are the accepted mitigation, and push is also the
single biggest retention lever for a messaging-centred product.

**Context:** Push needs an FCM project for Android and an APNs key for iOS,
plus a `device_tokens` table with RLS and a send path from the message-insert
trigger. Camera needs Supabase Storage plus a bucket policy — note that no
avatar image storage exists yet at all (profiles render initials).

---

## T30 — Move the repo off the OneDrive/non-ASCII path

**Priority:** P2 · **Effort:** ~15m · **Depends on:** none

**What:** Move the working copy to an ASCII path outside OneDrive, e.g.
`C:\dev\4dnomads`.

**Why:** The Android Gradle plugin refuses non-ASCII project paths on Windows;
the repo sits under `Masaüstü`, so `android/gradle.properties` now carries
`android.overridePathCheck=true` to force the build through. That works today
because this app has no NDK step, but it is a warning that was suppressed
rather than fixed. Separately, OneDrive syncing `node_modules/`,
`android/build/`, and `.gradle/` causes file-lock and sync churn during builds.

**Context:** Added 2026-08-27 when the first `assembleDebug` failed outright
with "Your project path contains non-ASCII characters".

---

## T31 — Finish Google Sign-In ✅ CONFIG DONE (2026-08-28), needs a real end-to-end test

**Google Cloud side done:** OAuth consent screen created and published
(external, app name "4dnomads"), Web application OAuth client created with
Supabase's callback (`https://eludihyzupcmczdjyqaw.supabase.co/auth/v1/callback`)
as the authorised redirect URI. Client ID/secret set in `.env.local` and
pushed via `supabase config push` (diff showed only the expected
`[external.google] client_id`/`secret` change, nothing unrelated this time).

**Verified:** clicking "Continue with Google" on `/login` now reaches Google's
real account chooser (previously returned "provider is not enabled"). Not yet
verified: a full round trip with a real Google account all the way to a
created profile + onboarding -- do that next, watching in particular that
`handle_new_user()` picks up `given_name`/`family_name`/`picture` correctly
(migration `20260827000001_oauth_profile_metadata.sql`, already applied).

**Already done (unchanged):** `signInWithGoogleAction` (src/lib/actions/auth.ts),
`/auth/callback` code-exchange route, `GoogleSignInButton` on both /login and
/register.

**Native shell — BUILT 2026-08-27.** Google blocks OAuth inside embedded web
views (`disallowed_useragent`), so the packaged app hands consent to the system
browser instead: `src/lib/native/oauth.ts` opens the URL via
`@capacitor/browser` and returns on the custom scheme
`tr.com.fourdnomads.app://auth/callback`, which `NativeShell` catches through
`appUrlOpen`. Verified present in the built APK (scheme + host + BROWSABLE,
with `launchMode="singleTask"` so the callback reaches the running instance).

Two things this depends on, both easy to break silently:
- The redirect is registered in THREE places that must stay in sync:
  `NATIVE_OAUTH_REDIRECT` in oauth.ts, the intent filter in
  `android/app/src/main/AndroidManifest.xml`, and `additional_redirect_urls`
  in supabase/config.toml.
- The code exchange happens client-side, not via `/auth/callback`, because
  PKCE binds the code verifier to whichever client began the flow. Moving it
  server-side would break the native path.

For iOS (T28) the same scheme needs adding to `CFBundleURLTypes` in Info.plist.

---

## T32 — Finish push notifications (needs Firebase/APNs credentials)

**Priority:** P1 · **Effort:** ~1h once credentials exist · **Depends on:** T28 for iOS

**STATUS 2026-08-27:** All code is written; Android APK builds with the plugin
included (8.5 MB).

**Already done:** `device_tokens` table + RLS + `upsert_device_token` RPC
(migration `20260827000002_device_tokens.sql`), registration/permission flow in
`NativeShell.tsx`, `registerDeviceTokenAction`, FCM HTTP v1 sender
(`src/lib/push/send.ts`, RS256 JWT via WebCrypto, no extra dependency),
recipient resolution (`src/lib/push/notify.ts`), and send triggers wired into
`sendMessageAction` and `updateStayRequestStatusAction` via `after()` so a slow
push never delays the user's own action.

**To finish:**
1. Create a Firebase project, add an Android app with package
   `tr.com.fourdnomads.app`, download `google-services.json` into
   `android/app/`. **The build succeeds without it but registration fails at
   runtime**, so this is easy to miss.
2. Firebase console → Project settings → Service accounts → generate a private
   key. Set the whole JSON as one line: `FCM_SERVICE_ACCOUNT={"type":…}` in
   `.env.local` and in Vercel (all three environments).
3. Set `SUPABASE_SERVICE_ROLE_KEY` in `.env.local` and Vercel — the sender
   reads the *recipient's* device tokens, which no RLS policy grants (by
   design: a readable token is a push address for someone else's phone).
4. For iOS: upload an APNs auth key to Firebase (needs an Apple Developer
   account), after T28.
5. `npx supabase db push` for the migration.

**Known gap — sign-out:** `unregisterDeviceTokenAction` exists but nothing
calls it. Signing out therefore leaves the device registered, so a user who
logs out and is never replaced keeps receiving notifications. The common
shared-device case IS handled — `upsert_device_token` reassigns the token to
whoever signs in next, via a global unique constraint on the token — but the
explicit "stop notifying this device" path still needs wiring into the logout
forms in NavBar.tsx and MobileTabBar.tsx.

---

## T33 — Full Vitest + Playwright coverage beyond the initial pure-function pass

**Priority:** P2 · **Effort:** human ~1 week / CC ~4-6h (multi-session) · **Depends on:** none

**What:** Extend the Vitest setup (added by `/plan-eng-review` 2026-08-28) beyond
`errors.ts`/`mappers.ts`/`runAction()` to cover `src/lib/actions/*.ts` with a
mocked Supabase client, and add Playwright E2E for 2-3 critical flows (login →
request → accept → review) against a real test Supabase project.

**Why:** The initial pass covers the safest, most mechanical layer (pure
functions). The actual product risk — RLS behaving correctly, a Server Action
mutating the right row for the right user — is only provable end-to-end.

**Pros:** Matches the user's stated preference that well-tested code is
non-negotiable; catches RLS regressions that no unit test can see.
**Cons:** Playwright against a real Supabase project needs its own seeded test
project and CI wiring — this is genuinely multi-session work, not a single PR.

**Context:** Deferred at review time specifically to avoid starting a
multi-day task inside a single session. Pick up by first inventorying which
`lib/actions` functions have the highest blast radius (auth, requests,
messages) and writing mocked-Supabase unit tests for those before reaching
for Playwright.

---

## T34 — Runtime validation at the mapper seam

**Priority:** P2 · **Effort:** human ~1d / CC ~1h · **Depends on:** none

**What:** Add runtime shape validation (e.g. zod schemas, or hand-written
guard functions) to `src/lib/data/mappers.ts`, which currently does
`row.x as T` on an untyped `Record<string, unknown>` for every field.

**Why:** Found during `/plan-eng-review` 2026-08-28 (cross-model finding). A
renamed or retyped Postgres column doesn't throw today — it flows a
wrong-shaped value (`undefined`, wrong type) straight into the UI with no
error at the one seam that's supposed to be the single source of truth for
shape.

**Pros:** Converts a silent, hard-to-trace UI bug class into a loud,
immediate one at the exact point where schema drift would first become
visible.
**Cons:** Adds a dependency (if using zod) and a small amount of per-mapper
boilerplate; only worth it once mapper count/complexity justifies the setup
cost.

**Context:** Start with `mapHomeRow` and `mapProfileRow` — the two with the
most optional/nullable fields and the most call sites.

---

## T35 — Compile-time gate on admin data functions

**Priority:** P3 · **Effort:** human ~2-3h / CC ~30m · **Depends on:** none

**What:** `src/lib/data/admin.ts` functions (return PII: email, ban status)
are protected only by convention — every call site is expected to have
already called `requireModerator()`, but nothing enforces that at compile
time.

**Why:** Found during `/plan-eng-review` 2026-08-28 (cross-model finding).
RLS is the real backstop today, so this isn't an active vulnerability, but a
future page/action could import these functions directly and skip the guard
without any error until someone notices PII where it shouldn't be.

**Pros:** Defense in depth beyond RLS; makes the guard requirement visible in
the type signature instead of only in a comment.
**Cons:** Adds friction (an extra required parameter) to functions that are
today trivial to call.

**Context:** One approach: require the caller's `Session` (from
`requireModerator()`) as a parameter to every function in `admin.ts`, so a
missing guard is a type error, not a runtime hope.

---

## T36 — Consolidate the duplicated `.card` CSS class

**Priority:** P3 (cosmetic) · **Effort:** human ~30m / CC ~10m · **Depends on:** none

**What:** `.card` is independently defined in 7 different `*.module.css`
files instead of a shared primitive.

**Why:** Found during `/plan-eng-review` 2026-08-28 (cross-model finding).
Not urgent at current size, but each new page is another copy to keep in
sync if the card style ever changes.

**Pros:** One definition to update instead of seven.
**Cons:** Low priority — purely cosmetic, no functional risk today.

**Context:** Candidate for a shared `card` class in `globals.css` or a
`Card` component wrapper, once a third or fourth near-identical definition
shows up and the pattern is undeniable.
