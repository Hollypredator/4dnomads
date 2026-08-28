import type { Metadata } from "next";
import { getPublicTrips } from "@/lib/data/community";
import { AppBar } from "@/components/AppBar";
import PublicTripsClient from "./PublicTripsClient";
import styles from "./trips.module.css";

export const metadata: Metadata = {
  title: "Public Trips",
  description: "See where travellers are headed next and invite them to stay -- post your own trip so local hosts can find you.",
};

export default async function PublicTripsPage() {
  const trips = await getPublicTrips();
  return (
    <>
      <AppBar />
    <div className={styles.page}>
      <div className={styles.container}>
        <PublicTripsClient trips={trips} />
      </div>
    </div>
    </>
  );
}
