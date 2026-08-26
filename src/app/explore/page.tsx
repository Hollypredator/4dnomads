import { getAllHosts } from "@/lib/data/profiles";
import ExploreClient from "./ExploreClient";
import styles from "./explore.module.css";

export default async function ExplorePage() {
  // No search center yet (T19 follow-up: wire browser geolocation through
  // to getAllHosts({lat, lng})). This bounded page replaces the original
  // "fetch every host on earth" query flagged in Section 7.
  const hosts = await getAllHosts({ limit: 60 });

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <ExploreClient hosts={hosts} />
      </div>
    </div>
  );
}
