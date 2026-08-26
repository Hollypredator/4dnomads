import Link from "next/link";
import { getForumTopics } from "@/lib/data/forum";
import CommunityTopics from "../CommunityTopics";

// The community hub links here as /community/forum?city=X -- this route
// didn't exist in the mock app (only /community/forum/[id] did), so that
// link was a dead 404. Filled in rather than left broken.
export default async function ForumByCityPage({ searchParams }: { searchParams: Promise<{ city?: string }> }) {
  const { city } = await searchParams;
  const topics = await getForumTopics(city);

  return (
    <div className="page-padding">
      <div className="container container-md">
        <Link href="/community" className="btn btn-ghost btn-sm" style={{ marginBottom: 24 }}>
          ← Back to Community
        </Link>
        <h1 style={{ fontFamily: "var(--font-serif)", fontSize: "2rem", marginBottom: 24 }}>
          {city ? `Discussions in ${city}` : "All Discussions"}
        </h1>
        <CommunityTopics initialTopics={topics} />
      </div>
    </div>
  );
}
