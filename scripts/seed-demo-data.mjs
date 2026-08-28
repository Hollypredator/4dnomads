/**
 * Seeds realistic demo content into the LIVE production database so the app
 * has something to look at before real users arrive: hosts with homes,
 * cross-vouches, forum topics, a couple of hangouts, a public trip.
 *
 * Writes go through the same RLS-respecting paths a real user would use --
 * auth.signUp() per persona, then that persona's own session for every
 * insert (upsert_home RPC, direct table inserts covered by "insert own
 * row" policies). No service-role key, no RLS bypass. Every demo account is
 * therefore a completely normal account and shows up, disappears, and
 * behaves exactly like one -- see scripts/clear-demo-data.mjs to remove them
 * via the app's own delete_own_account() RPC before real users arrive.
 *
 * Run: node scripts/seed-demo-data.mjs
 */
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");

function loadEnv() {
  const text = readFileSync(join(ROOT, ".env.local"), "utf8");
  for (const line of text.split("\n")) {
    const m = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/);
    if (m) process.env[m[1]] ??= m[2].trim();
  }
}
loadEnv();

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
if (!URL || !ANON_KEY) throw new Error("Missing Supabase env vars in .env.local");

// A password only this script ever needs to know.
const PASSWORD = "Demo-Seed-4dnomads-2026!";
// Every demo account's email lives under this fake TLD -- easy to recognize
// in the Supabase dashboard, and clear-demo-data.mjs uses the exact same
// list rather than pattern-matching, but the marker still matters for anyone
// reading the users table by hand later.
const EMAIL_DOMAIN = "seed.4dnomads.internal";

export const PERSONAS = [
  {
    key: "elena",
    firstName: "Elena",
    lastName: "Rossi",
    bio: "Product designer working from wherever the wifi is fast enough. Based in Lisbon most of the year -- always up for showing people the good pastelaria near Alfama.",
    languages: ["Italian", "English", "Portuguese"],
    interests: ["Coding", "Coffee", "Photography"],
    home: {
      sleepingArrangement: "Private Room",
      maxGuests: 2,
      houseRules: "Quiet after 11pm, shoes off inside, happy to share the kitchen.",
      locationName: "Alfama, Lisbon",
      latitude: 38.7139,
      longitude: -9.1334,
      smokingPolicy: "Not allowed",
      petsInfo: "One friendly cat",
      amenities: ["Fast WiFi", "Desk", "Washing Machine", "Kitchen Access"],
      hostingStatus: "accepting",
      genderPreference: "Any",
      kidFriendly: false,
      wheelchairAccessible: false,
      wifiMbps: 250,
    },
  },
  {
    key: "david",
    firstName: "David",
    lastName: "Mwangi",
    bio: "Backend engineer, three years on the road. I keep a proper standing desk wherever I land -- happy to lend it out along with the spare room.",
    languages: ["English", "Swahili"],
    interests: ["Cycling", "Cooking", "Live music"],
    home: {
      sleepingArrangement: "Sofa Bed",
      maxGuests: 1,
      houseRules: "No smoking, guests welcome to use the balcony desk.",
      locationName: "El Poblado, Medellin",
      latitude: 6.2087,
      longitude: -75.5658,
      smokingPolicy: "Outside only",
      petsInfo: "None",
      amenities: ["Fast WiFi", "Standing Desk", "Balcony"],
      hostingStatus: "accepting",
      genderPreference: "Any",
      kidFriendly: false,
      wheelchairAccessible: false,
      wifiMbps: 500,
    },
  },
  {
    key: "sam",
    firstName: "Sam",
    lastName: "Tan",
    bio: "Freelance illustrator. Slow travel, long stays, always cooking too much rice. My place in Canggu has a proper hammock for thinking.",
    languages: ["English", "Mandarin"],
    interests: ["Surfing", "Yoga", "Cooking"],
    home: {
      sleepingArrangement: "Private Room",
      maxGuests: 2,
      houseRules: "Bring your own towel, we compost.",
      locationName: "Canggu, Bali",
      latitude: -8.6478,
      longitude: 115.1385,
      smokingPolicy: "Outside only",
      petsInfo: "Two dogs, both harmless",
      amenities: ["Hammock", "Shared Kitchen", "Bicycle"],
      hostingStatus: "accepting",
      genderPreference: "Any",
      kidFriendly: true,
      wheelchairAccessible: false,
      wifiMbps: 120,
    },
  },
  {
    key: "mira",
    firstName: "Mira",
    lastName: "Kaya",
    bio: "UX researcher, Istanbul born and mostly based. I host a lot of first-timers to the city and love giving the full Kadikoy ferry-and-tea tour.",
    languages: ["Turkish", "English", "German"],
    interests: ["Hiking", "Live music", "Languages"],
    home: {
      sleepingArrangement: "Private Room",
      maxGuests: 1,
      houseRules: "No parties, guests get their own key.",
      locationName: "Kadikoy, Istanbul",
      latitude: 40.9833,
      longitude: 29.0333,
      smokingPolicy: "Not allowed",
      petsInfo: "None",
      amenities: ["Fast WiFi", "Desk", "Ferry-view Balcony"],
      hostingStatus: "accepting",
      genderPreference: "Any",
      kidFriendly: false,
      wheelchairAccessible: false,
      wifiMbps: 300,
    },
  },
  {
    key: "marcus",
    firstName: "Marcus",
    lastName: "Weber",
    bio: "Ex-consultant turned indie founder. Berlin flat has a proper co-working corner and I'm always down for a Sunday flea market run.",
    languages: ["German", "English"],
    interests: ["Coding", "Cycling", "Coffee"],
    home: {
      sleepingArrangement: "Private Room",
      maxGuests: 2,
      houseRules: "Recycling matters here, otherwise easygoing.",
      locationName: "Neukolln, Berlin",
      latitude: 52.4801,
      longitude: 13.4353,
      smokingPolicy: "Not allowed",
      petsInfo: "None",
      amenities: ["Fast WiFi", "Co-working Desk", "Coffee Machine"],
      hostingStatus: "accepting",
      genderPreference: "Any",
      kidFriendly: false,
      wheelchairAccessible: false,
      wifiMbps: 400,
    },
  },
  {
    key: "priya",
    firstName: "Priya",
    lastName: "Nair",
    bio: "Writer and occasional yoga teacher. Chiang Mai is home base between trips -- quiet street, good markets, plenty of space to think.",
    languages: ["English", "Hindi", "Thai (basic)"],
    interests: ["Yoga", "Photography", "Cooking"],
    home: {
      sleepingArrangement: "Entire Guesthouse",
      maxGuests: 3,
      houseRules: "Shoes off, quiet mornings for meditation.",
      locationName: "Old City, Chiang Mai",
      latitude: 18.7883,
      longitude: 98.9853,
      smokingPolicy: "Not allowed",
      petsInfo: "None",
      amenities: ["Fast WiFi", "Garden", "Kitchen Access"],
      hostingStatus: "accepting",
      genderPreference: "Any",
      kidFriendly: true,
      wheelchairAccessible: true,
      wifiMbps: 180,
    },
  },
];

