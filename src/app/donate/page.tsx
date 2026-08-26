import { HeartIcon } from "@/components/Icons";
import styles from "./donate.module.css";

export default function DonatePage() {
  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <div className={`panel panel-padded ${styles.card}`}>
          <div style={{ color: "var(--terracotta-500)", display: "flex", justifyContent: "center", marginBottom: 16 }}>
            <HeartIcon size={48} />
          </div>
          <h1 className={styles.title}>Keep Nomads Free</h1>
          <p className={styles.desc}>
            Nomads is 100% free for everyone. We do not charge subscription fees or take cuts from hosts.
            To keep our servers running and the platform growing, we rely on the generosity of our community.
          </p>

          <div className={styles.amounts}>
            <button className={styles.amountBtn}>$5</button>
            <button className={styles.amountBtn}>$15</button>
            <button className={styles.amountBtn}>$50</button>
            <div className={styles.customAmount}>
              <span className={styles.currency}>$</span>
              <input type="number" className="form-input" placeholder="Other" min="1" style={{ paddingLeft: 28 }} />
            </div>
          </div>

          <button className="btn btn-primary btn-full btn-lg" style={{ marginTop: 24 }}>
            Support Our Community
          </button>

          <p className={styles.hint}>
            Secure payment powered by Stripe. You can cancel recurring donations at any time.
          </p>
        </div>
      </div>
    </div>
  );
}
