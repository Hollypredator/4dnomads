import { requireSession } from "@/lib/session";
import { getRequestsForUser } from "@/lib/data/requests";
import DashboardClient from "./DashboardClient";
import styles from "./dashboard.module.css";

export default async function DashboardPage() {
  // Decision 2: identity comes from the server session, never from a
  // client-imported CURRENT_USER constant (the bug this page originally
  // had -- see Section 1 in docs/cutover-plan.md).
  const session = await requireSession();
  const allRequests = await getRequestsForUser(session.authUserId);

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <header className={styles.header}>
          <h1 className={styles.title}>Dashboard</h1>
          <p className="text-secondary text-sm">Manage your stay requests, invitations, and active travel plans.</p>
        </header>

        <DashboardClient requests={allRequests} currentUserId={session.authUserId} />
      </div>
    </div>
  );
}
