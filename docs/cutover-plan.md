# Nomads: Mock → Production Cutover Plan

Produced by `/plan-ceo-review` on 2026-08-26. Branch: `master`.
Mode: **HOLD SCOPE**. Approach: **server-first RSC + Server Actions**.

## Why this document exists

Two decisions below (fuzzed-only coordinates, derived review visibility) are
non-obvious and one is a one-way door. Without the rationale recorded next to
the code, a future change will quietly undo them.

---

## Starting state (audited 2026-08-26)

- 22 routes, ~40 source files, styled and clickable. **Zero touch Supabase.**
- `src/utils/supabase/{client,server,middleware}.ts` are dead code: no importers.
- No root middleware, so the SSR session refresher never runs.
- Auth is `localStorage` plus a mutable in-memory `USERS` array
  (`src/lib/authContext.tsx`). Default context is `isLoggedIn: true`.
- `register()` hardcodes `isVerified: true`.
- **`supabase/migrations/20260826000000_initial_schema.sql` has never applied.**
  Line 96 reads `sr.id = stay_requests.id` inside a subquery that aliases the
  table as `sr`, so the name is out of scope. Postgres raises
  `missing FROM-clause entry for table "stay_requests"` and the file aborts.

### Six further defects in that file

1. `profiles` has RLS enabled, **no INSERT policy**, and no `handle_new_user`
   trigger. Sign-up cannot create a profile.
2. `"Users can update own profile"` has no `WITH CHECK` and no column list, so
   **any user can set their own `is_verified = true`**.
3. `messages` INSERT checks only `auth.uid() = sender_id`, so any authenticated
   user can inject messages into any thread given a `stay_request_id`.
4. `stay_requests` UPDATE has `USING` but no `WITH CHECK`, so a traveler can
   set their own request to `accepted` and rewrite `host_id`.
5. `"Homes are viewable by everyone"` exposes `coordinates`, the exact home
   address of every host, to unauthenticated visitors.
6. Missing tables for 9 of 13 entities in `src/types/index.ts`. No DELETE
   policies. No `updated_at` triggers. No index on any foreign key.

### Key leverage

`src/lib/mock-data.ts` already **is** the repository interface: 20 domain-shaped
functions. The cutover reimplements those 20 functions, it does not rewrite 22
pages from scratch.

`src/types/index.ts` is the real spec (13 entities). The migration is a stale,
partial subset of it. **Generate the schema from the types file, not the reverse.**

---

## Framework constraints (Next.js 16.3.3)

Verified against `node_modules/next/dist/docs/`, not from training data.

1. **`middleware.ts` is deprecated and renamed to `proxy.ts`** exporting `proxy`.
   Codemod: `npx @next/codemod@canary middleware-to-proxy .`
2. **Auth logic must not live in proxy.** The docs state proxy is invoked
   separately from render code and may be deployed to a CDN, and that you should
   not rely on shared modules or globals. Every Supabase tutorial says to put the
   auth guard in middleware; in Next 16 that is wrong.
   **Proxy refreshes the session cookie. Authorization happens in the render path.**
3. Cache Components (`use cache` / `cacheLife`) is opt-in and not enabled in
   `next.config.ts`. Deliberately out of scope.

---

## Decisions

| # | Decision | Rationale | Door |
|---|----------|-----------|------|
| 1 | Admin role in `auth.users.app_metadata`, surfaced as a JWT claim via a custom access token hook | `app_metadata` is service-role-write-only, so a user cannot self-promote even if a profiles policy is wrong. RLS reads the claim with no subquery and no recursion hazard. | two-way |
| 2 | Server-only auth. Delete `src/lib/authContext.tsx`. `cache()`-wrapped `getUser()` in the server layout; user passed as props | Today there are two competing identity sources that can disagree. Client-supplied identity in a Server Action is a direct object reference vulnerability. | two-way |
| 3 | **Never store exact coordinates.** Host drops an approximate pin; only the fuzzed point is persisted. Real address exchanged in chat after acceptance | RLS is row-level and **cannot hide a column**. The most reliable way to stop a column leaking is for it not to exist. Matches Couchsurfing/Airbnb behaviour. | **ONE-WAY** |
| 4 | `unwrap()` helper reads `error`, maps the PG code to a typed `AppError`, logs with context, and throws. `notFound()` for `22P02`/`PGRST116` | `supabase-js` never throws; it returns `{ data, error }`. A discarded `error` is silent by default, so a failed write renders as success. Centralizing makes it impossible to forget. | two-way |
| 5 | Column `GRANT`s (`REVOKE UPDATE (is_verified, is_banned)`) **plus** a `BEFORE UPDATE` trigger reverting privileged fields unless the caller is service role | The GRANT stops the client path; the trigger stops every other path, including a future service-role mistake. The trigger is also the audit hook for legitimate grants. | two-way |
| 6 | Policy-level volume caps, a designed account-deletion path, and an immutable `moderation_audit` table. No external rate limiter yet | Deletion semantics (cascade vs anonymize) are free to decide now and become a data-model migration once profiles are referenced. Rate limiting genuinely scales with traffic that does not exist. | mixed |
| 7 | **Derived** review visibility, no stored `is_blind`. A review is visible when the counterpart review exists **or** 14 days have passed since the stay ended. Enforced in the SELECT policy | The mock flips the partner's row, which RLS must reject. Without a deadline, a bad host defeats the whole system by never reviewing. Derived state cannot desync. | two-way |
| 8 | Vitest integration tests against a local Supabase, three seeded authenticated users, allowed/denied asserted per table per perspective | ~40 RLS policies are the entire security model. Integration tests reach the real policy engine, real JWT claims (decision 1 depends on them), and real PostgREST. | two-way |
| 9 | Hand-design three load-bearing UI states (empty explore, blind review, pending vs accepted). Shared skeleton/empty components plus `error.tsx` for the other ~32 | Those three are what a launch user actually hits at zero liquidity. The rest are mechanical. Full 35-state design belongs to `/plan-design-review`. | two-way |

