import type { Metadata } from "next";
import Link from "next/link";
import { getForumTopics } from "@/lib/data/forum";
import { MobileHeader } from "@/components/MobileHeader";
import CommunityTopics from "../CommunityTopics";

export async function generateMetadata({ searchParams }: { searchParams: Promise<{ city?: string }> }): Promise<Metadata> {
  const { city } = await searchParams;
  return {
    title: city ? `Discussions in ${city}` : "All Discussions",
    description: city
      ? `Local advice and discussions from nomads and hosts in ${city}.`
      : "Every city discussion on 4dnomads, all in one feed.",
  };
}

// The community hub links here as /community/forum?city=X -- this route
// didn't exist in the mock app (only /community/forum/[id] did), so that
// link was a dead 404. Filled in rather than left broken.
export default async function ForumByCityPage({ searchParams }: { searchParams: Promise<{ city?: string }> }) {
  const { city } = await searchParams;
  const topics = await getForumTopics(city);

  return (
    <>
      {/* Outside .page-padding so the sticky header sits flush against the
          top of the viewport instead of 40px down it. */}
      <MobileHeader title={city ?? "All Discussions"} backHref="/community" />
      <div className="page-padding">
      <div className="container container-md">
        <Link href="/community" className="btn btn-ghost btn-sm desktop-only" style={{ marginBottom: 24 }}>
          ← Back to Community
        </Link>
        <h1 className="desktop-only" style={{ fontFamily: "var(--font-serif)", fontSize: "2rem", marginBottom: 24 }}>
          {city ? `Discussions in ${city}` : "All Discussions"}
        </h1>
        <CommunityTopics initialTopics={topics} city={city} />
      </div>
      </div>
    </>
  );
}
