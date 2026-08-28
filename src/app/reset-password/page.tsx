"use client";

import { useActionState } from "react";
import { updatePasswordAction, type AuthFormState } from "@/lib/actions/auth";
import { PASSWORD_REQUIREMENTS } from "@/lib/authPolicy";
import { MobileHeader } from "@/components/MobileHeader";
import styles from "../login/auth.module.css";

const initialState: AuthFormState = {};

export default function ResetPasswordPage() {
  const [state, formAction, pending] = useActionState(updatePasswordAction, initialState);

  return (
    <>
      <MobileHeader title="Set New Password" backHref="/login" />
      <div className={styles.page}>
      <div className={`panel panel-padded ${styles.card}`}>
        <h1 className={styles.title}>Choose a New Password</h1>
        <p className="text-secondary text-sm text-center" style={{ marginBottom: 24 }}>
          You&apos;re signed in from the reset link -- pick a new password to finish.
        </p>

        <form className={styles.form} action={formAction}>
          <div className="form-group">
            <label className="form-label" htmlFor="password">New Password</label>
            <input type="password" id="password" name="password" className="form-input" placeholder="At least 8 characters" required minLength={8} maxLength={200} />
            <span className="form-hint">{PASSWORD_REQUIREMENTS}</span>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="confirmPassword">Confirm New Password</label>
            <input type="password" id="confirmPassword" name="confirmPassword" className="form-input" placeholder="Repeat your new password" required minLength={8} maxLength={200} />
          </div>

          {state.error && (
            <p role="alert" className="text-sm" style={{ color: "var(--color-danger, #d33)" }}>
              {state.error}
            </p>
          )}

          <button type="submit" className="btn btn-primary btn-full btn-lg" disabled={pending}>
            {pending ? "Saving…" : "Save New Password"}
          </button>
        </form>
      </div>
      </div>
    </>
  );
}
