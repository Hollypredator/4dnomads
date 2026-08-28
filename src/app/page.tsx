import { getSession } from "@/lib/session";
import { getCityHostCounts } from "@/lib/data/homes";
import { getRequestsForUser } from "@/lib/data/requests";
import { getAllHosts } from "@/lib/data/profiles";
import { getRecentVouches } from "@/lib/data/forum";
import HomeMarketing from "./HomeMarketing";
import HomeApp from "./HomeApp";

// Branches on session so a signed-in visitor lands in the app (quick
// actions, nearby hosts) instead of a pitch they already converted on --
// see the design conversation, 2026-08-27.
export default async function Home() {
  const session = await getSession();

  if (!session) {
    const cityCounts = await getCityHostCounts();
    return <HomeMarketing cityCounts={cityCounts} />;
  }

  const [requests, nearbyHosts, vouches] = await Promise.all([
    getRequestsForUser(session.authUserId),
    getAllHosts({ limit: 6 }),
    getRecentVouches(1),
  ]);

  const pendingCount = requests.filter((r) => r.hostId === session.authUserId && r.status === "pending").length;

  return (
    <HomeApp
      firstName={session.profile.firstName}
      pendingCount={pendingCount}
      nearbyHosts={nearbyHosts}
      recentVouch={vouches[0] ?? null}
    />
  );
}
