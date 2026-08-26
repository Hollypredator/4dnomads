"use client";

import { useState, useTransition } from "react";
import { deleteAccountAction } from "@/lib/actions/account";

export default function DeleteAccountButton() {
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();

  if (!confirming) {
    return (
      <button className="btn btn-danger btn-sm" onClick={() => setConfirming(true)}>
        Delete Account
      </button>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8, alignItems: "flex-end" }}>
      <p className="text-sm" style={{ color: "var(--color-danger, #d33)" }}>
        This cannot be undone. Confirm?
      </p>
      {error && <p className="text-sm">{error}</p>}
      <div style={{ display: "flex", gap: 8 }}>
        <button className="btn btn-ghost btn-sm" onClick={() => setConfirming(false)} disabled={pending}>
          Cancel
        </button>
        <button
          className="btn btn-danger btn-sm"
          disabled={pending}
          onClick={() =>
            startTransition(async () => {
              const result = await deleteAccountAction();
              if (result && !result.ok) setError(result.error);
            })
          }
        >
          {pending ? "Deleting…" : "Yes, delete"}
        </button>
      </div>
    </div>
  );
}
