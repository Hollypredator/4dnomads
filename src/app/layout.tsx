import type { Metadata, Viewport } from "next";
import NavBar from "@/components/NavBar";
import Footer from "@/components/Footer";
import MobileTabBar from "@/components/MobileTabBar";
import NativeShell from "@/components/NativeShell";
import { ChromeGate } from "@/components/ChromeGate";
import { getSession } from "@/lib/session";
import { SITE_URL, SITE_NAME } from "@/lib/site";
import "./globals.css";

const TITLE = "4dnomads: Stay with Locals, Belong Anywhere";
const DESCRIPTION =
  "A free hospitality exchange for travelers and hosts. No paywalls, no booking fees -- stay with someone who actually lives there, then host the next person through.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: TITLE, template: `%s | ${SITE_NAME}` },
  description: DESCRIPTION,
  applicationName: SITE_NAME,
  // Explicit rather than relying on defaults: a staging/preview deploy
  // getting indexed under the production title is a real, easy-to-miss SEO
  // mistake, and being explicit here means a future preview-specific
  // override (see robots.ts) is the only place that ever needs to change.
  robots: { index: true, follow: true },
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    url: SITE_URL,
    siteName: SITE_NAME,
    title: TITLE,
    description: DESCRIPTION,
    locale: "en_US",
    images: [{ url: "/og-image.png", width: 1200, height: 630, alt: SITE_NAME }],
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
    images: ["/og-image.png"],
  },
  appleWebApp: {
    // Drops Safari's chrome when launched from the home screen, so an
    // installed iOS shortcut behaves like the packaged app rather than a tab.
    capable: true,
    title: SITE_NAME,
    statusBarStyle: "default",
  },
  icons: {
    icon: [
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
  // A phone number in a bio or house rules should not become a tap-to-call
  // link styled by the OS -- it breaks the layout and looks unowned.
  formatDetection: { telephone: false },
  verification: {
    google: "2w9G4d0MosTy3H_ict-Wbu5I_posyjbgboRrQNwYZts",
  },
};

// viewportFit: "cover" lets the page draw under the notch/home-indicator on
// modern phones, which is required for env(safe-area-inset-bottom) in the
// bottom tab bar to mean anything (otherwise the browser never extends the
// viewport that far and the inset is always 0).
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#b22c00",
  // Pinch-zoom stays available (never disable it -- it is an accessibility
  // affordance), but the double-tap/zoom-on-focus jump that makes a web view
  // feel like a website is avoided by sizing inputs at >=16px in globals.css.
  maximumScale: 5,
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  // Server-only identity (decision 2, docs/cutover-plan.md). cache() means
  // any page that also calls getSession() this request reuses this result.
  const session = await getSession();
  const user = session?.profile ?? null;

  return (
    <html lang="en">
      <body>
        <ChromeGate>
          <NavBar user={user} />
        </ChromeGate>
        {/* mobile-bottom-spacer (globals.css) reserves room on mobile so
            page content doesn't render underneath the fixed tab bar.
            Footer no longer needs this itself -- it's hidden on mobile
            entirely (see footer.module.css): this is meant to package
            into an app store build, and a site-map footer doesn't belong
            in that experience. */}
        <main className="mobile-bottom-spacer">{children}</main>
        <ChromeGate>
          <Footer />
          <MobileTabBar user={user} />
        </ChromeGate>
        {/* Renders nothing; no-ops entirely outside the native shell. */}
        <NativeShell signedIn={!!user} />
      </body>
    </html>
  );
}