const VOUCHES = [
  { from: "david", to: "elena", text: "Stayed with Elena for two weeks in Lisbon. Fast wifi, and she introduced me to the best local bakeries. True nomad hospitality." },
  { from: "marcus", to: "mira", text: "Mira's place in Kadikoy was the perfect base for exploring Istanbul. She even walked me through the ferry routes on day one." },
  { from: "elena", to: "david", text: "David's setup in Medellin is dialled in for anyone who actually needs to work -- proper desk, quiet hours respected." },
  { from: "priya", to: "sam", text: "Sam's hammock is not a joke, I got more thinking done in Canggu than in three months at home." },
];

const FORUM_TOPICS = [
  {
    author: "mira",
    city: "Istanbul",
    category: "Hosting Q&A",
    title: "Best neighborhoods for a first-time host in Istanbul?",
    content: "Thinking about opening my place up more regularly. Kadikoy has worked well for me -- curious what other hosts on the Anatolian side are seeing in terms of interest.",
  },
  {
    author: "marcus",
    city: "Berlin",
    category: "Meetups & Coffee",
    title: "Sunday flea market + coffee, Neukolln",
    content: "Running my usual Sunday loop through Maybachufer market if anyone passing through Berlin wants to join. Good coffee stop halfway.",
  },
];

const EVENTS = [
  {
    creator: "elena",
    title: "Sunset coding session, Alfama viewpoint",
    description: "Bring a laptop or don't -- mostly just an excuse to work somewhere with a view and grab a coffee after.",
    locationName: "Miradouro das Portas do Sol, Lisbon",
    daysFromNow: 5,
    time: "18:00",
    maxParticipants: 12,
  },
  {
    creator: "priya",
    title: "Morning market walk + smoothie stop",
    description: "Slow walk through the Old City market, ending at the smoothie place everyone asks about.",
    locationName: "Chiang Mai Old City",
    daysFromNow: 3,
    time: "08:30",
    maxParticipants: 8,
  },
];

const RSVPS = [
  { event: 0, guest: "david" },
  { event: 0, guest: "mira" },
  { event: 1, guest: "sam" },
];

const PUBLIC_TRIPS = [
  {
    traveler: "marcus",
    destination: "Lisbon, Portugal",
    arrivalDate: daysFromNowISO(20),
    departureDate: daysFromNowISO(34),
    numberOfGuests: 1,
    description: "Two weeks of remote work, would love recommendations for a quiet co-working-friendly host.",
  },
];

function daysFromNowISO(n) {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
}

/** A fresh anon-key client per persona so sessions never leak between them. */
function client() {
  return createClient(URL, ANON_KEY, { auth: { persistSession: false, autoRefreshToken: false } });
}

