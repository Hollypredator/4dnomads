-- ──────────────────────────────────────────────
-- Homes
--
-- Decision 3 (docs/cutover-plan.md): exact coordinates are never persisted.
-- RLS is row-level and cannot hide one column of a row you are allowed to
-- see, so there is no policy that could protect an exact-address column.
-- The fix is structural: the column does not exist. Hosts submit an exact
-- pin only as a transient RPC argument; only a randomly offset point is
-- ever written to disk. The real address is exchanged in chat once a stay
-- request is accepted.
--
-- PostGIS lives in the `extensions` schema (Supabase's default, kept out of
-- search_path deliberately), so every type and function below is schema-
-- qualified rather than relying on search_path.
-- ──────────────────────────────────────────────

create type public.hosting_status as enum ('accepting', 'maybe', 'not_accepting', 'wants_to_meet');
create type public.smoking_policy as enum ('Allowed', 'Outside only', 'Not allowed');
create type public.gender_preference as enum ('Any', 'Males only', 'Females only');

create table public.homes (
  id uuid primary key default gen_random_uuid(),
  host_id uuid references public.profiles(id) on delete cascade not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  sleeping_arrangement text not null check (char_length(sleeping_arrangement) between 1 and 200),
  max_guests integer not null default 1 check (max_guests between 1 and 20),
  house_rules text not null default '' check (char_length(house_rules) <= 2000),

  location_name text not null check (char_length(location_name) between 1 and 120),
  -- Fuzzed point only. There is deliberately no exact-coordinate column.
  approx_coordinates extensions.geography(point) not null,

  smoking_policy public.smoking_policy not null default 'Not allowed',
  pets_info text not null default '' check (char_length(pets_info) <= 500),
  amenities text[] not null default '{}',
  hosting_status public.hosting_status not null default 'not_accepting',
  gender_preference public.gender_preference not null default 'Any',
  kid_friendly boolean not null default false,
  wheelchair_accessible boolean not null default false,
  blockout_dates date[] not null default '{}',

  constraint unique_host_home unique (host_id)
);

create index homes_geo_index on public.homes using gist (approx_coordinates);
create index homes_host_id_index on public.homes (host_id);

create trigger homes_set_updated_at
  before update on public.homes
  for each row execute function public.set_updated_at();

-- Fuzz a real (lat, lng) by a random bearing and a random distance in the
-- 200m-1000m band, using geography math so the offset is in real meters
-- regardless of latitude.
create or replace function public.fuzz_point(lat double precision, lng double precision)
returns extensions.geography
language sql
stable
as $$
  select extensions.ST_Project(
    extensions.ST_SetSRID(extensions.ST_MakePoint(lng, lat), 4326)::extensions.geography,
    200 + random() * 800,        -- 200m to 1000m
    random() * 2 * pi()          -- random bearing, radians
  );
$$;

-- The only write path for a home's location. Exact lat/lng are function
-- arguments, never assigned to a column, so they exist only for the
-- duration of this call.
create or replace function public.upsert_home(
  p_sleeping_arrangement text,
  p_max_guests integer,
  p_house_rules text,
  p_location_name text,
  p_lat double precision,
  p_lng double precision,
  p_smoking_policy public.smoking_policy,
  p_pets_info text,
  p_amenities text[],
  p_hosting_status public.hosting_status,
  p_gender_preference public.gender_preference,
  p_kid_friendly boolean,
  p_wheelchair_accessible boolean,
  p_blockout_dates date[]
)
returns public.homes
language plpgsql
security invoker
set search_path = public, extensions
as $$
declare
  result public.homes;
begin
  insert into public.homes (
    host_id, sleeping_arrangement, max_guests, house_rules, location_name,
    approx_coordinates, smoking_policy, pets_info, amenities, hosting_status,
    gender_preference, kid_friendly, wheelchair_accessible, blockout_dates
  ) values (
    auth.uid(), p_sleeping_arrangement, p_max_guests, p_house_rules, p_location_name,
    public.fuzz_point(p_lat, p_lng), p_smoking_policy, p_pets_info, p_amenities,
    p_hosting_status, p_gender_preference, p_kid_friendly, p_wheelchair_accessible,
    p_blockout_dates
  )
  on conflict (host_id) do update set
    sleeping_arrangement = excluded.sleeping_arrangement,
    max_guests = excluded.max_guests,
    house_rules = excluded.house_rules,
    location_name = excluded.location_name,
    approx_coordinates = excluded.approx_coordinates,
    smoking_policy = excluded.smoking_policy,
    pets_info = excluded.pets_info,
    amenities = excluded.amenities,
    hosting_status = excluded.hosting_status,
    gender_preference = excluded.gender_preference,
    kid_friendly = excluded.kid_friendly,
    wheelchair_accessible = excluded.wheelchair_accessible,
    blockout_dates = excluded.blockout_dates
  returning * into result;

  return result;
end;
$$;

revoke all on function public.upsert_home from public;
grant execute on function public.upsert_home to authenticated;

-- PostgREST "computed fields": a function named after the table, taking the
-- table's row type as its sole argument, is selectable as an ordinary
-- column (`?select=...,approx_lat,approx_lng`). This is how the fuzzed
-- point is exposed to clients as plain numbers without ever selecting the
-- geography column's raw WKB.
create or replace function public.approx_lat(public.homes)
returns double precision
language sql
stable
as $$
  select extensions.ST_Y($1.approx_coordinates::extensions.geometry);
$$;

create or replace function public.approx_lng(public.homes)
returns double precision
language sql
stable
as $$
  select extensions.ST_X($1.approx_coordinates::extensions.geometry);
$$;

grant execute on function public.approx_lat to authenticated, anon;
grant execute on function public.approx_lng to authenticated, anon;

-- T19: bounding-box + radius search used by /explore.
create or replace function public.homes_near(
  p_lat double precision,
  p_lng double precision,
  p_radius_meters integer default 50000,
  p_limit integer default 50,
  p_offset integer default 0
)
returns setof public.homes
language sql
stable
set search_path = public, extensions
as $$
  select *
  from public.homes
  where extensions.ST_DWithin(
    approx_coordinates,
    extensions.ST_SetSRID(extensions.ST_MakePoint(p_lng, p_lat), 4326)::extensions.geography,
    least(p_radius_meters, 200000) -- cap at 200km, guards against an unbounded scan
  )
  order by approx_coordinates <-> extensions.ST_SetSRID(extensions.ST_MakePoint(p_lng, p_lat), 4326)::extensions.geography
  limit least(p_limit, 100)
  offset greatest(p_offset, 0);
$$;

revoke all on function public.homes_near from public;
grant execute on function public.homes_near to authenticated, anon;

alter table public.homes enable row level security;

grant select on public.homes to authenticated, anon;
grant delete on public.homes to authenticated;
-- No direct insert/update grant: upsert_home() is the only write path
-- (security invoker, so RLS below still applies to it).

create policy "Homes are viewable by everyone."
  on public.homes for select
  using (true);

create policy "Hosts can insert their own home via upsert_home."
  on public.homes for insert
  with check (auth.uid() = host_id);

create policy "Hosts can update their own home via upsert_home."
  on public.homes for update
  using (auth.uid() = host_id)
  with check (auth.uid() = host_id);

create policy "Hosts can delete their own home."
  on public.homes for delete
  using (auth.uid() = host_id);
