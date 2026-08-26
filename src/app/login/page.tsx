"use client";

import { useActionState } from "react";
import Link from "next/link";
import { loginAction, type AuthFormState } from "@/lib/actions/auth";
import styles from "./auth.module.css";

const initialState: AuthFormState = {};

export default function LoginPage() {
  const [state, formAction, pending] = useActionState(loginAction, initialState);

  return (
    <div className={styles.page}>
      <div className={`panel panel-padded ${styles.card}`}>
        <h1 className={styles.title}>Welcome Back</h1>
        <p className="text-secondary text-sm text-center" style={{ marginBottom: 24 }}>
          Log in to continue your journey.
        </p>

        <form className={styles.form} action={formAction}>
          <div className="form-group">
            <label className="form-label" htmlFor="email">Email Address</label>
            <input type="email" id="email" name="email" className="form-input" placeholder="nomad@example.com" maxLength={254} required />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="password">Password</label>
            <input type="password" id="password" name="password" className="form-input" placeholder="••••••••" maxLength={200} required />
          </div>

          {state.error && (
            <p role="alert" className="text-sm" style={{ color: "var(--color-danger, #d33)" }}>
              {state.error}
            </p>
          )}

          <button type="submit" className="btn btn-primary btn-full btn-lg" disabled={pending}>
            {pending ? "Logging in…" : "Log In"}
          </button>
        </form>

        <p className={styles.footer}>
          Don&apos;t have an account? <Link href="/register" className={styles.link}>Sign up</Link>
        </p>
      </div>
    </div>
  );
}
