import type { Metadata } from "next";
import { HeartIcon } from "@/components/Icons";
import { AppBar } from "@/components/AppBar";
import DonateForm from "./DonateForm";
import styles from "./donate.module.css";

export const metadata: Metadata = {
  title: "Support Us",
  description: "4dnomads is free for everyone, no subscriptions or booking fees. Optional donations help keep it that way.",
};

export default function DonatePage() {
  return (
    <>
      <AppBar />
      <div className={styles.page}>
      <div className={styles.container}>
        <div className={`panel panel-padded ${styles.card}`}>
          <div style={{ color: "var(--terracotta-500)", display: "flex", justifyContent: "center", marginBottom: 16 }}>
            <HeartIcon size={48} />
          </div>
          <h1 className={styles.title}>Keep 4dnomads Free</h1>
          <p className={styles.desc}>
            4dnomads is 100% free for everyone. We do not charge subscription fees or take cuts from hosts.
            To keep our servers running and the platform growing, we rely on the generosity of our community.
          </p>

          <DonateForm />
        </div>
      </div>
      </div>
    </>
  );
}