**Decision 3 is the one-way door.** Reverting means re-collecting exact
locations from every host who ever signed up.

---

## Critical gaps at review time

All nine are silent, untested, and unlogged.

```
 CODEPATH              | FAILURE MODE            | USER SEES        | OWNER
 ----------------------|-------------------------|------------------|------
 messages SELECT policy| references wrong column | migration ABORTS | T1/T3
 profiles INSERT       | no policy exists        | signup fails     | T2
 profiles UPDATE       | self-grant is_verified  | Silent           | T5
 messages INSERT       | inject into any thread  | Silent           | T3
 stay_requests UPDATE  | traveler self-accepts   | Silent           | T4
 homes SELECT          | exact coords public     | Silent           | T7
 /admin route          | no authorization        | Silent           | T6
 submitReview          | stay never accepted     | Review posts     | T8
 Server Actions        | forged object id        | Silent           | T23
```

Plus one with no clean fix: **an RLS SELECT denial returns `{ data: [], error: null }`.**
Your code cannot distinguish "no rows" from "not allowed", and `unwrap()` sees no
error to log. Mitigation is assert-nonempty at specific call sites (T26).

---

## Architecture

```
  BEFORE                                  AFTER
  ──────                                  ─────
  layout.tsx                              proxy.ts ──────┐ (cookie refresh only)
    └─ AuthProvider ("use client")                       │
         └─ localStorage ──┐              layout.tsx (server)
                           │                └─ getUser() ──┼──▶ @supabase/ssr
  page.tsx ("use client")  │                   └─ user as props
    └─ mock-data.ts ───────┤
         └─ module arrays ─┘              page.tsx (server)
                                            └─ src/lib/data/*.ts ──▶ createClient(server)
  src/utils/supabase/*  ◀── NOTHING              │                        │
      (3 files, 0 importers)                     │                        ▼
                                            <ClientIsland> ──▶ Server Action ──▶ Postgres + RLS
```

### Stay request state machine

```
                    ┌──────────┐
      traveler ────▶│ pending  │
      creates       └────┬─────┘
                         │
          ┌──────────────┼──────────────┐
     host │         host │              │ traveler
          ▼              ▼              ▼
    ┌──────────┐   ┌──────────┐   ┌───────────┐
    │ accepted │   │ declined │   │ cancelled │
    └────┬─────┘   └──────────┘   └───────────┘
         │ departure_date passes
         ▼
    ┌──────────────┐
    │  completed   │  ← ADD. Review eligibility depends on it.
    └──────────────┘

  Guards required (none exist today):
    pending → accepted BY TRAVELER   → WITH CHECK on host identity
    accepted → pending               → transition guard
    declined → accepted              → transition guard
    review on non-completed stay     → FK + status check
```

### Rollout / rollback

```
  ROLLOUT                              ROLLBACK
  1. supabase db reset (local)         git revert
  2. RLS test suite green              supabase db reset
  3. proxy.ts + auth (deploy)          redeploy previous
  4. Verify signup creates profile ←── the check that catches the #1 gap
  5. Data layer per domain
  6. Page conversions
  7. Delete mock-data.ts + authContext.tsx
```

**Zero users, zero rows, and the migration never applied. Rewrite
`20260826000000_initial_schema.sql` in place. Do not stack fix-forward
migrations on a file that never ran.** This is the last moment this is free.

Post-deploy check, first 5 minutes: register a new account and confirm a
`profiles` row appears. That single check catches the most likely first failure.

---

## Implementation tasks

### P1 — blocks ship

T1–T8 must land **before any page conversion**. Every one changes the schema,
and they stop being free the moment a real profile exists.

- [ ] **T1** (4h / CC 25m) — schema — Rewrite `initial_schema.sql` from `types/index.ts`, all 13 entities
  - Surfaced by: 0B — schema models 4 of 13; file aborts at line 96
  - Verify: `supabase db reset` completes without error
- [ ] **T2** (2h / CC 10m) — schema — `profiles` INSERT policy + `handle_new_user` trigger
  - Surfaced by: Sec 3 threat 4 — registration is currently impossible
- [ ] **T3** (2h / CC 10m) — schema — `messages`: fix SELECT join, add thread-membership `WITH CHECK`
  - Surfaced by: Sec 3 threat 2 — inject into any stranger's thread
