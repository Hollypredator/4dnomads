-- Extensions
create extension if not exists postgis with schema extensions;
create extension if not exists pg_cron with schema extensions;

-- ──────────────────────────────────────────────
-- Admin role: stored in auth.users.raw_app_meta_data, surfaced as a JWT claim.
-- app_metadata is writable only by the service role, so a user cannot grant
-- themselves a role even if a table policy is misconfigured (see decision 1
-- in docs/cutover-plan.md).
-- ──────────────────────────────────────────────

create or replace function public.custom_access_token_hook(event jsonb)
returns jsonb
language plpgsql
stable
as $$
declare
  claims jsonb;
  user_role text;
begin
  select raw_app_meta_data ->> 'role' into user_role
  from auth.users
  where id = (event ->> 'user_id')::uuid;

  claims := event -> 'claims';

  if user_role is not null then
    claims := jsonb_set(claims, '{app_metadata,role}', to_jsonb(user_role));
  end if;

  event := jsonb_set(event, '{claims}', claims);
  return event;
end;
$$;

grant usage on schema public to supabase_auth_admin;
grant execute on function public.custom_access_token_hook to supabase_auth_admin;
revoke execute on function public.custom_access_token_hook from authenticated, anon, public;

-- Helper used throughout RLS policies. STABLE so the planner can cache it
-- within a single statement.
create or replace function public.current_role_claim()
returns text
language sql
stable
as $$
  select coalesce(auth.jwt() -> 'app_metadata' ->> 'role', 'user');
$$;

create or replace function public.is_moderator()
returns boolean
language sql
stable
as $$
  select public.current_role_claim() in ('moderator', 'admin');
$$;

create or replace function public.is_admin()
returns boolean
language sql
stable
as $$
  select public.current_role_claim() = 'admin';
$$;

-- Shared updated_at maintenance (T21).
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;
