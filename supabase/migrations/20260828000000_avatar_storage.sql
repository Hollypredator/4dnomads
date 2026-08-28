-- ──────────────────────────────────────────────
-- Avatar storage
-- ──────────────────────────────────────────────
--
-- profiles.avatar_url has existed since the initial schema and is selected by
-- every data module, but nothing ever wrote to it: there was no upload path
-- and no profile-edit form, so every avatar in the app rendered as initials.
--
-- Public-read bucket: avatars appear on public profiles, host cards and the
-- vouch feed, which anonymous visitors can see. Nothing private goes here.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'avatars',
  'avatars',
  true,
  -- 5 MB. Phone cameras produce far larger files; the client downscales
  -- before upload, and this is the backstop if that is bypassed.
  5242880,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

-- Objects are keyed "<user_id>/<filename>", so the first path segment is the
-- owner. Every write policy below checks it: without that, any authenticated
-- user could overwrite anyone else's avatar.
create policy "Avatar images are publicly readable."
  on storage.objects for select
  using (bucket_id = 'avatars');

create policy "Users can upload their own avatar."
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "Users can replace their own avatar."
  on storage.objects for update to authenticated
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  )
  with check (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "Users can delete their own avatar."
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
