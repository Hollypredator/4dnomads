-- ──────────────────────────────────────────────
-- Moderation audit, admin actions, and account deletion (decision 6)
-- ──────────────────────────────────────────────

create table public.moderation_audit (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  actor_id uuid references public.profiles(id), -- null for automated/system actions
  action text not null,
  target_id uuid references public.profiles(id),
  report_id uuid references public.user_reports(id),
  detail jsonb not null default '{}'
);

create index moderation_audit_target_id_index on public.moderation_audit (target_id);

alter table public.moderation_audit enable row level security;

create policy "Only moderators can read the audit log."
  on public.moderation_audit for select using (public.is_moderator());

-- No insert/update/delete policy for anyone: the audit log is written only
-- by SECURITY DEFINER functions below (or the service role), never directly.

-- Now that moderation_audit exists, allow moderators to ban/unban via the
-- privileged-column guard from 20260826000001_profiles.sql. is_verified
-- stays service-role-only (see T24: it is meant to be Stripe-webhook-driven,
-- not a manual admin toggle, so no exception is added for it here).
create or replace function public.guard_privileged_profile_columns()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.role() <> 'service_role' then
    new.is_verified := old.is_verified;
    if not public.is_moderator() then
      new.is_banned := old.is_banned;
    end if;
  end if;
  return new;
end;
$$;

-- Replaces mock-data.ts resolveReport(): resolves the report and, on a ban
-- action, bans the target and writes both to the audit log atomically.
create or replace function public.resolve_report(p_report_id uuid, p_action text)
returns public.user_reports
language plpgsql
security definer
set search_path = public
as $$
declare
  result public.user_reports;
begin
  if not public.is_moderator() then
    raise exception 'Only moderators can resolve reports.' using errcode = '42501';
  end if;

  update public.user_reports
  set status = 'resolved', action_taken = p_action
  where id = p_report_id
  returning * into result;

  if result is null then
    raise exception 'Report not found.' using errcode = 'P0002';
  end if;

  if p_action = 'ban' then
    update public.profiles set is_banned = true where id = result.target_id;
  end if;

  insert into public.moderation_audit (actor_id, action, target_id, report_id, detail)
  values (auth.uid(), 'resolve_report:' || p_action, result.target_id, result.id, jsonb_build_object());

  return result;
end;
$$;

revoke all on function public.resolve_report from public;
grant execute on function public.resolve_report to authenticated;

-- T18: account deletion. This anonymizes and soft-deletes the profile row so
-- referential integrity (stay_requests, messages, reviews) survives. It does
-- NOT delete the auth.users row or revoke sessions -- that requires the
-- Supabase Auth admin API with the service-role key, which only an Edge
-- Function or server-side admin client can call. This RPC is step one of a
-- two-step deletion; the second step is server-side, not SQL.
create or replace function public.delete_own_account()
returns void
language plpgsql
security invoker
set search_path = public
as $$
begin
  update public.profiles
  set
    deleted_at = now(),
    first_name = 'Deleted',
    last_name = 'User',
    bio = '',
    avatar_url = null,
    languages = '{}',
    interests = '{}'
  where id = auth.uid();

  insert into public.moderation_audit (actor_id, action, target_id, detail)
  values (auth.uid(), 'self_delete', auth.uid(), jsonb_build_object());
end;
$$;

revoke all on function public.delete_own_account from public;
grant execute on function public.delete_own_account to authenticated;

-- Verification stays service-role-only (T24), invoked by the Stripe Identity
-- webhook handler, not by this RPC being exposed to authenticated users.
create or replace function public.mark_user_verified(p_user_id uuid)
returns void
language sql
security definer
set search_path = public
as $$
  update public.profiles set is_verified = true where id = p_user_id;
$$;

revoke all on function public.mark_user_verified from public, authenticated, anon;
-- Only callable by service_role (the default for functions with no grant to
-- authenticated/anon), i.e. from the Stripe webhook handler in T24.

-- Schedule the stay-completion sweep from 20260826000004. Runs hourly; being
-- a day late in flipping a status to 'completed' has no user-facing cost.
select cron.schedule(
  'complete-past-stay-requests',
  '0 * * * *',
  $$select public.complete_past_stay_requests()$$
);
