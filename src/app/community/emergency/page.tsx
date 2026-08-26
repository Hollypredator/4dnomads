import { getEmergencyAlerts } from "@/lib/data/forum";
import EmergencyClient from "./EmergencyClient";

export default async function EmergencyAlertsPage() {
  const alerts = await getEmergencyAlerts();
  return <EmergencyClient initialAlerts={alerts} />;
}
