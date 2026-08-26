"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { resolveReportAction } from "@/lib/actions/moderation";
import type { User, Home, StayRequest, Review, UserReportWithUsers } from "@/types";
import styles from "./admin.module.css";

type Tab = "overview" | "users" | "requests" | "reviews" | "homes" | "reports";

interface Stats {
  totalUsers: number;
  verifiedUsers: number;
  totalHomes: number;
  totalRequests: number;
  pendingRequests: number;
  totalReviews: number;
  totalMessages: number;
  activeReports: number;
}

export default function AdminClient({
  stats,
  initialReports,
  users,
  homes,
  requests,
  reviews,
}: {
  stats: Stats;
  initialReports: UserReportWithUsers[];
  users: User[];
  homes: Home[];
  requests: StayRequest[];
  reviews: Review[];
}) {
  const [activeTab, setActiveTab] = useState<Tab>("overview");
  const [reports, setReports] = useState(initialReports);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const handleResolveReport = (reportId: string, action: "ban" | "dismiss") => {
    startTransition(async () => {
      const result = await resolveReportAction(reportId, action);
      if (result.ok) {
        setReports((prev) => prev.map((r) => (r.id === reportId ? { ...r, status: "resolved" as const, actionTaken: action } : r)));
        setSuccessMessage(`Report resolved successfully with action: ${action.toUpperCase()}`);
        setTimeout(() => setSuccessMessage(null), 3000);
      }
    });
  };

  const tabs: { key: Tab; label: string; badge?: number }[] = [
    { key: "overview", label: "Overview" },
    { key: "users", label: "Users" },
    { key: "homes", label: "Homes" },
    { key: "requests", label: "Requests" },
    { key: "reviews", label: "Reviews" },
    { key: "reports", label: "Reports", badge: reports.filter((r) => r.status === "pending").length },
  ];

  const userById = new Map(users.map((u) => [u.id, u]));

  return (
    <>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Admin Command Center</h1>
          <p className="text-secondary text-sm">Real-time system monitoring and safety moderation tools.</p>
        </div>
      </header>

      {successMessage && (
        <div className="badge badge-accepted btn-full" style={{ padding: 12, marginBottom: 24, fontSize: 14 }}>
          ✓ {successMessage}
        </div>
      )}

      <div className={styles.tabs}>
        {tabs.map((tab) => (
          <button key={tab.key} className={`${styles.tab} ${activeTab === tab.key ? styles.tabActive : ""}`} onClick={() => setActiveTab(tab.key)}>
            {tab.label}
            {tab.badge !== undefined && tab.badge > 0 && <span className={styles.tabBadge}>{tab.badge}</span>}
          </button>
        ))}
      </div>

      {activeTab === "overview" && (
        <div className={styles.statsGrid}>
          <div className={`panel panel-padded ${styles.statCard}`}>
            <span className={styles.statIcon}>👥</span>
            <div className={styles.statValue}>{stats.totalUsers}</div>
            <div className={styles.statLabel}>Total Users</div>
          </div>
          <div className={`panel panel-padded ${styles.statCard}`}>
            <span className={styles.statIcon}>✓</span>
            <div className={styles.statValue}>{stats.verifiedUsers}</div>
            <div className={styles.statLabel}>Verified (KYC)</div>
          </div>
          <div className={`panel panel-padded ${styles.statCard}`}>
            <span className={styles.statIcon}>🏠</span>
            <div className={styles.statValue}>{stats.totalHomes}</div>
            <div className={styles.statLabel}>Listings</div>
          </div>
          <div className={`panel panel-padded ${styles.statCard}`}>
            <span className={styles.statIcon}>📩</span>
            <div className={styles.statValue}>{stats.totalRequests}</div>
            <div className={styles.statLabel}>Requests</div>
          </div>
          <div className={`panel panel-padded ${styles.statCard}`}>
            <span className={styles.statIcon}>⏳</span>
            <div className={styles.statValue}>{stats.pendingRequests}</div>
            <div className={styles.statLabel}>Pending Requests</div>
          </div>
          <div className={`panel panel-padded ${styles.statCard} ${stats.activeReports > 0 ? styles.alertCard : ""}`}>
            <span className={styles.statIcon}>🚨</span>
            <div className={styles.statValue}>{stats.activeReports}</div>
            <div className={styles.statLabel}>Pending Reports</div>
          </div>
        </div>
      )}

      {activeTab === "users" && (
        <div className="panel">
          <div className="panel-header">
            <h3>All Users ({users.length})</h3>
          </div>
          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>User</th>
                  <th>Email</th>
                  <th>Languages</th>
                  <th>Status</th>
                  <th>Ban Status</th>
                  <th>Joined</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id} className={user.isBanned ? styles.bannedRow : ""}>
                    <td>
                      <div className={styles.userCell}>
                        <div className="avatar avatar-sm">
                          {user.firstName[0]}
                          {user.lastName[0]}
                        </div>
                        <span className="font-medium">
                          {user.firstName} {user.lastName}
                        </span>
                      </div>
                    </td>
                    <td className="text-secondary text-sm">{user.email}</td>
                    <td className="text-sm">{user.languages.join(", ")}</td>
                    <td>
                      {user.isVerified ? <span className="badge badge-verified">Verified</span> : <span className="badge badge-pending">Unverified</span>}
                    </td>
                    <td>{user.isBanned ? <span className="badge badge-declined">Banned</span> : <span className="badge badge-accepted">Active</span>}</td>
                    <td className="text-secondary text-sm">{new Date(user.createdAt).toLocaleDateString()}</td>
                    <td>
                      <Link href={`/profile/${user.id}`} className="btn btn-ghost btn-sm">
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-secondary text-sm" style={{ padding: 16 }}>
            Identity verification is handled automatically by the Stripe Identity webhook once configured (see TODOS.md T24) -- there is
            no manual &quot;approve&quot; action here anymore, on purpose.
          </p>
        </div>
      )}

      {activeTab === "homes" && (
        <div className="panel">
          <div className="panel-header">
            <h3>All Listings ({homes.length})</h3>
          </div>
          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Location</th>
                  <th>Host</th>
                  <th>Type</th>
                  <th>Max Guests</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {homes.map((home) => {
                  const host = userById.get(home.hostId);
                  return (
                    <tr key={home.id}>
                      <td className="font-medium">{home.locationName}</td>
                      <td>
                        <Link href={`/profile/${home.hostId}`} className={styles.linkText}>
                          {host?.firstName} {host?.lastName}
                        </Link>
                      </td>
                      <td className="text-sm">{home.sleepingArrangement}</td>
                      <td className="text-sm">{home.maxGuests}</td>
                      <td>
                        <span className="badge badge-info">{home.hostingStatus}</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === "requests" && (
        <div className="panel">
          <div className="panel-header">
            <h3>Stay Requests ({requests.length})</h3>
          </div>
          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Traveler</th>
                  <th>Host</th>
                  <th>Dates</th>
                  <th>Guests</th>
                  <th>Status</th>
                  <th>Created</th>
                </tr>
              </thead>
              <tbody>
                {requests.map((req) => {
                  const traveler = userById.get(req.travelerId);
                  const host = userById.get(req.hostId);
                  const statusClass =
                    req.status === "accepted" || req.status === "completed" ? "badge-accepted" : req.status === "declined" || req.status === "cancelled" ? "badge-declined" : "badge-pending";
                  return (
                    <tr key={req.id}>
                      <td>
                        <Link href={`/profile/${req.travelerId}`} className={styles.linkText}>
                          {traveler?.firstName} {traveler?.lastName}
                        </Link>
                      </td>
                      <td>
                        <Link href={`/profile/${req.hostId}`} className={styles.linkText}>
                          {host?.firstName} {host?.lastName}
                        </Link>
                      </td>
                      <td className="text-sm">
                        {req.arrivalDate} → {req.departureDate}
                      </td>
                      <td className="text-sm">{req.numberOfGuests}</td>
                      <td>
                        <span className={`badge ${statusClass}`}>{req.status.charAt(0).toUpperCase() + req.status.slice(1)}</span>
                      </td>
                      <td className="text-secondary text-sm">{new Date(req.createdAt).toLocaleDateString()}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === "reviews" && (
        <div className="panel">
          <div className="panel-header">
            <h3>All Reviews ({reviews.length})</h3>
          </div>
          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Author</th>
                  <th>About</th>
                  <th>Rating</th>
                  <th>Review</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {reviews.map((review) => {
                  const author = userById.get(review.authorId);
                  const target = userById.get(review.targetId);
                  return (
                    <tr key={review.id}>
                      <td className="font-medium text-sm">
                        {author?.firstName} {author?.lastName}
                      </td>
                      <td>
                        <Link href={`/profile/${review.targetId}`} className={styles.linkText}>
                          {target?.firstName} {target?.lastName}
                        </Link>
                      </td>
                      <td>{"⭐".repeat(review.rating)}</td>
                      <td className="text-sm text-secondary">{review.text.slice(0, 80)}…</td>
                      <td className="text-secondary text-sm">{new Date(review.createdAt).toLocaleDateString()}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === "reports" && (
        <div className="panel">
          <div className="panel-header">
            <h3>Safety Reports</h3>
          </div>
          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Reporter</th>
                  <th>Targeted User</th>
                  <th>Reason</th>
                  <th>Status</th>
                  <th>Action</th>
                  <th>Created</th>
                </tr>
              </thead>
              <tbody>
                {reports.map((rep) => (
                  <tr key={rep.id}>
                    <td className="font-medium text-sm">
                      {rep.reporter.firstName} {rep.reporter.lastName}
                    </td>
                    <td>
                      <Link href={`/profile/${rep.targetId}`} className={styles.linkText}>
                        {rep.target.firstName} {rep.target.lastName}
                      </Link>
                    </td>
                    <td className="text-sm text-secondary">{rep.reason}</td>
                    <td>
                      {rep.status === "pending" ? (
                        <span className="badge badge-pending">Pending</span>
                      ) : (
                        <span className="badge badge-accepted">Resolved ({rep.actionTaken?.toUpperCase()})</span>
                      )}
                    </td>
                    <td>
                      {rep.status === "pending" ? (
                        <div className="flex gap-2">
                          <button className="btn btn-danger btn-sm" onClick={() => handleResolveReport(rep.id, "ban")} disabled={pending}>
                            Ban User
                          </button>
                          <button className="btn btn-secondary btn-sm" onClick={() => handleResolveReport(rep.id, "dismiss")} disabled={pending}>
                            Dismiss
                          </button>
                        </div>
                      ) : (
                        <span className="text-xs text-secondary">Resolved</span>
                      )}
                    </td>
                    <td className="text-secondary text-sm">{new Date(rep.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </>
  );
}
