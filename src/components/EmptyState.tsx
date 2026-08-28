import type { ReactNode } from "react";

/**
 * Generic empty state for the ~32 routes that didn't get a bespoke design
 * (decision 9, docs/cutover-plan.md: 3 load-bearing states were hand-designed
 * -- empty explore, blind review, pending vs accepted -- everything else
 * gets this so it's consistent rather than absent).
 */
export function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="empty-state">
      <div className="empty-state-icon">{icon}</div>
      <h3>{title}</h3>
      {description && <p className="text-secondary">{description}</p>}
      {action && <div style={{ marginTop: 16 }}>{action}</div>}
    </div>
  );
}
