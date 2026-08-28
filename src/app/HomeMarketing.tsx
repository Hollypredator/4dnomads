import Link from "next/link";
import { Reveal } from "@/components/Reveal";
import { WelcomeIllustration } from "@/components/WelcomeIllustration";
import { AppBar } from "@/components/AppBar";
import styles from "./page.module.css";

interface CityCount {
  name: string;
  hostCount: number;
}

// Logged-out landing page. No fabricated stats, no invented testimonials --
// the platform has zero real users right now, and a fake "10,000+ hosts"
// banner shown to a real visitor of a live, Supabase-backed site is a lie,
// not marketing. See the design conversation in this session for why this
// replaced the old numbers.
export default function HomeMarketing({ cityCounts }: { cityCounts: CityCount[] }) {
  const hasRealCities = cityCounts.length > 0;

  return (
    <>
      {/* ── Hero: asymmetric split, not centered. The visual is the brand
          illustration, not a photo -- there is no image storage in this app
          yet, so a photo here could only be stock. ── */}
      <AppBar />
      <section className={styles.hero}>
        <div className={styles.heroGrid}>
          <div className={styles.heroCopy}>
            <h1 className={styles.heroTitle}>
              Stay with Locals.
              <br />
              <span className={styles.highlight}>Belong Anywhere.</span>
            </h1>
            <p className={styles.heroSub}>
              A free hospitality exchange -- no paywalls, no booking fees, ever. You stay with someone who
              actually lives there, and you host the next person through.
            </p>
            <div className={styles.heroCta}>
              <Link href="/register" className="btn btn-primary btn-lg">
                Join 4dnomads, It&apos;s Free
              </Link>
              <Link href="/explore" className="btn btn-secondary btn-lg">
                Explore Hosts
              </Link>
            </div>
          </div>
          <div className={styles.heroVisual}>
            <WelcomeIllustration className={styles.heroImage} />
          </div>
        </div>
      </section>

      {/* ── Why 4dnomads: a single horizontal strip, not three boxed cards
          repeating the same icon-circle-title-desc component -- that pattern
          right below an identical one in "How It Works" was the actual
          AI-template tell, not any one section on its own. ── */}
      <section className={styles.stats}>
        <div className={styles.valueStrip}>
          <div className={styles.valueItem}>
            <span className={styles.valueLead}>Free.</span> No paywalls, no booking fees, no premium tier. It stays that way because
            hosting is reciprocal, not paid for.
          </div>
          <div className={styles.valueItem}>
            <span className={styles.valueLead}>Verified.</span> Hosts and travelers confirm their identity, so who you&apos;re
            messaging is who shows up.
          </div>
          <div className={styles.valueItem}>
            <span className={styles.valueLead}>Local.</span> Not a listing on a booking site -- a spare room, a couch, a person who
            actually lives there.
          </div>
        </div>
      </section>

      {/* ── How It Works: a left-aligned numbered flow instead of another
          centered icon grid, so it reads as its own thing, not the same
          component as the section above with different copy. ── */}
      <section className={styles.howItWorks}>
        <Reveal>
          <h2 className={styles.sectionTitle}>How it actually works</h2>
        </Reveal>
        <div className={styles.stepsFlow}>
          {[
            { n: "01", title: "Find a host", desc: "Search by city, read profiles and past reviews, and find someone whose place and interests line up with your trip." },
            { n: "02", title: "Send a request", desc: "Say who you are, when you're travelling, and why you'd like to stay with them specifically. Generic requests get ignored -- specific ones don't." },
            { n: "03", title: "Stay, then host", desc: "You stay with them this time. Next time, someone stays with you. That's the whole exchange." },
          ].map((step, i) => (
            <Reveal key={step.n} delay={i * 90}>
              <div className={styles.stepRow}>
                <span className={styles.stepNumber}>{step.n}</span>
                <div>
                  <h3 className={styles.stepTitle}>{step.title}</h3>
                  <p className={styles.stepDesc}>{step.desc}</p>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ── Cities: real data only. Empty state invites the first host instead of showing a fake grid. ── */}
      <section className={styles.cities}>
        <Reveal>
          <h2 className={styles.sectionTitle}>{hasRealCities ? "Popular Destinations" : "Be the First in Your City"}</h2>
        </Reveal>
        {hasRealCities ? (
          <div className={styles.citiesGrid}>
            {cityCounts.map((city, i) => (
              <Reveal key={city.name} delay={i * 60}>
                <Link href={`/explore?city=${encodeURIComponent(city.name)}`} className={`${styles.cityCard} press-card`}>
                  <div className={styles.cityBg} />
                  <div className={styles.cityInfo}>
                    <div className={styles.cityName}>{city.name}</div>
                    <div className={styles.cityCount}>
                      {city.hostCount} host{city.hostCount !== 1 ? "s" : ""}
                    </div>
                  </div>
                </Link>
              </Reveal>
            ))}
          </div>
        ) : (
          <Reveal>
            <div className={styles.founderBanner}>
              <p className="text-secondary" style={{ marginBottom: 20 }}>
                4dnomads is brand new. Nobody has listed a home yet. The first host in every city gets to shape what this community becomes here.
              </p>
              <Link href="/register" className="btn btn-primary">
                Become the First Host
              </Link>
            </div>
          </Reveal>
        )}
      </section>

      {/* ── Final CTA ── */}
      <section className={styles.ctaSection}>
        <Reveal>
          <h2 className={styles.ctaTitle}>Your spare room is worth more than rent from a stranger.</h2>
          <p className={styles.ctaSub}>Open your door once, and you have a place to stay everywhere someone else has too.</p>
          <Link href="/register" className="btn btn-primary btn-lg">
            Open Your Door
          </Link>
        </Reveal>
      </section>
    </>
  );
}
