import { getLocalEvents } from "@/lib/data/community";
import EventsClient from "./EventsClient";
import styles from "./events.module.css";

export default async function EventsPage() {
  const events = await getLocalEvents();
  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <EventsClient events={events} />
      </div>
    </div>
  );
}
