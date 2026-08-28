-- ──────────────────────────────────────────────
-- Self-reported internet speed on a home
-- ──────────────────────────────────────────────
--
-- For a platform aimed at people who work while they travel, connection
-- quality is the single most decision-relevant fact about a place, and the
-- amenities text[] cannot express it in a way that is filterable or sortable.
--
-- Deliberately nullable: a host who does not know their speed must be able to
-- leave it blank. Defaulting to 0 would render as "0 Mbps" and read as a
-- terrible connection rather than as no answer.
--
-- Self-reported and labelled as such in the UI -- this is not measured, and
-- presenting it as verified would make it a trust signal it has not earned.

alter table public.homes
  add column wifi_mbps integer
    check (wifi_mbps is null or wifi_mbps between 1 and 10000);

comment on column public.homes.wifi_mbps is
  'Self-reported download speed in Mbps. NULL means the host did not say. Not verified.';

-- NOTE: no `grant update (wifi_mbps)` here on purpose. homes has no direct
-- insert/update grant at all -- upsert_home() is the only write path
-- (20260826000002_homes.sql:185). Adding a column grant would open a second,
-- unguarded one. The new field goes through the same function instead.
--
-- The parameter is added LAST and defaulted so existing callers that pass 14
-- positional arguments keep working.
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
  p_blockout_dates date[],
  p_wifi_mbps integer default null
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
    gender_preference, kid_friendly, wheelchair_accessible, blockout_dates,
    wifi_mbps
  ) values (
    auth.uid(), p_sleeping_arrangement, p_max_guests, p_house_rules, p_location_name,
    public.fuzz_point(p_lat, p_lng), p_smoking_policy, p_pets_info, p_amenities,
    p_hosting_status, p_gender_preference, p_kid_friendly, p_wheelchair_accessible,
    p_blockout_dates, p_wifi_mbps
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
    blockout_dates = excluded.blockout_dates,
    wifi_mbps = excluded.wifi_mbps
  returning * into result;

  return result;
end;
$$;

revoke all on function public.upsert_home(
  text, integer, text, text, double precision, double precision,
  public.smoking_policy, text, text[], public.hosting_status,
  public.gender_preference, boolean, boolean, date[], integer
) from public;
grant execute on function public.upsert_home(
  text, integer, text, text, double precision, double precision,
  public.smoking_policy, text, text[], public.hosting_status,
  public.gender_preference, boolean, boolean, date[], integer
) to authenticated;
