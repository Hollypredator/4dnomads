import Link from "next/link";
import { notFound } from "next/navigation";
import { getTopicById, getTopicComments } from "@/lib/data/forum";
import TopicClient from "./TopicClient";

export default async function ForumTopicPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const topic = await getTopicById(id);
  if (!topic) notFound();

  const comments = await getTopicComments(id);

  return (
    <div className="page-padding">
      <div className="container container-md">
        <Link href="/community" className="btn btn-ghost btn-sm" style={{ marginBottom: 24 }}>
          ← Back to Community
        </Link>
        <TopicClient topic={topic} initialComments={comments} />
      </div>
    </div>
  );
}