- [ ] **T4** (3h / CC 15m) — schema — `stay_requests`: `WITH CHECK` + status transition guard
  - Surfaced by: Sec 1 state machine — traveler self-accepts
- [ ] **T5** (5h / CC 25m) — schema — Column GRANTs + `BEFORE UPDATE` trigger (decision 5)
- [ ] **T6** (4h / CC 20m) — auth — Access token hook for role claim + admin policies (decision 1)
- [ ] **T7** (4h / CC 20m) — schema — Drop exact coordinates, store fuzzed point only (decision 3)
- [ ] **T8** (1d / CC 45m) — schema — `reviews` table + derived visibility, 14-day window (decision 7)
- [ ] **T9** (4h / CC 20m) — app — `src/proxy.ts` (**not** `middleware.ts`) + render-path guard
  - Surfaced by: Next 16 docs — middleware deprecated; proxy must not be trusted for auth
- [ ] **T10** (1d / CC 45m) — app — Delete `authContext.tsx`; `cache()`-wrapped `getUser()` (decision 2)
- [ ] **T11** (2d / CC 1h) — app — `unwrap()` + `AppError` + `error.tsx` per segment (decision 4)
- [ ] **T12** (2h / CC 10m) — app — Replace `CURRENT_USER` imports in 4 pages
  - Files: `dashboard/page.tsx:14`, `messages/page.tsx:20`, `profile/edit/page.tsx:6`, `reviews/write/[requestId]/page.tsx:12`
- [ ] **T13** (1h / CC 5m) — schema — Indexes on 5 unindexed foreign keys
- [ ] **T14** (3d / CC 1.5h) — test — Vitest + local Supabase RLS suite, 3 seeded users (decision 8)
- [ ] **T15** (2h / CC 10m) — data — Extract `supabase/seed.sql` **before** deleting `mock-data.ts`

### P2 — same branch

- [ ] **T16** (4h / CC 20m) — schema — Join tables for `rsvps`/`upvotedBy`, replace array columns (lost-update race)
- [ ] **T17** (3h / CC 15m) — app+schema — Length CHECKs + `maxLength` on all 38 inputs (0 have one today)
- [ ] **T18** (1d / CC 45m) — schema — Volume caps + deletion path + `moderation_audit` (decision 6)
- [ ] **T19** (1d / CC 45m) — app — PostGIS bbox + pagination on `/explore`
- [ ] **T20** (2d / CC 1h) — ui — loading/error/empty components + 3 bespoke states (decision 9)
- [ ] **T21** (1h / CC 5m) — schema — `updated_at` triggers on 4 tables
- [ ] **T22** (30m / CC 5m) — app — Remove 3 `as any` casts (rule.md 1.1)
  - Files: `community/forum/new/page.tsx:55`, `profile/edit/hosting/page.tsx:118`, `:132`
- [ ] **T23** (1d / CC 45m) — app — Per-action authorization on ~12 Server Actions

### P3 — follow-up (see TODOS.md)

- [ ] **T24** (2d / CC 1h) — Stripe Identity webhook + signature and replay verification
- [ ] **T25** (1d / CC 45m) — Realtime messaging via Supabase Realtime
- [ ] **T26** (4h / CC 20m) — Assert-nonempty guards for the RLS-denial-silent class

---

## Explicitly not in scope

| Item | Why |
|---|---|
| Cold-start liquidity | The cutover makes the product real; it does not make anyone use it |
| Differentiation vs Couchers.org | Raised in premise challenge, unresolved, orthogonal to the cutover |
| Edge rate limiter, block/mute | Deferred by decision 6; revisit at real traffic |
| Cache Components adoption | Opt-in in Next 16, not enabled, migration surface for no current benefit |
| Realtime messaging | Polling or refresh is adequate at launch scale (T25 if wanted) |
| Full 35-state design pass | Decision 9 designs three; `/plan-design-review` owns the rest |

## Open strategic question

The built feature set (forum, events, public trips, emergency alerts, vouches,
reviews) closely mirrors Couchsurfing's. The post-Couchsurfing space is held by
nonprofit, member-governed platforms (Couchers.org, BeWelcome, Trustroots) that
compete on governance, not features, and Couchers.org inherited a community
rather than winning one on product.

No differentiator for Nomads is stated anywhere in the repo. **This does not
block the cutover** but it determines whether the cutover is worth doing at all.
Worth answering before P2.

## Dream state delta

```
  CURRENT                       AFTER THIS PLAN              12-MONTH IDEAL
  ───────                       ───────────────              ──────────────
  22 routes, all mock      →    22 routes, real DB      →    + portable verification
  localStorage "auth"           Supabase Auth + proxy        + progressive trust tiers
  isVerified hardcoded true     Stripe Identity gated        + audit log, moderation SLA
  Schema: never applied         13 tables, RLS enforced      + E2E on trust paths
  Exact coords public           Fuzzed, never stored
  Zero tests                    RLS policy suite
  0 users                       0 users                      1 city with liquidity
```

The plan advances every axis except the last, which is the only one that
determines whether the product lives.
