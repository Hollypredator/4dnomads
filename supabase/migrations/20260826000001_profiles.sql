-- ──────────────────────────────────────────────
-- Profiles
-- ──────────────────────────────────────────────

create table public.profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  first_name text not null check (char_length(first_name) between 1 and 80),
  last_name text not null check (char_length(last_name) between 1 and 80),
  email text not null,
  avatar_url text,
  bio text not null default '' check (char_length(bio) <= 2000),
  languages text[] not null default '{}',
  interests text[] not null default '{}',
  is_verified boolean not null default false, -- controlled by the Stripe Identity webhook only (T24)
  is_banned boolean not null default false,
  deleted_at timestamptz -- soft delete; see T18 account-deletion path
);

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

alter table public.profiles enable row level security;

-- Column privileges: the privileged fields cannot be reached by anon/authenticated
-- at the grant layer at all. See decision 5 in docs/cutover-plan.md.
revoke update on public.profiles from authenticated, anon;
grant select on public.profiles to authenticated, anon;
grant insert (id, first_name, last_name, email, bio, languages, interests) on public.profiles to authenticated;
grant update (first_name, last_name, avatar_url, bio, languages, interests) on public.profiles to authenticated;

-- Belt-and-braces: even a service-role bug or a future policy cannot flip
-- is_verified/is_banned outside of the service role itself.
create or replace function public.guard_privileged_profile_columns()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.role() <> 'service_role' then
    new.is_verified := old.is_verified;
    new.is_banned := old.is_banned;
  end if;
  return new;
end;
$$;

create trigger profiles_guard_privileged_columns
  before update on public.profiles
  for each row execute function public.guard_privileged_profile_columns();

create policy "Profiles are viewable by everyone not banned, or by the owner."
  on public.profiles for select
  using (deleted_at is null and (not is_banned or auth.uid() = id or public.is_moderator()));

create policy "Users can insert their own profile."
  on public.profiles for insert
  with check (auth.uid() = id);

create policy "Users can update their own profile."
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

create policy "Moderators can update any profile."
  on public.profiles for update
  using (public.is_moderator())
  with check (public.is_moderator());

-- T2: creating an auth user automatically creates the matching profile row.
-- Without this, sign-up succeeds in auth.users but the app has no profile to
-- read, which is a dead end for every page.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, first_name, last_name, email)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'first_name', 'New'),
    coalesce(new.raw_user_meta_data ->> 'last_name', 'User'),
    new.email
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