async function signUpOrIn(persona) {
  const email = `${persona.key}@${EMAIL_DOMAIN}`;
  const sb = client();

  const up = await sb.auth.signUp({
    email,
    password: PASSWORD,
    options: { data: { first_name: persona.firstName, last_name: persona.lastName } },
  });

  if (up.error && !/already registered/i.test(up.error.message)) {
    throw new Error(`signUp(${persona.key}) failed: ${up.error.message}`);
  }

  if (!up.data.session) {
    const inRes = await sb.auth.signInWithPassword({ email, password: PASSWORD });
    if (inRes.error) throw new Error(`signIn(${persona.key}) failed: ${inRes.error.message}`);
  }

  const { data: userData } = await sb.auth.getUser();
  return { sb, userId: userData.user.id, email };
}

async function main() {
  console.log(`Seeding ${PERSONAS.length} demo personas against ${URL}\n`);

  const byKey = {};

  for (const persona of PERSONAS) {
    process.stdout.write(`  ${persona.firstName} ${persona.lastName} ... `);
    const { sb, userId } = await signUpOrIn(persona);
    byKey[persona.key] = { sb, userId, persona };

    const { error: profileErr } = await sb
      .from("profiles")
      .update({ bio: persona.bio, languages: persona.languages, interests: persona.interests, onboarding_completed_at: new Date().toISOString() })
      .eq("id", userId);
    if (profileErr) throw new Error(`profile update (${persona.key}): ${profileErr.message}`);

    const h = persona.home;
    const { error: homeErr } = await sb.rpc("upsert_home", {
      p_sleeping_arrangement: h.sleepingArrangement,
      p_max_guests: h.maxGuests,
      p_house_rules: h.houseRules,
      p_location_name: h.locationName,
      p_lat: h.latitude,
      p_lng: h.longitude,
      p_smoking_policy: h.smokingPolicy,
      p_pets_info: h.petsInfo,
      p_amenities: h.amenities,
      p_hosting_status: h.hostingStatus,
      p_gender_preference: h.genderPreference,
      p_kid_friendly: h.kidFriendly,
      p_wheelchair_accessible: h.wheelchairAccessible,
      p_blockout_dates: [],
      p_wifi_mbps: h.wifiMbps,
    });
    if (homeErr) throw new Error(`upsert_home (${persona.key}): ${homeErr.message}`);

    console.log("profile + home done");
  }

  console.log("\nVouches:");
  for (const v of VOUCHES) {
    const { sb, userId: authorId } = byKey[v.from];
    const targetId = byKey[v.to].userId;
    const { error } = await sb.from("community_vouches").insert({ author_id: authorId, target_id: targetId, text: v.text });
    if (error && error.code !== "23505") throw new Error(`vouch ${v.from}->${v.to}: ${error.message}`);
    console.log(`  ${v.from} -> ${v.to}${error ? " (already existed)" : ""}`);
  }

  console.log("\nForum topics:");
  for (const t of FORUM_TOPICS) {
    const { sb } = byKey[t.author];
    const { error } = await sb.from("forum_topics").insert({
      author_id: byKey[t.author].userId,
      city: t.city,
      category: t.category,
      title: t.title,
      content: t.content,
    });
    if (error) throw new Error(`forum topic "${t.title}": ${error.message}`);
    console.log(`  "${t.title}" by ${t.author}`);
  }

  console.log("\nEvents:");
  const eventIds = [];
  for (const e of EVENTS) {
    const { sb, userId } = byKey[e.creator];
    const { data, error } = await sb
      .from("local_events")
      .insert({
        creator_id: userId,
        title: e.title,
        description: e.description,
        location_name: e.locationName,
        event_date: daysFromNowISO(e.daysFromNow),
        event_time: e.time,
        max_participants: e.maxParticipants,
      })
      .select("id")
      .single();
    if (error) throw new Error(`event "${e.title}": ${error.message}`);
    eventIds.push(data.id);
    console.log(`  "${e.title}" by ${e.creator}`);
  }

  console.log("\nRSVPs:");
  for (const r of RSVPS) {
    const { sb, userId } = byKey[r.guest];
    const { error } = await sb.from("local_event_rsvps").insert({ event_id: eventIds[r.event], user_id: userId });
    if (error && error.code !== "23505") throw new Error(`rsvp ${r.guest}->event${r.event}: ${error.message}`);
    console.log(`  ${r.guest} -> "${EVENTS[r.event].title}"`);
  }

  console.log("\nPublic trips:");
  for (const t of PUBLIC_TRIPS) {
    const { sb, userId } = byKey[t.traveler];
    const { error } = await sb.from("public_trips").insert({
      traveler_id: userId,
      destination: t.destination,
      arrival_date: t.arrivalDate,
      departure_date: t.departureDate,
      number_of_guests: t.numberOfGuests,
      description: t.description,
    });
    if (error) throw new Error(`public trip (${t.traveler}): ${error.message}`);
    console.log(`  ${t.traveler} -> ${t.destination}`);
  }

  console.log("\nDone. Run `node scripts/clear-demo-data.mjs` before real users arrive.");
}

main().catch((err) => {
  console.error("\nSeed failed:", err.message);
  process.exit(1);
});
