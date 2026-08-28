// Shared loading placeholders for route-level loading.tsx files. Kept
// dumb on purpose: no data awareness, just shapes that echo the real
// layout so navigation doesn't flash blank white (decision 9, T20 in
// docs/cutover-plan.md).

export function SkeletonText({ width = "100%" }: { width?: string | number }) {
  return <div className="skeleton skeleton-text" style={{ width }} />;
}

export function SkeletonAvatar({ size = 40 }: { size?: number }) {
  return <div className="skeleton skeleton-avatar" style={{ width: size, height: size }} />;
}

/** A profile/host card skeleton -- matches the panel cards used in /explore, /public-trips, /events. */
export function SkeletonCard() {
  return (
    <div className="panel panel-padded" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <SkeletonAvatar size={48} />
        <div style={{ flex: 1 }}>
          <SkeletonText width="60%" />
          <SkeletonText width="40%" />
        </div>
      </div>
      <SkeletonText width="90%" />
      <SkeletonText width="75%" />
    </div>
  );
}

/** Grid of card skeletons -- /explore, /public-trips, /events. */
export function SkeletonCardGrid({ count = 6 }: { count?: number }) {
  return (
    <div className="skeleton-grid">
      {Array.from({ length: count }, (_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );
}

/** A single row in a list -- /dashboard, /messages thread list, /community topics. */
export function SkeletonListRow() {
  return (
    <div className="panel panel-padded" style={{ display: "flex", alignItems: "center", gap: 12 }}>
      <SkeletonAvatar size={40} />
      <div style={{ flex: 1 }}>
        <SkeletonText width="35%" />
        <SkeletonText width="65%" />
      </div>
    </div>
  );
}

export function SkeletonList({ count = 4 }: { count?: number }) {
  return (
    <div className="skeleton-list">
      {Array.from({ length: count }, (_, i) => (
        <SkeletonListRow key={i} />
      ))}
    </div>
  );
}

/** A single-column detail page -- /profile/[id], /events/[id], /community/forum/[id]. */
export function SkeletonDetail() {
  return (
    <div className="panel panel-padded" style={{ display: "flex", flexDirection: "column", gap: 16, maxWidth: 720, margin: "0 auto" }}>
      <SkeletonText width="70%" />
      <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
        <SkeletonAvatar size={40} />
        <SkeletonText width="30%" />
      </div>
      <SkeletonText width="100%" />
      <SkeletonText width="100%" />
      <SkeletonText width="80%" />
    </div>
  );
}
