"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Fades and lifts children in as they enter the viewport. Deliberately not
 * a Motion/Framer dependency -- a single IntersectionObserver covers the
 * "content arrives as you scroll" need this site actually has, without
 * pulling in an animation library for it. Respects prefers-reduced-motion
 * via CSS alone (see .reveal in globals.css), so this component only ever
 * toggles a class -- it never has to branch on the media query itself.
 */
export function Reveal({
  children,
  delay = 0,
  className = "",
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.15 }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={ref} className={`reveal ${visible ? "reveal-visible" : ""} ${className}`} style={{ transitionDelay: `${delay}ms` }}>
      {children}
    </div>
  );
}
