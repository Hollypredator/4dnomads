-- ──────────────────────────────────────────────
-- Push notification device tokens
-- ──────────────────────────────────────────────
--
-- One row per (user, device). The token is the FCM/APNs registration handle
-- the native shell hands us after the OS grants notification permission.

create table public.device_tokens (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  -- The provider token. Unique on its own, not per-user: when a phone is
  -- handed to someone else and they sign in, the OS reissues the SAME token
  -- to the new account. Without a global unique constraint the old owner
  -- would keep receiving the new owner's private messages.
  token text not null unique,
  platform text not null check (platform in ('ios', 'android', 'web')),
  created_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now()
);

create index device_tokens_user_id_idx on public.device_tokens (user_id);

alter table public.device_tokens enable row level security;

-- A device token is a private routing address: being able to read another
-- user's token means being able to push arbitrary notifications to their
-- phone, so there is deliberately no public SELECT policy here. The sending
-- path runs as service role.
grant select, insert, update, delete on public.device_tokens to authenticated;

create policy "Users can see their own device tokens."
  on public.device_tokens for select
  using (auth.uid() = user_id);

create policy "Users can register a device token for themselves."
  on public.device_tokens for insert
  with check (auth.uid() = user_id);

create policy "Users can refresh their own device tokens."
  on public.device_tokens for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Sign-out and "stop notifying this device" both need to delete.
create policy "Users can remove their own device tokens."
  on public.device_tokens for delete
  using (auth.uid() = user_id);

-- Re-registering the same device must not stack up duplicate rows, and must
-- move the token to whoever is signed in now (see the unique-token note
-- above). SECURITY DEFINER so the ownership transfer can delete a row the
-- caller cannot see under RLS.
create or replace function public.upsert_device_token(p_token text, p_platform text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'not authenticated';
  end if;
  if p_platform not in ('ios', 'android', 'web') then
    raise exception 'invalid platform: %', p_platform;
  end if;

  insert into public.device_tokens (user_id, token, platform)
  values (auth.uid(), p_token, p_platform)
  on conflict (token) do update
    set user_id = auth.uid(),
        platform = excluded.platform,
        last_seen_at = now();
end;
$$;

revoke all on function public.upsert_device_token(text, text) from public, anon;
grant execute on function public.upsert_device_token(text, text) to authenticated;
