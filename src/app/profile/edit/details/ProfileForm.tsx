"use client";

import { useActionState, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { updateProfileAction, type ProfileFormState } from "@/lib/actions/profile";
import { Avatar } from "@/components/Avatar";
import { CameraIcon } from "@/components/Icons";
import type { User } from "@/types";
import styles from "./profile-form.module.css";

const initialState: ProfileFormState = {};

export default function ProfileForm({ profile }: { profile: User }) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState(updateProfileAction, initialState);
  const fileRef = useRef<HTMLInputElement>(null);
  // Local object URL so the chosen photo appears immediately, rather than
  // only after the round trip.
  const [preview, setPreview] = useState<string | null>(null);
  const [bioLength, setBioLength] = useState(profile.bio?.length ?? 0);

  if (state.ok) {
    // Server state is already revalidated; this just returns the user to the
    // hub so the save has a visible endpoint.
    router.push("/profile/edit");
  }

  return (
    <form action={formAction} className={styles.form}>
      <div className={styles.photoRow}>
        <Avatar src={preview ?? profile.avatarUrl} firstName={profile.firstName} lastName={profile.lastName} size="2xl" />
        <div className={styles.photoActions}>
          <button type="button" className="btn btn-secondary btn-sm" onClick={() => fileRef.current?.click()}>
            <CameraIcon size={16} /> {profile.avatarUrl || preview ? "Change photo" : "Add photo"}
          </button>
          <p className={styles.photoHint}>JPEG, PNG or WebP, up to 5&nbsp;MB.</p>
        </div>
        <input
          ref={fileRef}
          type="file"
          name="avatar"
          accept="image/jpeg,image/png,image/webp"
          className={styles.fileInput}
          onChange={(e) => {
            const file = e.target.files?.[0];
            setPreview(file ? URL.createObjectURL(file) : null);
          }}
        />
      </div>

      <div className="form-row-2">
        <div className="form-group">
          <label className="form-label" htmlFor="firstName">First name</label>
          <input id="firstName" name="firstName" className="form-input" defaultValue={profile.firstName} maxLength={80} required />
        </div>
        <div className="form-group">
          <label className="form-label" htmlFor="lastName">Last name</label>
          <input id="lastName" name="lastName" className="form-input" defaultValue={profile.lastName} maxLength={80} required />
        </div>
      </div>

      <div className="form-group">
        <label className="form-label" htmlFor="bio">About you</label>
        <textarea
          id="bio"
          name="bio"
          className="form-textarea"
          rows={5}
          maxLength={2000}
          defaultValue={profile.bio ?? ""}
          placeholder="What you do, what you're travelling for, what a guest or host can expect from you."
          onChange={(e) => setBioLength(e.target.value.length)}
        />
        <span className="form-hint">{bioLength} / 2000</span>
      </div>

      <div className="form-group">
        <label className="form-label" htmlFor="languages">Languages</label>
        <input
          id="languages"
          name="languages"
          className="form-input"
          defaultValue={profile.languages?.join(", ") ?? ""}
          placeholder="Turkish, English, Spanish"
        />
        <span className="form-hint">Separate with commas.</span>
      </div>

      <div className="form-group">
        <label className="form-label" htmlFor="interests">Interests</label>
        <input
          id="interests"
          name="interests"
          className="form-input"
          defaultValue={profile.interests?.join(", ") ?? ""}
          placeholder="Coding, surfing, cooking, live music"
        />
        <span className="form-hint">Shown on your profile and used to match you with hosts.</span>
      </div>

      {state.error && (
        <p role="alert" className="text-sm" style={{ color: "var(--color-danger)" }}>
          {state.error}
        </p>
      )}

      <button type="submit" className="btn btn-primary btn-full btn-lg" disabled={pending}>
        {pending ? "Saving…" : "Save profile"}
      </button>
    </form>
  );
}
