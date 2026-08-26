-- ──────────────────────────────────────────────
-- Stay requests
--
-- Adds a completed state (missing from the original design; see Section 1
-- state machine in docs/cutover-plan.md) and enforces every transition in a
-- trigger, since a state machine is not expressible cleanly as RLS alone.
-- ──────────────────────────────────────────────

create type public.request_status as enum ('pending', 'accepted', 'declined', 'cancelled', 'completed');

create table public.stay_requests (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  traveler_id uuid references public.profiles(id) not null,
  host_id uuid references public.profiles(id) not null,
  home_id uuid references public.homes(id) not null,

  arrival_date date not null,
  departure_date date not null,
  number_of_guests integer not null default 1 check (number_of_guests between 1 and 20),
  status public.request_status not null default 'pending',
  initial_message text not null check (char_length(initial_message) between 1 and 3000),
  invite_sent boolean not null default false,

  constraint valid_dates check (departure_date > arrival_date),
  constraint traveler_is_not_host check (traveler_id <> host_id)
);

create index stay_requests_traveler_id_index on public.stay_requests (traveler_id);
create index stay_requests_host_id_index on public.stay_requests (host_id);
create index stay_requests_home_id_index on public.stay_requests (home_id);

create trigger stay_requests_set_updated_at
  before update on public.stay_requests
  for each row execute function public.set_updated_at();

-- T18: a traveler with too many simultaneous pending requests is the crude
-- but cheap volume cap agreed in decision 6.
create or replace function public.enforce_pending_request_cap()
returns trigger
language plpgsql
as $$
begin
  if new.status = 'pending' and (tg_op = 'INSERT') then
    if (select count(*) from public.stay_requests
        where traveler_id = new.traveler_id and status = 'pending') >= 20 then
      raise exception 'Too many pending stay requests. Wait for a response before sending more.'
        using errcode = 'P0001';
    end if;
  end if;
  return new;
end;
$$;

create trigger stay_requests_cap_check
  before insert on public.stay_requests
  for each row execute function public.enforce_pending_request_cap();

-- The state machine. See the diagram in docs/cutover-plan.md.
create or replace function public.enforce_stay_request_transition()
returns trigger
language plpgsql
as $$
begin
  if new.traveler_id <> old.traveler_id
     or new.host_id <> old.host_id
     or new.home_id <> old.home_id then
    raise exception 'traveler_id, host_id, and home_id are immutable.' using errcode = '42501';
  end if;

  if new.status = old.status then
    return new; -- no state transition, just an ordinary field edit
  end if;

  if old.status = 'pending' and new.status in ('accepted', 'declined') then
    if auth.uid() <> old.host_id and auth.role() <> 'service_role' then
      raise exception 'Only the host can accept or decline a pending request.' using errcode = '42501';
    end if;
  elsif old.status = 'pending' and new.status = 'cancelled' then
    if auth.uid() <> old.traveler_id and auth.role() <> 'service_role' then
      raise exception 'Only the traveler can cancel a pending request.' using errcode = '42501';
    end if;
  elsif old.status = 'accepted' and new.status = 'cancelled' then
    if auth.uid() not in (old.traveler_id, old.host_id) and auth.role() <> 'service_role' then
      raise exception 'Only a party to this request can cancel it.' using errcode = '42501';
    end if;
  elsif old.status = 'accepted' and new.status = 'completed' then
    if auth.role() <> 'service_role' then
      raise exception 'Requests are marked completed automatically after the stay ends.' using errcode = '42501';
    end if;
  else
    raise exception 'Invalid stay request transition: % -> %', old.status, new.status using errcode = '42501';
  end if;

  return new;
end;
$$;

create trigger stay_requests_guard_transition
  before update on public.stay_requests
  for each row execute function public.enforce_stay_request_transition();

-- Scheduled via pg_cron (see supabase/seed.sql / project setup): accepted
-- stays past their departure date become completed, which is what unlocks
-- review eligibility.
create or replace function public.complete_past_stay_requests()
returns void
language sql
security definer
set search_path = public
as $$
  update public.stay_requests
  set status = 'completed'
  where status = 'accepted' and departure_date < current_date;
$$;

alter table public.stay_requests enable row level security;

create policy "Parties can view their own stay requests."
  on public.stay_requests for select
  using (auth.uid() in (traveler_id, host_id) or public.is_moderator());

create policy "Travelers can create requests for themselves."
  on public.stay_requests for insert
  with check (auth.uid() = traveler_id and status = 'pending');

create policy "Parties can update their own stay requests."
  on public.stay_requests for update
  using (auth.uid() in (traveler_id, host_id))
  with check (auth.uid() in (traveler_id, host_id));
  -- Column-shape and transition legality are enforced by the trigger above,
  -- not by WITH CHECK: comparing OLD/NEW state cannot be expressed cleanly
  -- in a policy, and a trigger gives a precise, testable error per violation.

-- ──────────────────────────────────────────────
-- Messages
--
-- T3: the original policy compared stay_requests.id to itself (a self-alias
-- bug) and never checked thread membership at all. Rewritten to actually
-- verify the sender belongs to the thread being written to.
-- ──────────────────────────────────────────────

create table public.messages (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  stay_request_id uuid references public.stay_requests(id) on delete cascade,
  event_group_id uuid references public.local_events(id) on delete cascade,
  sender_id uuid references public.profiles(id) not null,
  content text not null check (char_length(content) between 1 and 5000),
  is_read boolean not null default false,

  constraint exactly_one_thread check (
    (stay_request_id is not null)::int + (event_group_id is not null)::int = 1
  )
);

create index messages_stay_request_id_index on public.messages (stay_request_id);
create index messages_event_group_id_index on public.messages (event_group_id);
create index messages_sender_id_index on public.messages (sender_id);

-- T18: crude per-minute volume cap on messages.
create or replace function public.enforce_message_rate_cap()
returns trigger
language plpgsql
as $$
begin
  if (select count(*) from public.messages
      where sender_id = new.sender_id and created_at > now() - interval '1 minute') >= 30 then
    raise exception 'You are sending messages too quickly. Please wait a moment.' using errcode = 'P0001';
  end if;
  return new;
end;
$$;

create trigger messages_rate_cap
  before insert on public.messages
  for each row execute function public.enforce_message_rate_cap();

alter table public.messages enable row level security;

create policy "Thread participants can view messages."
  on public.messages for select
  using (
    exists (
      select 1 from public.stay_requests sr
      where sr.id = messages.stay_request_id
        and auth.uid() in (sr.traveler_id, sr.host_id)
    )
    or exists (
      select 1 from public.local_event_rsvps r
      where r.event_id = messages.event_group_id
        and r.user_id = auth.uid()
    )
    or public.is_moderator()
  );

create policy "Thread participants can send messages as themselves."
  on public.messages for insert
  with check (
    sender_id = auth.uid()
    and (
      exists (
        select 1 from public.stay_requests sr
        where sr.id = messages.stay_request_id
          and auth.uid() in (sr.traveler_id, sr.host_id)
      )
      or exists (
        select 1 from public.local_event_rsvps r
        where r.event_id = messages.event_group_id
          and r.user_id = auth.uid()
      )
    )
  );
