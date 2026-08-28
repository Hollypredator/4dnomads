"use client";

import { useState } from "react";
import styles from "./donate.module.css";

const PRESETS = [5, 15, 50] as const;

/**
 * Amount picker for the support page.
 *
 * NO PAYMENT PROCESSOR IS CONNECTED. The previous version of this screen had
 * three inert amount buttons, an inert submit, and the line "Secure payment
 * powered by Stripe" -- a claim about handling money that was not true. The
 * selection below is real state, and the submit is honestly disabled with the
 * reason shown, rather than looking live and doing nothing when tapped.
 *
 * To finish: create the Stripe product/prices, add a checkout Server Action
 * that creates a Session, and replace the disabled button with a submit.
 */
export default function DonateForm() {
  const [selected, setSelected] = useState<number | null>(15);
  const [custom, setCustom] = useState("");

  const amount = custom.trim() !== "" ? Number(custom) : selected;
  const validAmount = amount != null && Number.isFinite(amount) && amount >= 1;

  return (
    <>
      <div className={styles.amounts}>
        {PRESETS.map((value) => (
          <button
            key={value}
            type="button"
            aria-pressed={custom.trim() === "" && selected === value}
            className={`${styles.amountBtn} ${custom.trim() === "" && selected === value ? styles.amountBtnActive : ""}`}
            onClick={() => {
              setSelected(value);
              setCustom("");
            }}
          >
            ${value}
          </button>
        ))}
        <div className={styles.customAmount}>
          <span className={styles.currency}>$</span>
          <input
            type="number"
            className="form-input"
            placeholder="Other"
            min="1"
            max="100000"
            inputMode="numeric"
            aria-label="Custom amount in dollars"
            value={custom}
            onChange={(e) => setCustom(e.target.value)}
            style={{ paddingLeft: 28 }}
          />
        </div>
      </div>

      <button className="btn btn-primary btn-full btn-lg" style={{ marginTop: 24 }} disabled>
        {validAmount ? `Support with $${amount}` : "Choose an amount"}
      </button>

      <p className={styles.hint} role="status">
        Donations aren&apos;t open yet — we&apos;re still setting up payments. 4dnomads stays free either way.
      </p>
    </>
  );
}
