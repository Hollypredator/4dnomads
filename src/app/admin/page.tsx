import { requireModerator } from "@/lib/session";
import { MobileHeader } from "@/components/MobileHeader";
import { getPlatformStats, getReportsWithUsers } from "@/lib/data/moderation";
import { getAllUsersForAdmin, getAllHomesForAdmin, getAllStayRequestsForAdmin, getAllReviewsForAdmin } from "@/lib/data/admin";
import AdminClient from "./AdminClient";
import styles from "./admin.module.css";

export default async function AdminPage() {
  // T6 / decision 1: role comes from the JWT app_metadata claim, checked
  // server-side. redirect()s away before any data below is even fetched.
  await requireModerator();

  const [stats, reports, users, homes, requests, reviews] = await Promise.all([
    getPlatformStats(),
    getReportsWithUsers(),
    getAllUsersForAdmin(),
    getAllHomesForAdmin(),
    getAllStayRequestsForAdmin(),
    getAllReviewsForAdmin(),
  ]);

  return (
    <>
      <MobileHeader title="Admin" backHref="/dashboard" />
    <div className={styles.page}>
      <div className={styles.container}>
        <AdminClient stats={stats} initialReports={reports} users={users} homes={homes} requests={requests} reviews={reviews} />
      </div>
    </div>
    </>
  );
}
