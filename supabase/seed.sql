-- Local development seed data. Extracted from the original src/lib/mock-data.ts
-- and src/lib/community-store.ts fixtures BEFORE those files were deleted
-- (T15, docs/cutover-plan.md) so the same illustrative dataset survives the
-- cutover. Runs as the postgres/service role, which bypasses RLS -- this is
-- the standard way to seed data that would otherwise require a real login.
--
-- All seeded users share the password "password123" for local testing only.

insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at
) values
  ('00000000-0000-0000-0000-000000000000', '11111111-1111-1111-1111-111111111111', 'authenticated', 'authenticated', 'jane@example.com', crypt('password123', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"first_name":"Jane","last_name":"Doe"}', '2024-03-15T10:00:00Z', now()),
  ('00000000-0000-0000-0000-000000000000', '22222222-2222-2222-2222-222222222222', 'authenticated', 'authenticated', 'alex@example.com', crypt('password123', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"first_name":"Alex","last_name":"Smith"}', '2023-11-20T10:00:00Z', now()),
  ('00000000-0000-0000-0000-000000000000', '33333333-3333-3333-3333-333333333333', 'authenticated', 'authenticated', 'maria@example.com', crypt('password123', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"first_name":"Maria","last_name":"Garcia"}', '2025-01-10T10:00:00Z', now()),
  ('00000000-0000-0000-0000-000000000000', '44444444-4444-4444-4444-444444444444', 'authenticated', 'authenticated', 'marco@example.com', crypt('password123', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"first_name":"Marco","last_name":"Rossi"}', '2024-06-01T10:00:00Z', now()),
  ('00000000-0000-0000-0000-000000000000', '55555555-5555-5555-5555-555555555555', 'authenticated', 'authenticated', 'sarah@example.com', crypt('password123', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"first_name":"Sarah","last_name":"Lee"}', '2024-09-12T10:00:00Z', now()),
  -- u6 (Yuki) is seeded as a moderator, so /admin has a reachable account locally.
  ('00000000-0000-0000-0000-000000000000', '66666666-6666-6666-6666-666666666666', 'authenticated', 'authenticated', 'yuki@example.com', crypt('password123', gen_salt('bf')), now(), '{"provider":"email","providers":["email"],"role":"moderator"}', '{"first_name":"Yuki","last_name":"Tanaka"}', '2024-02-28T10:00:00Z', now());

-- handle_new_user() (20260826000001_profiles.sql) already created a bare
-- profiles row per user above via the AFTER INSERT trigger on auth.users.
-- Update those rows with the richer mock-data.ts fixture content.
update public.profiles set bio = 'Software engineer and avid traveler. I love meeting people from all over the world and showing them the hidden gems of Istanbul. I''ve backpacked across Europe and South America, and I know how amazing it is to have a local friend in a new city.', languages = '{English,Turkish}', interests = '{Coding,"Street Food",History,Photography}', is_verified = true where id = '11111111-1111-1111-1111-111111111111';
update public.profiles set bio = 'Musician living in Kreuzberg. My couch is always open to creative souls! I play guitar and produce electronic music.', languages = '{English,German}', interests = '{Music,Nightlife,"Vinyl Records",Cooking}', is_verified = true where id = '22222222-2222-2222-2222-222222222222';
update public.profiles set bio = 'I live right next to the beach in Barceloneta. Happy to host travelers who want to explore Catalonia.', languages = '{Spanish,English,Catalan}', interests = '{Art,Beach,Hiking,"Wine Tasting"}', is_verified = false where id = '33333333-3333-3333-3333-333333333333';
update public.profiles set bio = 'Italian architect exploring the world one city at a time. Currently based in Lisbon but always on the move.', languages = '{Italian,English,Portuguese}', interests = '{Architecture,Coffee,Running,Film}', is_verified = true where id = '44444444-4444-4444-4444-444444444444';
update public.profiles set bio = 'Canadian teacher living in Chiang Mai. I teach English during the week and explore temples on weekends.', languages = '{English,French,Thai}', interests = '{Teaching,Yoga,Temples,"Cooking Classes"}', is_verified = true where id = '55555555-5555-5555-5555-555555555555';
update public.profiles set bio = 'Tokyo local working in tech. I love showing visitors the "real" Tokyo that tourists miss.', languages = '{Japanese,English}', interests = '{Ramen,Tech,Gaming,Anime}', is_verified = true where id = '66666666-6666-6666-6666-666666666666';

-- Homes -- fuzzed via fuzz_point() same as the production write path
-- (upsert_home), even though seed data has no real privacy stakes. Keeps
-- one code path for "how a home's location gets stored."
insert into public.homes (id, host_id, sleeping_arrangement, max_guests, house_rules, location_name, approx_coordinates, smoking_policy, pets_info, amenities, hosting_status, gender_preference, kid_friendly, wheelchair_accessible, blockout_dates) values
  ('aaaaaaa1-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', 'Private Room', 2, 'Please remove shoes at the door. Quiet hours after 11 PM.', 'Kadikoy, Istanbul', public.fuzz_point(40.9812, 29.0295), 'Outside only', 'Cat in house (Pamuk)', '{"Wi-Fi","Kitchen Access",Washer,Balcony}', 'accepting', 'Any', true, false, '{2026-09-15,2026-09-16}'),
  ('aaaaaaa2-0000-0000-0000-000000000002', '22222222-2222-2222-2222-222222222222', 'Shared Couch', 1, 'Be respectful of neighbors. Feel free to use the music equipment!', 'Kreuzberg, Berlin', public.fuzz_point(52.4934, 13.4025), 'Allowed', 'No pets', '{"Wi-Fi","Music Studio","Kitchen Access"}', 'maybe', 'Any', false, false, '{}'),
  ('aaaaaaa3-0000-0000-0000-000000000003', '33333333-3333-3333-3333-333333333333', 'Private Room', 2, 'Keep the common areas clean. Beach towels provided!', 'Barceloneta, Barcelona', public.fuzz_point(41.3809, 2.1890), 'Not allowed', 'No pets', '{"Wi-Fi","Beach Gear","Kitchen Access",Rooftop}', 'accepting', 'Females only', false, true, '{}'),
  ('aaaaaaa5-0000-0000-0000-000000000005', '55555555-5555-5555-5555-555555555555', 'Private Room', 1, 'Take off shoes inside. I can lend you a scooter!', 'Old City, Chiang Mai', public.fuzz_point(18.7883, 98.9853), 'Not allowed', 'Dog (Mango)', '{"Wi-Fi",Scooter,Rooftop,"Kitchen Access"}', 'accepting', 'Any', true, false, '{}'),
  ('aaaaaaa6-0000-0000-0000-000000000006', '66666666-6666-6666-6666-666666666666', 'Futon', 1, 'Small apartment -- please be mindful of space. I''ll give you a transit card!', 'Shimokitazawa, Tokyo', public.fuzz_point(35.6614, 139.6681), 'Not allowed', 'No pets', '{"Wi-Fi","Transit Card","Kitchen Access"}', 'wants_to_meet', 'Any', false, false, '{}');

-- Stay requests. sr-completed is deliberately 'completed' (not 'accepted')
-- so the reviews below satisfy reviews_check_eligibility -- that trigger
-- didn't exist in the mock version, so this fixture had to change shape.
insert into public.stay_requests (id, traveler_id, host_id, home_id, arrival_date, departure_date, number_of_guests, status, initial_message, created_at) values
  ('bbbbbbb1-0000-0000-0000-000000000001', '44444444-4444-4444-4444-444444444444', '11111111-1111-1111-1111-111111111111', 'aaaaaaa1-0000-0000-0000-000000000001', '2026-09-01', '2026-09-04', 1, 'pending', 'Hi Jane! I''m coming to Istanbul for a conference and would love to experience the local side of the city.', '2026-08-25T14:00:00Z'),
  ('bbbbbbb2-0000-0000-0000-000000000002', '55555555-5555-5555-5555-555555555555', '11111111-1111-1111-1111-111111111111', 'aaaaaaa1-0000-0000-0000-000000000001', '2026-09-10', '2026-09-15', 1, 'accepted', 'Hey Jane! I''m Sarah from Canada, currently based in Chiang Mai. I''ll be in Istanbul for a week.', '2026-08-20T09:00:00Z'),
  ('bbbbbbb3-0000-0000-0000-000000000003', '33333333-3333-3333-3333-333333333333', '22222222-2222-2222-2222-222222222222', 'aaaaaaa2-0000-0000-0000-000000000002', '2026-09-05', '2026-09-08', 2, 'declined', 'Hi Alex! My friend and I are coming to Berlin for a music festival. We''d love to crash at your place.', '2026-08-18T11:00:00Z'),
  ('bbbbbbb4-0000-0000-0000-000000000004', '44444444-4444-4444-4444-444444444444', '11111111-1111-1111-1111-111111111111', 'aaaaaaa1-0000-0000-0000-000000000001', '2026-07-01', '2026-07-05', 1, 'completed', 'Loved staying with you last month!', '2026-06-20T09:00:00Z');

-- Messages
insert into public.messages (stay_request_id, sender_id, content, created_at, is_read) values
  ('bbbbbbb1-0000-0000-0000-000000000001', '44444444-4444-4444-4444-444444444444', 'Hi Jane! I saw your profile and loved your travel stories. I''m coming to Istanbul next week!', '2026-08-25T14:00:00Z', true),
  ('bbbbbbb1-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', 'Hey Marco! Thanks for reaching out. Yes, the room is available that week.', '2026-08-25T15:30:00Z', true),
  ('bbbbbbb1-0000-0000-0000-000000000001', '44444444-4444-4444-4444-444444444444', 'Sounds great! I will be arriving around 2 PM.', '2026-08-25T16:00:00Z', false),
  ('bbbbbbb2-0000-0000-0000-000000000002', '55555555-5555-5555-5555-555555555555', 'Thank you for accepting my request! I''m so excited to visit Istanbul.', '2026-08-21T10:00:00Z', true),
  ('bbbbbbb2-0000-0000-0000-000000000002', '11111111-1111-1111-1111-111111111111', 'Just yourself and a good appetite! I''ll take you to the best simit and cay spots in Kadikoy.', '2026-08-21T12:00:00Z', true);

-- Reviews -- only on the 'completed' request, matching reviews_check_eligibility.
-- Demonstrates the derived-visibility design from decision 7: r1 has no
-- counterpart yet and is less than 14 days old, so it stays hidden from
-- everyone except its own author and moderators until Marco reviews back
-- or 14 days pass.
insert into public.reviews (author_id, target_id, stay_request_id, rating, text, created_at) values
  ('44444444-4444-4444-4444-444444444444', '11111111-1111-1111-1111-111111111111', 'bbbbbbb4-0000-0000-0000-000000000004', 5, 'Jane was an incredible host! She showed me around Kadikoy and we had the best street food.', now() - interval '2 days');

-- Public trips
insert into public.public_trips (traveler_id, destination, arrival_date, departure_date, number_of_guests, description, created_at) values
  ('44444444-4444-4444-4444-444444444444', 'Istanbul, Turkey', '2026-09-05', '2026-09-12', 1, 'Architect from Italy planning to explore the historic architecture of Istanbul. Happy to bring Italian coffee!', '2026-08-24T10:00:00Z'),
  ('33333333-3333-3333-3333-333333333333', 'Berlin, Germany', '2026-09-20', '2026-09-25', 2, 'Graphic designer traveling with a friend. We love museums, street art, and house music.', '2026-08-25T08:30:00Z');

-- Local events + RSVPs (join table, not an array -- see T16)
insert into public.local_events (id, creator_id, title, description, location_name, event_date, event_time, max_participants, created_at) values
  ('ccccccc1-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', 'Kadikoy Street Food Gathering', 'Let''s meet up at Bull Statue and eat our way through Kadikoy!', 'Bull Statue, Kadikoy, Istanbul', '2026-09-02', '19:00', 15, '2026-08-23T12:00:00Z'),
  ('ccccccc2-0000-0000-0000-000000000002', '22222222-2222-2222-2222-222222222222', 'Berlin Jam Session & Beers', 'Bring your instrument or just your ears. Chill jam session at Tempelhofer Feld.', 'Tempelhofer Feld, Berlin', '2026-09-08', '16:00', 30, '2026-08-24T15:00:00Z');

insert into public.local_event_rsvps (event_id, user_id) values
  ('ccccccc1-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111'),
  ('ccccccc1-0000-0000-0000-000000000001', '44444444-4444-4444-4444-444444444444'),
  ('ccccccc1-0000-0000-0000-000000000001', '55555555-5555-5555-5555-555555555555'),
  ('ccccccc2-0000-0000-0000-000000000002', '22222222-2222-2222-2222-222222222222'),
  ('ccccccc2-0000-0000-0000-000000000002', '33333333-3333-3333-3333-333333333333'),
  ('ccccccc2-0000-0000-0000-000000000002', '44444444-4444-4444-4444-444444444444');

-- Forum topics + comments + upvotes (upvotedBy join table, not an array)
insert into public.forum_topics (id, city, category, title, content, author_id, created_at) values
  ('ddddddd1-0000-0000-0000-000000000001', 'Istanbul', 'Hosting Q&A', 'Best neighborhoods for quiet remote working & co-living in Kadikoy?', 'Hey everyone! I''m arriving in Istanbul next week and staying with a host in Kadikoy. Any recommendations for cozy cafes with fast Wi-Fi?', '44444444-4444-4444-4444-444444444444', '2026-08-25T11:00:00Z'),
  ('ddddddd2-0000-0000-0000-000000000002', 'Berlin', 'Meetups & Coffee', 'Friday night Techno & Vinyl swap in Kreuzberg', 'Hosting a mini vinyl swap and chill drinks at Tempelhofer Feld before hitting local clubs. All nomads & locals welcome!', '22222222-2222-2222-2222-222222222222', '2026-08-24T18:30:00Z'),
  ('ddddddd3-0000-0000-0000-000000000003', 'Lisbon', 'Visa & Nomad Tips', 'Digital Nomad Visa Renewal 2026 -- Latest updates', 'Just finished my D8 visa extension process in Lisbon. Here''s a breakdown of required bank statements and appointment booking tips.', '44444444-4444-4444-4444-444444444444', '2026-08-22T09:15:00Z');

insert into public.forum_comments (topic_id, author_id, content, created_at) values
  ('ddddddd1-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', 'Check out Walter''s Coffee Roastery and Story Coffee in Moda! Great Wi-Fi and awesome simit nearby.', '2026-08-25T12:00:00Z');

insert into public.forum_upvotes (topic_id, user_id) values
  ('ddddddd1-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111'),
  ('ddddddd1-0000-0000-0000-000000000001', '22222222-2222-2222-2222-222222222222'),
  ('ddddddd1-0000-0000-0000-000000000001', '33333333-3333-3333-3333-333333333333'),
  ('ddddddd2-0000-0000-0000-000000000002', '11111111-1111-1111-1111-111111111111'),
  ('ddddddd2-0000-0000-0000-000000000002', '33333333-3333-3333-3333-333333333333'),
  ('ddddddd3-0000-0000-0000-000000000003', '11111111-1111-1111-1111-111111111111'),
  ('ddddddd3-0000-0000-0000-000000000003', '22222222-2222-2222-2222-222222222222');

-- Community vouches
insert into public.community_vouches (author_id, target_id, text, created_at) values
  ('44444444-4444-4444-4444-444444444444', '11111111-1111-1111-1111-111111111111', 'Jane is an exceptional host in Kadikoy! Very welcoming.', '2026-08-20T10:00:00Z'),
  ('11111111-1111-1111-1111-111111111111', '44444444-4444-4444-4444-444444444444', 'Marco was super polite and a clean guest.', '2026-08-21T10:00:00Z');

-- Emergency alerts
insert into public.emergency_alerts (author_id, location_name, description, contact_info, is_resolved) values
  ('33333333-3333-3333-3333-333333333333', 'Barcelona, El Prat Airport', 'Flight cancelled overnight, need a sofa for one night near the airport.', '+34 612 345 678', false);

-- User reports (visible to Yuki, the seeded moderator)
insert into public.user_reports (reporter_id, target_id, reason, status, created_at) values
  ('33333333-3333-3333-3333-333333333333', '22222222-2222-2222-2222-222222222222', 'Sent rude and aggressive messages after I declined to meet up.', 'pending', '2026-08-25T16:00:00Z');
