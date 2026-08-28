"use client";

import { useActionState } from "react";
import Link from "next/link";
import { registerAction, type AuthFormState } from "@/lib/actions/auth";
import { MobileHeader } from "@/components/MobileHeader";
import { GoogleSignInButton } from "@/components/GoogleSignInButton";
import styles from "../login/auth.module.css";

const initialState: AuthFormState = {};

export default function RegisterPage() {
  const [state, formAction, pending] = useActionState(registerAction, initialState);

  return (
    <>
      <MobileHeader title="Sign Up" backHref="/" />
      <div className={styles.page}>
      <div className={`panel panel-padded ${styles.card}`}>
        <h1 className={styles.title}>Join 4dnomads</h1>
        <p className="text-secondary text-sm text-center" style={{ marginBottom: 24 }}>
          Create your free account and start exploring.
        </p>

        <GoogleSignInButton label="Sign up with Google" />

        <div className={styles.divider}>or</div>

        <form className={styles.form} action={formAction}>
          <div className="form-row-2">
            <div className="form-group">
              <label className="form-label" htmlFor="firstName">First Name</label>
              <input type="text" id="firstName" name="firstName" className="form-input" placeholder="Jane" maxLength={80} required />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="lastName">Last Name</label>
              <input type="text" id="lastName" name="lastName" className="form-input" placeholder="Doe" maxLength={80} required />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="regEmail">Email Address</label>
            <input type="email" id="regEmail" name="email" className="form-input" placeholder="nomad@example.com" maxLength={254} required />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="regPassword">Password</label>
            <input type="password" id="regPassword" name="password" className="form-input" placeholder="At least 8 characters" required minLength={8} maxLength={200} />
            <span className="form-hint">Minimum 8 characters</span>
          </div>

          {state.error && (
            <p role="alert" className="text-sm" style={{ color: "var(--color-danger, #d33)" }}>
              {state.error}
            </p>
          )}

          <button type="submit" className="btn btn-primary btn-full btn-lg" disabled={pending}>
            {pending ? "Creating account…" : "Create Account"}
          </button>
        </form>

        <p className={styles.footer}>
          Already have an account? <Link href="/login" className={styles.link}>Log in</Link>
        </p>
      </div>
      </div>
    </>
  );
}
