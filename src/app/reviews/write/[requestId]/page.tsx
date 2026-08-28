import { notFound } from "next/navigation";
import { requireSession } from "@/lib/session";
import { getRequestsForUser } from "@/lib/data/requests";
import { getUserById } from "@/lib/data/profiles";
import { MobileHeader } from "@/components/MobileHeader";
import ReviewForm from "./ReviewForm";
import styles from "./review.module.css";

export default async function WriteReviewPage({ params }: { params: Promise<{ requestId: string }> }) {
  const { requestId } = await params;
  const session = await requireSession();

  const requests = await getRequestsForUser(session.authUserId);
  const request = requests.find((r) => r.id === requestId);

  if (!request) notFound();
  if (request.status !== "completed") {
    return (
      <div style={{ textAlign: "center", padding: "120px 24px" }}>
        <MobileHeader title="Write a Review" backHref="/dashboard" />
        <h2>This stay isn&apos;t completed yet</h2>
        <p className="text-secondary text-sm" style={{ marginTop: 8 }}>
          You can write a review once the stay has ended.
        </p>
      </div>
    );
  }

  const targetId = request.hostId === session.authUserId ? request.travelerId : request.hostId;
  const targetUser = await getUserById(targetId);
  if (!targetUser) notFound();

  return (
    <>
      <MobileHeader title="Write a Review" backHref="/dashboard" />
      <div className={styles.page}>
        <ReviewForm requestId={requestId} targetId={targetId} targetFirstName={targetUser.firstName} targetName={`${targetUser.firstName} ${targetUser.lastName}`} />
      </div>
    </>
  );
}
