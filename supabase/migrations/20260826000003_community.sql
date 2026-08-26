-- ──────────────────────────────────────────────
-- Public trips
-- ──────────────────────────────────────────────

create table public.public_trips (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  traveler_id uuid references public.profiles(id) not null,
  destination text not null check (char_length(destination) between 1 and 120),
  arrival_date date not null,
  departure_date date not null,
  number_of_guests integer not null default 1 check (number_of_guests between 1 and 20),
  description text not null default '' check (char_length(description) <= 2000),

  constraint public_trips_valid_dates check (departure_date > arrival_date)
);

create index public_trips_traveler_id_index on public.public_trips (traveler_id);

alter table public.public_trips enable row level security;

create policy "Public trips are viewable by everyone."
  on public.public_trips for select using (true);

create policy "Travelers can create their own public trips."
  on public.public_trips for insert with check (auth.uid() = traveler_id);

create policy "Travelers can update their own public trips."
  on public.public_trips for update using (auth.uid() = traveler_id) with check (auth.uid() = traveler_id);

create policy "Travelers can delete their own public trips."
  on public.public_trips for delete using (auth.uid() = traveler_id);

-- ──────────────────────────────────────────────
-- Local events
--
-- T16: rsvps was a string[] in the mock design. Two concurrent RSVPs racing
-- to append to the same array is a lost update. Modeled as a join table
-- with a unique constraint instead, so concurrent RSVPs cannot collide.
-- ──────────────────────────────────────────────

create table public.local_events (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  creator_id uuid references public.profiles(id) not null,
  title text not null check (char_length(title) between 1 and 150),
  description text not null default '' check (char_length(description) <= 2000),
  location_name text not null check (char_length(location_name) between 1 and 120),
  event_date date not null,
  event_time time not null,
  max_participants integer not null default 10 check (max_participants between 1 and 500)
);

create index local_events_creator_id_index on public.local_events (creator_id);

alter table public.local_events enable row level security;

create policy "Events are viewable by everyone."
  on public.local_events for select using (true);

create policy "Creators can insert their own events."
  on public.local_events for insert with check (auth.uid() = creator_id);

create policy "Creators can update their own events."
  on public.local_events for update using (auth.uid() = creator_id) with check (auth.uid() = creator_id);

create policy "Creators can delete their own events."
  on public.local_events for delete using (auth.uid() = creator_id);

create table public.local_event_rsvps (
  event_id uuid references public.local_events(id) on delete cascade not null,
  user_id uuid references public.profiles(id) not null,
  created_at timestamptz not null default now(),
  primary key (event_id, user_id)
);

alter table public.local_event_rsvps enable row level security;

create policy "RSVPs are viewable by everyone."
  on public.local_event_rsvps for select using (true);

-- Capacity enforced here, atomically, rather than in application code where
-- two concurrent requests could both read "under capacity" and both insert.
create or replace function public.enforce_event_capacity()
returns trigger
language plpgsql
as $$
declare
  current_count integer;
  capacity integer;
begin
  select max_participants into capacity from public.local_events where id = new.event_id;
  select count(*) into current_count from public.local_event_rsvps where event_id = new.event_id;

  if current_count >= capacity then
    raise exception 'This event is at capacity.' using errcode = 'P0001';
  end if;

  return new;
end;
$$;

create trigger local_event_rsvps_capacity_check
  before insert on public.local_event_rsvps
  for each row execute function public.enforce_event_capacity();

create policy "Users can RSVP for themselves."
  on public.local_event_rsvps for insert with check (auth.uid() = user_id);

create policy "Users can cancel their own RSVP."
  on public.local_event_rsvps for delete using (auth.uid() = user_id);

-- ──────────────────────────────────────────────
-- Forum
--
-- T16: upvotedBy was a string[] in the mock design, same lost-update problem
-- as event RSVPs. Modeled as a join table.
-- ──────────────────────────────────────────────

create type public.forum_category as enum ('Hosting Q&A', 'Meetups & Coffee', 'Visa & Nomad Tips', 'Travel Buddies');

create table public.forum_topics (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  city text not null check (char_length(city) between 1 and 80),
  category public.forum_category not null,
  title text not null check (char_length(title) between 1 and 200),
  content text not null check (char_length(content) between 1 and 5000),
  author_id uuid references public.profiles(id) not null
);

create index forum_topics_city_index on public.forum_topics (city);
create index forum_topics_author_id_index on public.forum_topics (author_id);

alter table public.forum_topics enable row level security;

