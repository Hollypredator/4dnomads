import { requireSession } from "@/lib/session";
import { MobileHeader } from "@/components/MobileHeader";
import ProfileForm from "./ProfileForm";
import styles from "../../../dashboard/dashboard.module.css";

export default async function EditProfileDetailsPage() {
  const session = await requireSession();

  return (
    <>
      <MobileHeader title="Edit Profile" backHref="/profile/edit" />
      <div className={styles.page}>
        <div className={styles.container} style={{ maxWidth: 560 }}>
          <header className={`${styles.header} desktop-only`}>
            <h1>Edit Profile</h1>
            <p className="text-secondary text-sm">This is what travelers and hosts see before they reach out.</p>
          </header>

          <div className="panel panel-padded">
            <ProfileForm profile={session.profile} />
          </div>
        </div>
      </div>
    </>
  );
}
