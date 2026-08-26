import { getPublicTrips } from "@/lib/data/community";
import PublicTripsClient from "./PublicTripsClient";
import styles from "./trips.module.css";

export default async function PublicTripsPage() {
  const trips = await getPublicTrips();
  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <PublicTripsClient trips={trips} />
      </div>
    </div>
  );
}
