"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { updateStayRequestStatusAction } from "@/lib/actions/requests";
import { CalendarIcon, MessageIcon, ShieldCheckIcon } from "@/components/Icons";
import type { RequestStatus, StayRequestWithUsers } from "@/types";
import styles from "./dashboard.module.css";

type TabKey = "incoming" | "outgoing";

export default function DashboardClient({
  requests: allRequests,
  currentUserId,
}: {
  requests: StayRequestWithUsers[];
  currentUserId: string;
}) {
  const [activeTab, setActiveTab] = useState<TabKey>("incoming");
  const [errorFor, setErrorFor] = useState<Record<string, string>>({});
  const [pending, startTransition] = useTransition();

  const incoming = allRequests.filter((r) => r.hostId === currentUserId);
  const outgoing = allRequests.filter((r) => r.travelerId === currentUserId);
  const requests = activeTab === "incoming" ? incoming : outgoing;

  const statusBadgeClass = (status: RequestStatus) => {
    switch (status) {
      case "accepted":
      case "completed":
        return "badge-accepted";
      case "declined":
      case "cancelled":
        return "badge-declined";
      default:
        return "badge-pending";
    }
  };

  function act(requestId: string, action: "accept" | "decline") {
    setErrorFor((prev) => ({ ...prev, [requestId]: "" }));
    startTransition(async () => {
      const result = await updateStayRequestStatusAction(requestId, action);
      if (!result.ok) {
        setErrorFor((prev) => ({ ...prev, [requestId]: result.error }));
      }
    });
  }

  return (
    <>
      <div className={styles.tabs}>
        <button className={`${styles.tab} ${activeTab === "incoming" ? styles.tabActive : ""}`} onClick={() => setActiveTab("incoming")}>
          Incoming Requests ({incoming.length})
        </button>
        <button className={`${styles.tab} ${activeTab === "outgoing" ? styles.tabActive : ""}`} onClick={() => setActiveTab("outgoing")}>
          My Travel Plans ({outgoing.length})
        </button>
      </div>

      {requests.length > 0 ? (
        <div className={styles.list}>
          {requests.map((req) => {
            const otherUser = activeTab === "incoming" ? req.traveler : req.host;
            const initials = `${otherUser.firstName[0]}${otherUser.lastName[0]}`;
            const nights = Math.ceil((new Date(req.departureDate).getTime() - new Date(req.arrivalDate).getTime()) / 86400000);

            return (
              <div key={req.id} className={`panel panel-hover ${styles.requestCard}`}>
                <div className={styles.requestInfo}>
                  <Link href={`/profile/${otherUser.id}`} className="avatar avatar-lg">
                    {initials}
                  </Link>
                  <div className={styles.requestDetails}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <Link href={`/profile/${otherUser.id}`} className={styles.requestName}>
                        {otherUser.firstName} {otherUser.lastName}
                      </Link>
                      {otherUser.isVerified && (
                        <span className="badge badge-verified">
                          <ShieldCheckIcon size={12} /> Verified
                        </span>
                      )}
                    </div>
                    <p className="text-secondary text-sm" style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 4 }}>
                      <CalendarIcon size={14} /> {req.arrivalDate} → {req.departureDate} ({nights} night{nights !== 1 ? "s" : ""}) ·{" "}
                      {req.numberOfGuests} guest{req.numberOfGuests !== 1 ? "s" : ""}
                    </p>
                    <p className={styles.requestMessage}>&quot;{req.initialMessage.slice(0, 120)}…&quot;</p>
                    {errorFor[req.id] && (
                      <p role="alert" className="text-sm" style={{ color: "var(--color-danger, #d33)", marginTop: 4 }}>
                        {errorFor[req.id]}
                      </p>
                    )}
                  </div>
                </div>

                <div className={styles.requestActions}>
                  <span className={`badge ${statusBadgeClass(req.status)}`}>{req.status.charAt(0).toUpperCase() + req.status.slice(1)}</span>

                  {req.status === "pending" && activeTab === "incoming" && (
                    <div className={styles.actionBtns}>
                      <button className="btn btn-success btn-sm" onClick={() => act(req.id, "accept")} disabled={pending}>
                        Accept
                      </button>
                      <button className="btn btn-danger btn-sm" onClick={() => act(req.id, "decline")} disabled={pending}>
                        Decline
                      </button>
                    </div>
                  )}

                  <Link href="/messages" className="btn btn-secondary btn-sm" style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                    <MessageIcon size={14} /> Chat
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className={styles.empty}>
          <div style={{ fontSize: "2rem", color: "var(--terracotta-500)", marginBottom: 16 }}>
            <CalendarIcon size={48} />
          </div>
          <h3>No {activeTab === "incoming" ? "incoming requests" : "trips"} yet</h3>
          <p className="text-secondary text-sm">
            {activeTab === "incoming"
              ? "When travelers send you stay requests, they will appear here."
              : "When you send stay requests to hosts, they will appear here."}
          </p>
        </div>
      )}
    </>
  );
}
