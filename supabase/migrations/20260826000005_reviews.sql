-- ──────────────────────────────────────────────
-- Reviews
--
-- Decision 7 (docs/cutover-plan.md): no stored is_blind column. The mock
-- design flipped the counterpart's row directly, which RLS must reject
-- (it is a write to another user's row). Visibility is derived instead:
-- a review is visible once the counterpart review exists, OR 14 days have
-- passed since the stay ended, OR you are the author. That closes the
-- "never review, and never be reviewed" attack a purely mutual-reveal
-- design allows.
-- ──────────────────────────────────────────────

create table public.reviews (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  stay_request_id uuid references public.stay_requests(id) not null,
  author_id uuid references public.profiles(id) not null,
  target_id uuid references public.profiles(id) not null,
  rating smallint not null check (rating between 1 and 5),
  text text not null check (char_length(text) between 1 and 3000),

  constraint reviews_not_self check (author_id <> target_id),
  constraint one_review_per_author_per_stay unique (stay_request_id, author_id)
);

create index reviews_target_id_index on public.reviews (target_id);
create index reviews_stay_request_id_index on public.reviews (stay_request_id);

-- A review may only be written by a party to a completed stay, about the
-- other party to that same stay. This is the fix for the gap in Section 2:
-- "review on a stay that was never accepted" had no error code because
-- there was no constraint, only silence.
create or replace function public.enforce_review_eligibility()
returns trigger
language plpgsql
as $$
declare
  sr public.stay_requests;
begin
  select * into sr from public.stay_requests where id = new.stay_request_id;

  if sr is null then
    raise exception 'Stay request not found.' using errcode = 'P0002';
  end if;

  if sr.status <> 'completed' then
    raise exception 'You can only review a stay after it has been completed.' using errcode = 'P0001';
  end if;

  if new.author_id not in (sr.traveler_id, sr.host_id) then
    raise exception 'You were not a party to this stay.' using errcode = '42501';
  end if;

  if new.target_id <> (case when new.author_id = sr.traveler_id then sr.host_id else sr.traveler_id end) then
    raise exception 'You can only review the other party to this stay.' using errcode = '42501';
  end if;

  return new;
end;
$$;

create trigger reviews_check_eligibility
  before insert on public.reviews
  for each row execute function public.enforce_review_eligibility();

alter table public.reviews enable row level security;

grant select, insert on public.reviews to authenticated;
grant select on public.reviews to anon;

-- Derived visibility, enforced at the row level so a hidden review never
-- reaches the browser at all (unlike a UI-side isBlind filter, which hides
-- nothing from anyone reading the network response directly).
create policy "Reviews are visible once mutual, after 14 days, or to the author."
  on public.reviews for select
  using (
    author_id = auth.uid()
    or public.is_moderator()
    or exists (
      select 1 from public.reviews counterpart
      where counterpart.stay_request_id = reviews.stay_request_id
        and counterpart.author_id = reviews.target_id
    )
    or exists (
      select 1 from public.stay_requests sr
      where sr.id = reviews.stay_request_id
        and sr.departure_date < (current_date - interval '14 days')
    )
  );

create policy "Eligible parties can write one review per completed stay."
  on public.reviews for insert
  with check (author_id = auth.uid());