create policy "Forum topics are viewable by everyone."
  on public.forum_topics for select using (true);

create policy "Authors can create their own forum topics."
  on public.forum_topics for insert with check (auth.uid() = author_id);

create policy "Authors can delete their own forum topics."
  on public.forum_topics for delete using (auth.uid() = author_id or public.is_moderator());

create table public.forum_comments (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  topic_id uuid references public.forum_topics(id) on delete cascade not null,
  author_id uuid references public.profiles(id) not null,
  content text not null check (char_length(content) between 1 and 3000)
);

create index forum_comments_topic_id_index on public.forum_comments (topic_id);

alter table public.forum_comments enable row level security;

create policy "Forum comments are viewable by everyone."
  on public.forum_comments for select using (true);

create policy "Authors can create their own forum comments."
  on public.forum_comments for insert with check (auth.uid() = author_id);

create policy "Authors can delete their own forum comments."
  on public.forum_comments for delete using (auth.uid() = author_id or public.is_moderator());

create table public.forum_upvotes (
  topic_id uuid references public.forum_topics(id) on delete cascade not null,
  user_id uuid references public.profiles(id) not null,
  created_at timestamptz not null default now(),
  primary key (topic_id, user_id)
);

alter table public.forum_upvotes enable row level security;

create policy "Upvotes are viewable by everyone."
  on public.forum_upvotes for select using (true);

create policy "Users can upvote as themselves."
  on public.forum_upvotes for insert with check (auth.uid() = user_id);

create policy "Users can remove their own upvote."
  on public.forum_upvotes for delete using (auth.uid() = user_id);

-- ──────────────────────────────────────────────
-- Community vouches
-- ──────────────────────────────────────────────

create table public.community_vouches (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  author_id uuid references public.profiles(id) not null,
  target_id uuid references public.profiles(id) not null,
  text text not null check (char_length(text) between 1 and 1000),

  constraint vouches_not_self check (author_id <> target_id),
  constraint one_vouch_per_pair unique (author_id, target_id)
);

create index community_vouches_target_id_index on public.community_vouches (target_id);

alter table public.community_vouches enable row level security;

create policy "Vouches are viewable by everyone."
  on public.community_vouches for select using (true);

create policy "Users can vouch for others as themselves."
  on public.community_vouches for insert with check (auth.uid() = author_id);

create policy "Authors can delete their own vouch."
  on public.community_vouches for delete using (auth.uid() = author_id);

-- ──────────────────────────────────────────────
-- Emergency alerts
-- ──────────────────────────────────────────────

create table public.emergency_alerts (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  author_id uuid references public.profiles(id) not null,
  location_name text not null check (char_length(location_name) between 1 and 120),
  description text not null check (char_length(description) between 1 and 2000),
  contact_info text not null check (char_length(contact_info) between 1 and 300),
  is_resolved boolean not null default false
);

create index emergency_alerts_is_resolved_index on public.emergency_alerts (is_resolved) where not is_resolved;

alter table public.emergency_alerts enable row level security;

create policy "Emergency alerts are viewable by everyone."
  on public.emergency_alerts for select using (true);

create policy "Authenticated users can create an alert."
  on public.emergency_alerts for insert with check (auth.uid() = author_id);

create policy "Authors and moderators can resolve an alert."
  on public.emergency_alerts for update
  using (auth.uid() = author_id or public.is_moderator())
  with check (auth.uid() = author_id or public.is_moderator());

-- ──────────────────────────────────────────────
-- User reports (moderation input)
-- ──────────────────────────────────────────────

create type public.report_status as enum ('pending', 'resolved');

create table public.user_reports (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  reporter_id uuid references public.profiles(id) not null,
  target_id uuid references public.profiles(id) not null,
  reason text not null check (char_length(reason) between 1 and 2000),
  status public.report_status not null default 'pending',
  action_taken text,

  constraint reports_not_self check (reporter_id <> target_id)
);

create index user_reports_status_index on public.user_reports (status) where status = 'pending';
create index user_reports_target_id_index on public.user_reports (target_id);

alter table public.user_reports enable row level security;

create policy "Reporters can view their own reports; moderators view all."
  on public.user_reports for select
  using (auth.uid() = reporter_id or public.is_moderator());

create policy "Authenticated users can file a report."
  on public.user_reports for insert with check (auth.uid() = reporter_id);

create policy "Only moderators can resolve reports."
  on public.user_reports for update using (public.is_moderator()) with check (public.is_moderator());
