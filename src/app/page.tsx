import Link from "next/link";
import { SearchIcon, MessageIcon, BedIcon, SparklesIcon } from "@/components/Icons";
import styles from "./page.module.css";

const CITIES = [
  { name: "Istanbul", hosts: 142, color: "linear-gradient(135deg, #d96b43, #a4401e)" },
  { name: "Lisbon", hosts: 98, color: "linear-gradient(135deg, #2d5a44, #1b382a)" },
  { name: "Bali", hosts: 76, color: "linear-gradient(135deg, #3b82f6, #1d4ed8)" },
  { name: "Berlin", hosts: 121, color: "linear-gradient(135deg, #d97706, #92400e)" },
];

const TESTIMONIALS = [
  {
    text: "I stayed with a local family in Istanbul and it completely changed my trip. We cooked together, explored the neighborhood, and I made lifelong friends. Hotels could never.",
    name: "Marco R.",
    location: "Italy",
  },
  {
    text: "After Couchsurfing went paid, I thought this kind of travel dead. Nomads brought it back. I've hosted 20+ travelers this year and every single one has been amazing.",
    name: "Sarah L.",
    location: "Canada",
  },
  {
    text: "As a solo female traveler, the verified badge system gives me so much confidence. I know the person I'm staying with has been ID-checked. That matters.",
    name: "Yuki T.",
    location: "Japan",
  },
];

export default function Home() {
  return (
    <>
      {/* ── Hero ── */}
      <section className={styles.hero}>
        <div className={styles.heroInner}>
          <div style={{ marginBottom: 20 }}>
            <span className="free-banner pulse-badge">
              <SparklesIcon size={14} /> 100% Free Hospitality Exchange — No Paywalls
            </span>
          </div>
          <h1 className={styles.heroTitle}>
            Stay with Locals.<br />
            <span className={styles.highlight}>Belong Anywhere.</span>
          </h1>
          <p className={styles.heroSub}>
            Join the global community of travelers and hosts.
            Experience the world authentically — for free, forever.
          </p>
          <div className={styles.heroCta}>
            <Link href="/register" className="btn btn-primary btn-lg">
              Join Nomads — It&apos;s Free
            </Link>
            <Link href="/explore" className="btn btn-secondary btn-lg">
              Explore Hosts
            </Link>
          </div>
        </div>
      </section>

      {/* ── Stats ── */}
      <section className={styles.stats}>
        <div className={styles.statsGrid}>
          <div>
            <div className={styles.statNumber}>10,000+</div>
            <div className={styles.statLabel}>Active Hosts</div>
          </div>
          <div>
            <div className={styles.statNumber}>120</div>
            <div className={styles.statLabel}>Countries</div>
          </div>
          <div>
            <div className={styles.statNumber}>50,000+</div>
            <div className={styles.statLabel}>Travelers</div>
          </div>
          <div>
            <div className={styles.statNumber}>100%</div>
            <div className={styles.statLabel}>Free, Always</div>
          </div>
        </div>
      </section>

      {/* ── How It Works ── */}
      <section className={styles.howItWorks}>
        <h2 className={styles.sectionTitle}>How It Works</h2>
        <div className={styles.stepsGrid}>
          <div className={styles.step}>
            <div className={styles.stepIcon}>
              <SearchIcon size={28} />
            </div>
            <h3 className={styles.stepTitle}>Find a Host</h3>
            <p className={styles.stepDesc}>
              Search by city, check profiles, read reviews from past travelers, and find someone you connect with.
            </p>
          </div>
          <div className={styles.step}>
            <div className={styles.stepIcon}>
              <MessageIcon size={28} />
            </div>
            <h3 className={styles.stepTitle}>Send a Request</h3>
            <p className={styles.stepDesc}>
              Tell the host about yourself, your travel dates, and why you&apos;d like to stay. Be personal — it matters.
            </p>
          </div>
          <div className={styles.step}>
            <div className={styles.stepIcon}>
              <BedIcon size={28} />
            </div>
            <h3 className={styles.stepTitle}>Stay & Connect</h3>
            <p className={styles.stepDesc}>
              Experience the city through local eyes. Share meals, stories, and make memories that last a lifetime.
            </p>
          </div>
        </div>
      </section>

      {/* ── Featured Cities ── */}
      <section className={styles.cities}>
        <h2 className={styles.sectionTitle}>Popular Destinations</h2>
        <div className={styles.citiesGrid}>
          {CITIES.map((city) => (
            <Link href="/explore" key={city.name} className={styles.cityCard}>
              <div
                className={styles.cityBg}
                style={{ background: city.color }}
              />
              <div className={styles.cityInfo}>
                <div className={styles.cityName}>{city.name}</div>
                <div className={styles.cityCount}>{city.hosts} hosts</div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* ── Testimonials ── */}
      <section className={styles.testimonials}>
        <h2 className={styles.sectionTitle}>What Our Community Says</h2>
        <div className={styles.testimonialGrid}>
          {TESTIMONIALS.map((t) => (
            <div key={t.name} className={styles.testimonialCard}>
              <p className={styles.testimonialText}>&quot;{t.text}&quot;</p>
              <div className={styles.testimonialAuthor}>
                <div className="avatar avatar-sm">{t.name[0]}</div>
                <div>
                  <div className={styles.testimonialName}>{t.name}</div>
                  <div className={styles.testimonialLocation}>{t.location}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA ── */}
      <section className={styles.ctaSection}>
        <h2 className={styles.ctaTitle}>Ready to explore the world?</h2>
        <p className={styles.ctaSub}>Join 50,000+ nomads who travel authentically.</p>
        <Link href="/register" className="btn btn-primary btn-lg">
          Get Started — Free Forever
        </Link>
      </section>
    </>
  );
}
