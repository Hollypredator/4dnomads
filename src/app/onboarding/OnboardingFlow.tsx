"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { completeOnboardingAction, uploadAvatarAction } from "@/lib/actions/profile";
import { Avatar } from "@/components/Avatar";
import { CameraIcon, ArrowLeftIcon, HouseIcon, MapPinIcon } from "@/components/Icons";
import type { User } from "@/types";
import styles from "./onboarding.module.css";

const STEPS = ["photo", "bio", "tags", "intent"] as const;
type Step = (typeof STEPS)[number];

const SUGGESTED_INTERESTS = [
  "Coding", "Surfing", "Cooking", "Hiking", "Photography",
  "Live music", "Cycling", "Yoga", "Coffee", "Languages",
];

/**
 * Post-signup onboarding.
 *
 * One question per screen rather than a single long form: a new account has
 * nothing in it, and asking for a photo, a bio, languages, interests and
 * hosting intent all at once is the version people abandon. Every step is
 * skippable, and the whole flow is stamped complete either way -- it is an
 * invitation, not a gate.
 *
 * The photo uploads immediately (it needs a round trip anyway and the result
 * is worth showing); everything else is held locally and saved once at the
 * end, so backing up a step never loses what was typed.
 */
export default function OnboardingFlow({ profile }: { profile: User }) {
  const router = useRouter();
  const [step, setStep] = useState<Step>("photo");
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [avatarUrl, setAvatarUrl] = useState(profile.avatarUrl);
  const [preview, setPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const [bio, setBio] = useState(profile.bio ?? "");
  const [languages, setLanguages] = useState(profile.languages?.join(", ") ?? "");
  const [interests, setInterests] = useState<string[]>(profile.interests ?? []);

  const index = STEPS.indexOf(step);

  function next() {
    setError(null);
    if (index < STEPS.length - 1) setStep(STEPS[index + 1]);
  }
  function back() {
    setError(null);
    if (index > 0) setStep(STEPS[index - 1]);
  }

  function finish(wantsToHost: boolean) {
    setError(null);
    startTransition(async () => {
      const result = await completeOnboardingAction({
        bio: bio.trim(),
        languages: languages.split(",").map((s) => s.trim()).filter(Boolean),
        interests,
        wantsToHost,
      });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      // Someone who said they want to host is sent straight to the one form
      // that makes them appear in search; everyone else lands on home.
      router.push(wantsToHost ? "/profile/edit/hosting" : "/");
    });
  }

  async function handlePhoto(file: File) {
    setPreview(URL.createObjectURL(file));
    setUploading(true);
    setError(null);
    const fd = new FormData();
    fd.append("avatar", file);
    const result = await uploadAvatarAction(fd);
    setUploading(false);
    if (result.ok) {
      setAvatarUrl(result.url);
    } else {
      setPreview(null);
      setError(result.error);
    }
  }

  return (
    <div className={styles.screen}>
      <header className={styles.top}>
        {index > 0 ? (
          <button type="button" className={styles.back} onClick={back} aria-label="Back">
            <ArrowLeftIcon size={20} />
          </button>
        ) : (
          <span className={styles.back} />
        )}
        <div className={styles.progress} role="progressbar" aria-valuenow={index + 1} aria-valuemin={1} aria-valuemax={STEPS.length}>
          {STEPS.map((s, i) => (
            <span key={s} className={`${styles.tick} ${i <= index ? styles.tickDone : ""}`} />
          ))}
        </div>
        <span className={styles.count}>{index + 1}/{STEPS.length}</span>
      </header>

      <div className={styles.body}>
        {step === "photo" && (
          <>
            <h1 className={styles.title}>Put a face to your name</h1>
            <p className={styles.sub}>
              Hosts are far more likely to say yes to someone they can see. You can change it later.
            </p>
            <div className={styles.photoBlock}>
              <Avatar src={preview ?? avatarUrl} firstName={profile.firstName} lastName={profile.lastName} size="2xl" />
              <button type="button" className="btn btn-secondary" onClick={() => fileRef.current?.click()} disabled={uploading}>
                <CameraIcon size={16} /> {uploading ? "Uploading…" : avatarUrl ? "Change photo" : "Add a photo"}
              </button>
              <input
                ref={fileRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className={styles.fileInput}
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) void handlePhoto(f);
                }}
              />
            </div>
          </>
        )}

        {step === "bio" && (
          <>
            <h1 className={styles.title}>Tell people who you are</h1>
            <p className={styles.sub}>
              A couple of honest sentences beat a polished paragraph. What you do, what you&apos;re
              travelling for, what a host can expect.
            </p>
            <textarea
              className="form-textarea"
              rows={6}
              maxLength={2000}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="I design apps, I travel slowly, and I always cook for whoever puts me up."
            />
            <span className="form-hint">{bio.length} / 2000</span>
          </>
        )}

        {step === "tags" && (
          <>
            <h1 className={styles.title}>What brings you together?</h1>
            <p className={styles.sub}>Languages you speak, and a few things you&apos;re into.</p>

            <div className="form-group">
              <label className="form-label" htmlFor="ob-languages">Languages</label>
              <input
                id="ob-languages"
                className="form-input"
                value={languages}
                onChange={(e) => setLanguages(e.target.value)}
                placeholder="Turkish, English"
              />
              <span className="form-hint">Separate with commas.</span>
            </div>

            <div className={styles.chipGroup}>
              <span className="form-label">Interests</span>
              <div className={styles.chips}>
                {SUGGESTED_INTERESTS.map((tag) => {
                  const on = interests.includes(tag);
                  return (
                    <button
                      key={tag}
                      type="button"
                      aria-pressed={on}
                      className={`${styles.chip} ${on ? styles.chipOn : ""}`}
                      onClick={() =>
                        setInterests((prev) => (on ? prev.filter((t) => t !== tag) : [...prev, tag]))
                      }
                    >
                      {tag}
                    </button>
                  );
                })}
              </div>
            </div>
          </>
        )}

        {step === "intent" && (
          <>
            <h1 className={styles.title}>How will you start?</h1>
            <p className={styles.sub}>Either way you can do the other later — most people end up doing both.</p>

            <div className={styles.intentGrid}>
              <button type="button" className={styles.intentCard} onClick={() => finish(true)} disabled={pending}>
                <HouseIcon size={28} />
                <span className={styles.intentTitle}>I can host</span>
                <span className={styles.intentSub}>Set up your space so travellers can find you.</span>
              </button>
              <button type="button" className={styles.intentCard} onClick={() => finish(false)} disabled={pending}>
                <MapPinIcon size={28} />
                <span className={styles.intentTitle}>I&apos;m travelling</span>
                <span className={styles.intentSub}>Start browsing hosts and the community.</span>
              </button>
            </div>
          </>
        )}

        {error && (
          <p role="alert" className="text-sm" style={{ color: "var(--color-danger)", marginTop: 12 }}>
            {error}
          </p>
        )}
      </div>

      {step !== "intent" && (
        <footer className={styles.actions}>
          <button type="button" className="btn btn-primary btn-full btn-lg" onClick={next} disabled={uploading}>
            Continue
          </button>
          <button type="button" className={styles.skip} onClick={next}>
            Skip for now
          </button>
        </footer>
      )}

      {step === "intent" && pending && <p className={styles.saving}>Setting up your account…</p>}
    </div>
  );
}
