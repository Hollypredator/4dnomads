import Link from "next/link";
import styles from "./footer.module.css";

export default function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={styles.container}>
        <div className={styles.grid}>
          <div className={styles.brand}>
            <Link href="/" className={styles.logo}>Nomads.</Link>
            <p className={styles.tagline}>
              Stay with locals. Belong anywhere.<br />
              100% free, forever.
            </p>
          </div>

          <div className={styles.column}>
            <h4 className={styles.columnTitle}>Platform</h4>
            <Link href="/explore" className={styles.footerLink}>Find Hosts</Link>
            <Link href="/register" className={styles.footerLink}>Become a Host</Link>
            <Link href="/donate" className={styles.footerLink}>Support Us</Link>
          </div>

          <div className={styles.column}>
            <h4 className={styles.columnTitle}>Community</h4>
            <Link href="#" className={styles.footerLink}>Safety Guidelines</Link>
            <Link href="#" className={styles.footerLink}>How It Works</Link>
            <Link href="#" className={styles.footerLink}>Blog</Link>
          </div>

          <div className={styles.column}>
            <h4 className={styles.columnTitle}>Legal</h4>
            <Link href="#" className={styles.footerLink}>Privacy Policy</Link>
            <Link href="#" className={styles.footerLink}>Terms of Service</Link>
            <Link href="#" className={styles.footerLink}>Cookie Policy</Link>
          </div>
        </div>

        <div className={styles.bottom}>
          <p>© {new Date().getFullYear()} Nomads. Built with ❤️ for the travel community.</p>
        </div>
      </div>
    </footer>
  );
}
