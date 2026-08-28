-- ──────────────────────────────────────────────
-- Make handle_new_user() understand OAuth metadata
-- ──────────────────────────────────────────────
--
-- The original trigger only read 'first_name'/'last_name', which are the keys
-- the email/password signup path sets explicitly (registerAction passes them
-- in options.data). An OAuth provider sets its own keys instead, so every
-- Google signup would have fallen through to the coalesce defaults and landed
-- in the app as a profile literally named "New User".
--
-- Google populates: given_name, family_name, name, full_name, picture,
-- avatar_url, email. The order below prefers the explicit signup keys, then
-- the provider's structured name fields, then splits a single display name,
-- and only then falls back to a placeholder.

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  meta jsonb := coalesce(new.raw_user_meta_data, '{}'::jsonb);
  display_name text;
  derived_first text;
  derived_last text;
begin
  -- A single display string ("Ada Lovelace") is the only name some providers
  -- return, so it is split on the last space: everything before is the given
  -- name, the remainder is the family name.
  display_name := nullif(trim(coalesce(meta ->> 'full_name', meta ->> 'name', '')), '');

  derived_first := coalesce(
    nullif(trim(meta ->> 'first_name'), ''),
    nullif(trim(meta ->> 'given_name'), ''),
    nullif(split_part(display_name, ' ', 1), ''),
    -- Local-part of the email is a better last resort than a placeholder:
    -- it is at least something the person recognises as theirs.
    nullif(split_part(coalesce(new.email, ''), '@', 1), ''),
    'New'
  );

  derived_last := coalesce(
    nullif(trim(meta ->> 'last_name'), ''),
    nullif(trim(meta ->> 'family_name'), ''),
    nullif(trim(substring(display_name from '\s(\S+)$')), ''),
    'User'
  );

  insert into public.profiles (id, first_name, last_name, email, avatar_url)
  values (
    new.id,
    -- first_name/last_name carry a 1..80 length CHECK; a provider is free to
    -- return something longer, and an exception here would abort the whole
    -- auth.users insert and fail the signup.
    left(derived_first, 80),
    left(derived_last, 80),
    new.email,
    nullif(trim(coalesce(meta ->> 'avatar_url', meta ->> 'picture', '')), '')
  );
  return new;
end;
$$;
