import type { Metadata } from "next";
import { getLocalEvents } from "@/lib/data/community";
import { AppBar } from "@/components/AppBar";
import EventsClient from "./EventsClient";
import styles from "./events.module.css";

export const metadata: Metadata = {
  title: "Local Events & Hangouts",
  description: "Coffee meetups, city walks and group dinners organised by nomads and locals. Find one near you or host your own.",
};

export default async function EventsPage() {
  const events = await getLocalEvents();
  return (
    <>
      <AppBar />
    <div className={styles.page}>
      <div className={styles.container}>
        <EventsClient events={events} />
      </div>
    </div>
    </>
  );
}
