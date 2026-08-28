import { redirect } from "next/navigation";
import { requireSession } from "@/lib/session";
import OnboardingFlow from "./OnboardingFlow";

export default async function OnboardingPage() {
  const session = await requireSession();

  // Already been through it: this route is a one-time flow, not somewhere to
  // navigate back to.
  if (session.onboardingCompletedAt) redirect("/");

  return <OnboardingFlow profile={session.profile} />;
}
