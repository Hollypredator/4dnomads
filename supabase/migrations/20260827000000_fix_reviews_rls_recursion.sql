-- Fix: the reviews SELECT policy (20260826000005_reviews.sql) contains a
-- subquery against public.reviews itself (checking whether a counterpart
-- review exists). Postgres re-applies a table's RLS policy to every
-- reference to that table, including subqueries inside the policy's own
-- USING clause -- so the counterpart check recursed into itself forever
-- (42P17 "infinite recursion detected in policy for relation reviews").
-- Discovered 2026-08-27 the first time a real profile page hit this path.
--
-- Fix: move the counterpart check into a SECURITY DEFINER function, which
-- runs with the function owner's privileges and bypasses RLS -- the
-- canonical way to break this kind of self-referencing RLS cycle.

create or replace function public.review_has_counterpart(p_stay_request_id uuid, p_target_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.reviews
    where stay_request_id = p_stay_request_id and author_id = p_target_id
  );
$$;

revoke all on function public.review_has_counterpart from public;
grant execute on function public.review_has_counterpart to authenticated, anon;

-- The original policy name was long enough that Postgres silently
-- truncated it on creation (NOTICE at migration time), so its exact
-- on-disk name isn't guaranteed here -- find and drop it dynamically
-- rather than guessing the truncated string.
do $$
declare
  pol record;
begin
  for pol in
    select policyname from pg_policies
    where schemaname = 'public' and tablename = 'reviews' and cmd = 'SELECT'
  loop
    execute format('drop policy %I on public.reviews', pol.policyname);
  end loop;
end $$;

create policy "reviews_select_visible"
  on public.reviews for select
  using (
    author_id = auth.uid()
    or public.is_moderator()
    or public.review_has_counterpart(stay_request_id, target_id)
    or exists (
      select 1 from public.stay_requests sr
      where sr.id = reviews.stay_request_id
        and sr.departure_date < (current_date - interval '14 days')
    )
  );
