import type { Metadata } from "next";
import NavBar from "@/components/NavBar";
import Footer from "@/components/Footer";
import { getSession } from "@/lib/session";
import "./globals.css";

export const metadata: Metadata = {
  title: "Nomads — Stay with Locals, Belong Anywhere",
  description:
    "Join the global community of travelers and hosts. Experience authentic travel by staying with locals for free.",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  // Server-only identity (decision 2, docs/cutover-plan.md). cache() means
  // any page that also calls getSession() this request reuses this result.
  const session = await getSession();

  return (
    <html lang="en">
      <body>
        <NavBar user={session?.profile ?? null} />
        <main>{children}</main>
        <Footer />
      </body>
    </html>
  );
}
