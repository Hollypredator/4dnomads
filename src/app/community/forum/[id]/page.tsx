import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getTopicById, getTopicComments } from "@/lib/data/forum";
import { MobileHeader } from "@/components/MobileHeader";
import TopicClient from "./TopicClient";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const topic = await getTopicById(id);
  if (!topic) return { title: "Discussion not found" };
  return {
    title: topic.title,
    description: `${topic.category} in ${topic.city}: ${topic.content.slice(0, 130)}`,
  };
}

export default async function ForumTopicPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const topic = await getTopicById(id);
  if (!topic) notFound();

  const comments = await getTopicComments(id);

  return (
    <>
      <MobileHeader title={topic.title} backHref="/community" />
      <div className="page-padding">
        <div className="container container-md">
          {/* Desktop-only text link -- mobile has MobileHeader's back arrow instead. */}
          <Link href="/community" className="btn btn-ghost btn-sm desktop-only" style={{ marginBottom: 24 }}>
            ← Back to Community
          </Link>
          <TopicClient topic={topic} initialComments={comments} />
        </div>
      </div>
    </>
  );
}
