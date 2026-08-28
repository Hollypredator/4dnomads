"use client";

import { useActionState } from "react";
import Link from "next/link";
import { requestPasswordResetAction, type RequestPasswordResetState } from "@/lib/actions/auth";
import { MobileHeader } from "@/components/MobileHeader";
import styles from "../login/auth.module.css";

const initialState: RequestPasswordResetState = {};

export default function ForgotPasswordPage() {
  const [state, formAction, pending] = useActionState(requestPasswordResetAction, initialState);

  return (
    <>
      <MobileHeader title="Reset Password" backHref="/login" />
      <div className={styles.page}>
      <div className={`panel panel-padded ${styles.card}`}>
        {state.sent ? (
          <>
            <h1 className={styles.title}>Check Your Email</h1>
            <p className="text-secondary text-sm text-center" style={{ marginBottom: 24 }}>
              If an account exists for that address, we&apos;ve sent a link to reset your password.
            </p>
            <Link href="/login" className="btn btn-secondary btn-full btn-lg">
              Back to Log In
            </Link>
          </>
        ) : (
          <>
            <h1 className={styles.title}>Forgot Password?</h1>
            <p className="text-secondary text-sm text-center" style={{ marginBottom: 24 }}>
              Enter your email and we&apos;ll send you a link to reset it.
            </p>

            <form className={styles.form} action={formAction}>
              <div className="form-group">
                <label className="form-label" htmlFor="email">Email Address</label>
                <input type="email" id="email" name="email" className="form-input" placeholder="nomad@example.com" maxLength={254} required />
              </div>

              {state.error && (
                <p role="alert" className="text-sm" style={{ color: "var(--color-danger, #d33)" }}>
                  {state.error}
                </p>
              )}

              <button type="submit" className="btn btn-primary btn-full btn-lg" disabled={pending}>
                {pending ? "Sending…" : "Send Reset Link"}
              </button>
            </form>

            <p className={styles.footer}>
              Remembered it? <Link href="/login" className={styles.link}>Log in</Link>
            </p>
          </>
        )}
      </div>
      </div>
    </>
  );
}
