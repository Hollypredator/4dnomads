import { requireSession } from "@/lib/session";
import { getHomeByHostId } from "@/lib/data/homes";
import HostingForm from "./HostingForm";
import styles from "./hosting.module.css";

const DEFAULT_HOME = {
  sleepingArrangement: "Private Room",
  maxGuests: 1,
  houseRules: "",
  locationName: "",
  latitude: 0,
  longitude: 0,
  smokingPolicy: "Not allowed" as const,
  petsInfo: "",
  amenities: [] as string[],
  hostingStatus: "not_accepting" as const,
  genderPreference: "Any" as const,
  kidFriendly: false,
  wheelchairAccessible: false,
  blockoutDates: [] as string[],
};

export default async function EditHostingPage() {
  const session = await requireSession();
  const existing = await getHomeByHostId(session.authUserId);

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <header className={styles.header}>
          <h1>Hosting & Availability Settings</h1>
          <p className="text-secondary text-sm">Configure how and when you want to host guests.</p>
        </header>

        <HostingForm home={existing ?? DEFAULT_HOME} />
      </div>
    </div>
  );
}
