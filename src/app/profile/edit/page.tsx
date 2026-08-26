import Link from "next/link";
import { requireSession } from "@/lib/session";
import { getRequestsForUser } from "@/lib/data/requests";
import DeleteAccountButton from "./DeleteAccountButton";
import styles from "../../dashboard/dashboard.module.css";

export default async function EditProfileSelector() {
  const session = await requireSession();
  const allRequests = await getRequestsForUser(session.authUserId);
  // Only completed stays are review-eligible (the reviews_check_eligibility
  // trigger enforces this at write time; filtering here just avoids
  // offering a link that will fail).
  const reviewable = allRequests.filter((r) => r.travelerId === session.authUserId && r.status === "completed");

  return (
    <div className={styles.page}>
      <div className={styles.container} style={{ maxWidth: 640 }}>
        <header className={styles.header}>
          <h1>Profile Customizations</h1>
          <p className="text-secondary text-sm">Update your public traveler card and hosting criteria.</p>
        </header>

        <div className="flex flex-col gap-4">
          <div className="panel panel-padded flex items-center justify-between">
            <div>
              <h3 className="font-semibold">Hosting Rules & Calendar</h3>
              <p className="text-secondary text-sm">Blockout dates, set gender preferences, guest counts, and availability status.</p>
            </div>
            <Link href="/profile/edit/hosting" className="btn btn-primary">
              Manage Rules
            </Link>
          </div>

          <div className="panel panel-padded flex items-center justify-between">
            <div>
              <h3 className="font-semibold">Write Pending References</h3>
              <p className="text-secondary text-sm">Write reviews for completed stays. Visible once your host reviews you too, or after 14 days.</p>
            </div>
            <div className="flex flex-col gap-2" style={{ minWidth: 160 }}>
              {reviewable.length > 0 ? (
                reviewable.map((req) => (
                  <Link key={req.id} href={`/reviews/write/${req.id}`} className="btn btn-secondary btn-sm" style={{ textAlign: "center" }}>
                    Write for {req.host.firstName}
                  </Link>
                ))
              ) : (
                <p className="text-secondary text-sm">No completed stays yet.</p>
              )}
            </div>
          </div>

          <div className="panel panel-padded flex items-center justify-between">
            <div>
              <h3 className="font-semibold">Delete Account</h3>
              <p className="text-secondary text-sm">Removes your personal info. Past stays and messages remain for the other party&apos;s records.</p>
            </div>
            <DeleteAccountButton />
          </div>
        </div>
      </div>
    </div>
  );
}
