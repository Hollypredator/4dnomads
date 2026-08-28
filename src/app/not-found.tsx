import Link from "next/link";
import { MapIcon } from "@/components/Icons";

export default function NotFound() {
  return (
    <div style={{ textAlign: "center", padding: "120px 24px" }}>
      <div style={{ display: "flex", justifyContent: "center", marginBottom: 16, color: "var(--primary)" }}>
        <MapIcon size={64} />
      </div>
      <h1 style={{ fontSize: "2.25rem", marginBottom: 8 }}>Page Not Found</h1>
      <p style={{ color: "var(--text-secondary)", marginBottom: 32, maxWidth: 400, margin: "0 auto 32px" }}>
        Looks like you wandered off the trail. This page doesn&apos;t exist.
      </p>
      <Link href="/" className="btn btn-primary btn-lg">
        Back to Home
      </Link>
    </div>
  );
}
