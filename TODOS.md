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
