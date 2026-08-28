import Link from "next/link";
import { requireSession } from "@/lib/session";
import { getUserById } from "@/lib/data/profiles";
import { getHomeByHostId } from "@/lib/data/homes";
import { MobileHeader } from "@/components/MobileHeader";
import RequestForm from "./RequestForm";
import styles from "./request.module.css";

export default async function RequestPage({ params }: { params: Promise<{ hostId: string }> }) {
  const { hostId } = await params;
  await requireSession();

  const [host, home] = await Promise.all([getUserById(hostId), getHomeByHostId(hostId)]);

  if (!host || !home) {
    return (
      <div style={{ textAlign: "center", padding: "120px 24px" }}>
        <MobileHeader title="Request to Stay" backHref="/explore" />
        <h2>Host not found</h2>
        <Link href="/explore" className="btn btn-primary" style={{ marginTop: 16 }}>
          Back to Explore
        </Link>
      </div>
    );
  }

  const initials = `${host.firstName[0]}${host.lastName[0]}`;

  return (
    <>
      <MobileHeader title="Request to Stay" backHref={`/profile/${hostId}`} />
      <div className={styles.page}>
        <div className={`panel panel-padded ${styles.card}`}>
          <h1 className={`${styles.title} desktop-only`}>Request to Stay</h1>

          <div className={styles.hostSummary}>
            <div className="avatar avatar-lg">{initials}</div>
            <div>
              <h3 className="font-semibold">
                {host.firstName} {host.lastName}
              </h3>
              <p className="text-secondary text-sm">
                {home.locationName} · {home.sleepingArrangement}
              </p>
            </div>
          </div>

          <RequestForm hostId={hostId} homeId={home.id} maxGuests={home.maxGuests} />
        </div>
      </div>
    </>
  );
}
