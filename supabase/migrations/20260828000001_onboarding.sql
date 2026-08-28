-- ──────────────────────────────────────────────
-- Onboarding completion
-- ──────────────────────────────────────────────
--
-- Signup previously went straight from a four-field form to the dashboard,
-- so a new account had no photo, no bio, no languages and no interests -- and
-- the only place to set them was buried in Settings, where nobody looks. Every
-- profile in the app was therefore permanently blank.
--
-- Nullable timestamp rather than a boolean: "when did they finish" answers
-- "did they finish" too, and is worth having for funnel questions later.

alter table public.profiles
  add column onboarding_completed_at timestamptz;

comment on column public.profiles.onboarding_completed_at is
  'Set when the user finishes (or explicitly skips) the onboarding flow. NULL means they have not been through it yet.';

-- Backfill: existing accounts predate onboarding and must not be dropped into
-- it retroactively on their next sign-in.
update public.profiles set onboarding_completed_at = created_at;

-- The update GRANT on profiles is column-scoped (decision 5), so this column
-- is unreachable to `authenticated` until it is named here.
grant update (onboarding_completed_at) on public.profiles to authenticated;
